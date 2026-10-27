import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Cabecalho } from "../../../componentes/layout/Cabecalho/Cabecalho";
import { Rodape } from "../../../componentes/layout/Rodape/Rodape";
import { Container } from "../../../componentes/layout/Container/Container";
import { errosPorCampo, mensagemDeErro } from "../../../api/cliente";
import { criarAtendimento } from "../../../api/atendimentos";
import { useAutenticacao } from "../../../contexto/useAutenticacao";
import { CAMPOS_ENDERECO, formatarEndereco } from "../../../crud/usuarios/camposUsuario";
import { contatoDoUsuario, validarContato } from "../../../crud/atendimentos/contatoAtendimento";
import { DESCRICAO_MAX, validarSolicitacao } from "../../../crud/atendimentos/validarSolicitacao";
import type { ErrosSolicitacao, RascunhoSolicitacao } from "../../../crud/atendimentos/validarSolicitacao";
import { diasDaAgenda, formatarAgendamento } from "../../../crud/atendimentos/agenda";
import { validarClienteDaLoja } from "../../../crud/atendimentos/clienteDaLoja";
import type { ContatoAtendimento, HorarioVisita } from "../../../tipos/atendimento";
import type { Usuario } from "../../../tipos/usuario";
import { usePerfil } from "../perfil/usePerfil";
import { SeletorCliente } from "./componentes/SeletorCliente/SeletorCliente";
import { SeletorTipoServico } from "./componentes/SeletorTipoServico/SeletorTipoServico";
import { SeletorDiaHorario } from "./componentes/SeletorDiaHorario/SeletorDiaHorario";
import { CampoFotoLink } from "./componentes/CampoFotoLink/CampoFotoLink";
import "./solicitar-atendimento.css";

/** O rascunho sem o contato: o contato é calculado à parte (do perfil do cliente, ou da conta escolhida pelo admin). */
type CamposRascunho = Omit<RascunhoSolicitacao, "contato">;

const RASCUNHO_INICIAL: CamposRascunho = {
  tipo: null,
  descricao: "",
  fotoUrl: "",
  data: "",
  horario: null,
};

// depois de um envio pela loja, cliques no "Enviar" dentro deste intervalo são o resto de um duplo clique
const INTERVALO_DUPLO_CLIQUE_MS = 1000;

/**
 * Formulário de pedido de visita técnica (rota "/solicitar-atendimento", só pra quem está logado).
 * Os blocos — tipo, descrição, foto, dia e horário, e contato — são numerados pelo CSS
 * (counter), então dá pra incluir um bloco no meio sem renumerar nada.
 *
 * Cliente: o contato vem do próprio perfil — completo, aparece só um resumo com "Alterar";
 * incompleto (ou se a busca do perfil falhar), os campos já abrem pra digitar. Mudar o contato
 * aqui vale só pra este atendimento. Ao enviar, vai pra aba "Atendimentos" do /perfil com um aviso.
 *
 * Administrador (abrindo pela loja): ganha o bloco "Cliente" no topo (uma conta cadastrada), o
 * contato vem da conta escolhida e, ao enviar, fica na página com um aviso e o formulário limpo,
 * pronto pro próximo cliente.
 *
 * O pedido vai pro POST /appointments. Se o backend recusar, o que foi digitado fica na tela, com
 * o erro geral embaixo do formulário e os erros por campo em cada bloco.
 */
export function PaginaSolicitarAtendimento() {
  const navigate = useNavigate();
  const { token, ehAdmin } = useAutenticacao();
  // perfil de quem está logado, pra pré-preencher o contato; se a busca falhar
  // (ex.: 403 enquanto o backend não libera o próprio usuário), o cliente digita
  const { dados: perfil, carregando: carregandoPerfil } = usePerfil();

  const [rascunho, setRascunho] = useState<CamposRascunho>(RASCUNHO_INICIAL);
  // contato digitado aqui; null = não mexeu, então vale o do perfil
  const [contatoEditado, setContatoEditado] = useState<ContatoAtendimento | null>(null);
  // true depois de clicar em "Alterar" no resumo do contato
  const [editandoContato, setEditandoContato] = useState(false);
  // erros da última tentativa de envio; cada um some quando a pessoa mexe no campo
  const [erros, setErros] = useState<ErrosSolicitacao>({});
  // dias da faixa (amanhã em diante, sem domingo): calculados na montagem (o render não pode chamar
  // new Date()) e de novo no envio, caso a página tenha ficado aberta de um dia pro outro
  const [dias, setDias] = useState(() => diasDaAgenda(new Date()));
  // trava contra duplo clique: um segundo submit enquanto o primeiro está indo não cria outro atendimento
  const enviandoRef = useRef(false);
  // true enquanto o POST está em andamento (o botão mostra "Enviando…")
  const [enviando, setEnviando] = useState(false);
  // erro geral do envio (sem conexão, recusa do backend); os por campo vão pro `erros`
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);
  // quando foi o último envio pela loja: o formulário volta limpo na hora, então o 2º clique de um
  // duplo clique validaria o formulário vazio e encheria a tela de erros logo depois do aviso
  const ultimoEnvioLojaRef = useRef(0);
  // admin abrindo pela loja: quem é o cliente, o erro do bloco "Cliente" e o aviso depois do envio
  const [cliente, setCliente] = useState<Usuario | null>(null);
  const [erroCliente, setErroCliente] = useState<string | null>(null);
  const [avisoLoja, setAvisoLoja] = useState<string | null>(null);
  // muda a cada envio do admin: recria o SeletorCliente, que volta com a busca vazia
  const [envios, setEnvios] = useState(0);
  // de onde vem o contato: pro admin, da conta do cliente escolhido; pro cliente, do próprio perfil.
  // O endereço do admin nunca entra num pedido de outra pessoa
  const usuarioBase = ehAdmin ? cliente : perfil;
  // o contato é derivado a cada renderização, em vez de um useEffect copiar a base pro estado
  const contatoBase = contatoDoUsuario(usuarioBase);
  const contato = contatoEditado ?? contatoBase;
  const baseTemContato = Object.keys(validarContato(contatoBase)).length === 0;
  const mostrarCamposContato = editandoContato || !baseTemContato;
  // só o cliente espera o próprio perfil carregar; o admin usa a conta do cliente escolhido
  const esperandoPerfil = !ehAdmin && carregandoPerfil;

  function limparErro(campo: keyof ErrosSolicitacao) {
    setErros((atuais) => {
      if (!atuais[campo]) return atuais;
      const restantes = { ...atuais };
      delete restantes[campo];
      return restantes;
    });
  }

  // troca um campo do rascunho; o tipo genérico garante que o valor combina com o campo
  function atualizarCampo<C extends keyof CamposRascunho>(campo: C, valor: CamposRascunho[C]) {
    setRascunho((atual) => ({ ...atual, [campo]: valor }));
    limparErro(campo);
  }

  // outro dia, outros horários: o horário escolhido antes é limpo
  function escolherDia(data: string) {
    setRascunho((atual) => ({ ...atual, data, horario: null }));
    limparErro("data");
  }

  function atualizarContato(campo: keyof ContatoAtendimento, valor: string) {
    // a primeira edição parte do contato do perfil
    setContatoEditado((atual) => ({ ...(atual ?? contatoBase), [campo]: valor }));
    limparErro(campo);
  }

  function alterarContato() {
    setContatoEditado(contato);
    setEditandoContato(true);
  }

  function usarContatoDoPerfil() {
    setContatoEditado(null);
    setEditandoContato(false);
    // erros do contato digitado não valem pro contato do perfil
    (Object.keys(contatoBase) as (keyof ContatoAtendimento)[]).forEach(limparErro);
  }

  // o contato digitado é de quem está no balcão: só é descartado quando a conta do cliente muda
  function escolherCliente(novo: Usuario | null) {
    const mesmaConta = novo?.id === cliente?.id;
    setCliente(novo);
    setErroCliente(null);
    if (mesmaConta) return;
    // o aviso do envio anterior sai quando o atendente começa o próximo cliente
    setAvisoLoja(null);
    setContatoEditado(null);
    setEditandoContato(false);
    (Object.keys(contatoBase) as (keyof ContatoAtendimento)[]).forEach(limparErro);
  }

  // depois que o React mostrar as mensagens, rola até o primeiro bloco com erro
  function rolarAtePrimeiroErro() {
    requestAnimationFrame(() => {
      document
        .querySelector(".pagina-atendimento__erro")
        ?.closest("fieldset")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    if (enviandoRef.current || !token) return;
    // resto de um duplo clique logo depois de um envio pela loja: ignora
    if (ehAdmin && Date.now() - ultimoEnvioLojaRef.current < INTERVALO_DUPLO_CLIQUE_MS) return;

    // a página pode ficar aberta de um dia pro outro (a do balcão fica o dia todo): se a faixa de
    // dias mudou, ela é atualizada, e um dia escolhido que saiu dela deixa de valer
    const hoje = new Date();
    const diasDeHoje = diasDaAgenda(hoje);
    let rascunhoAtual = rascunho;
    if (diasDeHoje[0] !== dias[0]) {
      setDias(diasDeHoje);
      if (rascunhoAtual.data !== "" && !diasDeHoje.includes(rascunhoAtual.data)) {
        rascunhoAtual = { ...rascunhoAtual, data: "", horario: null };
        setRascunho(rascunhoAtual);
      }
    }
    const completo: RascunhoSolicitacao = { ...rascunhoAtual, contato };
    const encontrados = validarSolicitacao(completo, hoje);
    // pela loja, o cliente também precisa estar escolhido
    const problemaCliente = ehAdmin ? validarClienteDaLoja(cliente) : null;
    setErroCliente(problemaCliente);
    setErroEnvio(null);
    if (Object.keys(encontrados).length > 0 || problemaCliente) {
      setErros(encontrados);
      rolarAtePrimeiroErro();
      return;
    }

    const { tipo, horario } = completo;
    // a validação já garante os dois; o if é só pro TypeScript saber que não são null
    if (!tipo || !horario) return;
    enviandoRef.current = true;
    setEnviando(true);
    try {
      await criarAtendimento(token, {
        tipo,
        descricao: completo.descricao,
        fotoUrl: completo.fotoUrl.trim() || null,
        // pela loja, o pedido é do cliente escolhido; pelo site, o backend usa quem está logado
        clienteId: ehAdmin ? (cliente?.id ?? null) : null,
        data: completo.data,
        horario,
        contato,
      });
    } catch (falha) {
      // o backend chama os campos pelos nomes do banco; aqui cada um vai pro bloco certo da tela
      const porCampo = errosPorCampo(falha);
      const { data_hora, foto_url, usuario_id, ...outros } = porCampo;
      setErros({
        ...(outros as ErrosSolicitacao),
        ...(data_hora ? { horario: data_hora } : {}),
        ...(foto_url ? { fotoUrl: foto_url } : {}),
      });
      if (usuario_id) setErroCliente(usuario_id);
      setErroEnvio(mensagemDeErro(falha));
      if (Object.keys(porCampo).length > 0) rolarAtePrimeiroErro();
      return;
    } finally {
      enviandoRef.current = false;
      setEnviando(false);
    }

    const agendamento = formatarAgendamento(completo.data, horario, null);
    if (ehAdmin) {
      // no balcão o atendente abre vários seguidos: fica na página, com o aviso e o formulário limpo
      setAvisoLoja(`Atendimento aberto para ${cliente?.nome ?? "o cliente"}: ${agendamento}.`);
      setRascunho(RASCUNHO_INICIAL);
      setCliente(null);
      setEnvios((atual) => atual + 1);
      setContatoEditado(null);
      setEditandoContato(false);
      setErros({});
      // o resto de um duplo clique é barrado pelo ultimoEnvioLojaRef
      ultimoEnvioLojaRef.current = Date.now();
      window.scrollTo(0, 0);
      return;
    }
    const mensagem = `Pedido enviado pra ${agendamento}! A Bruxel confirma a visita com você.`;
    // o /perfil abre na mesma rolagem desta página (lá embaixo); volta pro topo pra o aviso aparecer
    window.scrollTo(0, 0);
    // replace: o botão Voltar do navegador não retorna pro formulário que já foi enviado
    navigate("/perfil", { replace: true, state: { aba: "atendimentos", mensagem } });
  }

  return (
    <>
      <Cabecalho />

      <section className="pagina-atendimento">
        <Container>
          <nav className="pagina-atendimento__trilha" aria-label="breadcrumb">
            <Link to="/">Home</Link>
            <span>›</span>
            <Link to="/perfil">Minha conta</Link>
            <span>›</span>
            <span>Solicitar atendimento</span>
          </nav>

          {ehAdmin && <span className="pagina-atendimento__etiqueta-loja">Abrindo pela loja</span>}
          <h1 className="pagina-atendimento__titulo">Solicitar atendimento</h1>
          <p className="pagina-atendimento__subtitulo">
            {ehAdmin
              ? "Preencha com os dados do cliente que está sendo atendido."
              : "Conte o que está acontecendo com a sua piscina e a Bruxel confirma a visita com você."}
          </p>
          {/* a região fica sempre montada pro admin: o leitor de tela só anuncia texto que entra numa região que já existia */}
          {ehAdmin && (
            <div role="status">
              {avisoLoja && <p className="pagina-atendimento__aviso">{avisoLoja}</p>}
            </div>
          )}

          {/* noValidate: as mensagens vêm do validarSolicitacao, não dos balões do navegador */}
          <form className="pagina-atendimento__formulario" onSubmit={enviar} noValidate>
            {/* só pra admin: vira o bloco 1 (o counter do CSS renumera os outros sozinho) */}
            {ehAdmin && (
              <fieldset className="pagina-atendimento__bloco">
                <legend className="pagina-atendimento__titulo-bloco">Cliente</legend>
                <SeletorCliente key={envios} cliente={cliente} onChange={escolherCliente} />
                {erroCliente && (
                  <p className="pagina-atendimento__erro" role="alert">
                    {erroCliente}
                  </p>
                )}
              </fieldset>
            )}

            <fieldset className="pagina-atendimento__bloco">
              <legend className="pagina-atendimento__titulo-bloco">Tipo de serviço</legend>
              <SeletorTipoServico valor={rascunho.tipo} onChange={(tipo) => atualizarCampo("tipo", tipo)} />
              {erros.tipo && (
                <p className="pagina-atendimento__erro" role="alert">
                  {erros.tipo}
                </p>
              )}
            </fieldset>

            <fieldset className="pagina-atendimento__bloco">
              <legend className="pagina-atendimento__titulo-bloco" id="titulo-descricao">
                Descreva o problema
              </legend>
              <textarea
                className="pagina-atendimento__descricao"
                aria-labelledby="titulo-descricao"
                aria-invalid={Boolean(erros.descricao)}
                placeholder="Ex.: a bomba não desliga e está vazando água pelo filtro."
                value={rascunho.descricao}
                onChange={(e) => atualizarCampo("descricao", e.target.value)}
                maxLength={DESCRICAO_MAX}
                rows={5}
              />
              <p className="pagina-atendimento__contador">
                {rascunho.descricao.length}/{DESCRICAO_MAX}
              </p>
              {erros.descricao && (
                <p className="pagina-atendimento__erro" role="alert">
                  {erros.descricao}
                </p>
              )}
            </fieldset>

            <fieldset className="pagina-atendimento__bloco">
              <legend className="pagina-atendimento__titulo-bloco">
                Foto do problema <span className="pagina-atendimento__opcional">(opcional)</span>
              </legend>
              <CampoFotoLink
                valor={rascunho.fotoUrl}
                onChange={(valor) => atualizarCampo("fotoUrl", valor)}
                erro={erros.fotoUrl}
              />
            </fieldset>

            <fieldset className="pagina-atendimento__bloco">
              <legend className="pagina-atendimento__titulo-bloco">Dia e horário</legend>
              <SeletorDiaHorario
                dias={dias}
                data={rascunho.data}
                horario={rascunho.horario}
                onChangeData={escolherDia}
                onChangeHorario={(horario: HorarioVisita) => atualizarCampo("horario", horario)}
              />
              <p className="pagina-atendimento__dica">
                A Bruxel confirma o horário e quem vai fazer a visita com você.
              </p>
              {erros.data && (
                <p className="pagina-atendimento__erro" role="alert">
                  {erros.data}
                </p>
              )}
              {erros.horario && (
                <p className="pagina-atendimento__erro" role="alert">
                  {erros.horario}
                </p>
              )}
            </fieldset>

            <fieldset className="pagina-atendimento__bloco">
              <legend className="pagina-atendimento__titulo-bloco">
                {ehAdmin ? "Onde e como falar com o cliente" : "Onde e como falar com você"}
              </legend>

              {esperandoPerfil ? (
                <p className="pagina-atendimento__dica">Carregando seus dados…</p>
              ) : mostrarCamposContato ? (
                <div className="pagina-atendimento__campos-contato">
                  <label>
                    Telefone (com DDD)
                    <input
                      type="tel"
                      placeholder="(51) 99999-0000"
                      value={contato.telefone}
                      onChange={(e) => atualizarContato("telefone", e.target.value)}
                      maxLength={20}
                      aria-invalid={Boolean(erros.telefone)}
                    />
                    {erros.telefone && (
                      <span className="pagina-atendimento__erro" role="alert">
                        {erros.telefone}
                      </span>
                    )}
                  </label>
                  {/* mesmos campos (e mesmas normalizações de UF e CEP) do endereço do perfil */}
                  {CAMPOS_ENDERECO.map(({ campo, label, maxLength, normalizar }) => (
                    <label key={campo}>
                      {label}
                      <input
                        type="text"
                        value={contato[campo]}
                        onChange={(e) =>
                          atualizarContato(campo, normalizar ? normalizar(e.target.value) : e.target.value)
                        }
                        maxLength={maxLength}
                        aria-invalid={Boolean(erros[campo])}
                      />
                      {erros[campo] && (
                        <span className="pagina-atendimento__erro" role="alert">
                          {erros[campo]}
                        </span>
                      )}
                    </label>
                  ))}
                  {editandoContato && baseTemContato && (
                    <button type="button" className="pagina-atendimento__usar-perfil" onClick={usarContatoDoPerfil}>
                      {ehAdmin ? "Usar o endereço da conta do cliente" : "Usar o endereço do meu perfil"}
                    </button>
                  )}
                </div>
              ) : (
                <div className="pagina-atendimento__resumo-contato">
                  <div>
                    <p>{formatarEndereco(contato)}</p>
                    {/* o banco guarda só os 8 dígitos; na tela vai com hífen (95900-000) */}
                    {contato.cep && <p>CEP {contato.cep.replace(/^(\d{5})(\d{3})$/, "$1-$2")}</p>}
                    <p>{contato.telefone}</p>
                  </div>
                  <button type="button" className="pagina-atendimento__alterar" onClick={alterarContato}>
                    Alterar
                  </button>
                </div>
              )}

              <p className="pagina-atendimento__dica">
                {ehAdmin
                  ? "Vale só pra este atendimento."
                  : "Vale só pra este atendimento: o endereço do seu perfil não muda."}
              </p>
            </fieldset>

            {erroEnvio && (
              <p className="pagina-atendimento__erro pagina-atendimento__erro-envio" role="alert">
                {erroEnvio}
              </p>
            )}

            <div className="pagina-atendimento__acoes">
              {/* o bloco do contato ainda está carregando: enviar agora validaria um contato vazio que a pessoa nem vê */}
              <button
                type="submit"
                className="pagina-atendimento__enviar"
                disabled={esperandoPerfil || enviando}
                aria-busy={esperandoPerfil || enviando}
              >
                {enviando ? "Enviando…" : "Enviar solicitação"}
              </button>
              <Link to="/" className="pagina-atendimento__cancelar">
                Cancelar
              </Link>
            </div>
          </form>
        </Container>
      </section>

      <Rodape />
    </>
  );
}

export default PaginaSolicitarAtendimento;
