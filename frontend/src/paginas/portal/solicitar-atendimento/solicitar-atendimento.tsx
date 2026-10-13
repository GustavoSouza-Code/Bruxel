import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Cabecalho } from "../../../componentes/layout/Cabecalho/Cabecalho";
import { Rodape } from "../../../componentes/layout/Rodape/Rodape";
import { Container } from "../../../componentes/layout/Container/Container";
import { useAtendimentos } from "../../../contexto/useAtendimentos";
import { useAutenticacao } from "../../../contexto/useAutenticacao";
import { CAMPOS_ENDERECO, formatarEndereco } from "../../../crud/usuarios/camposUsuario";
import { contatoDoUsuario, validarContato } from "../../../crud/atendimentos/contatoAtendimento";
import { DESCRICAO_MAX, validarSolicitacao } from "../../../crud/atendimentos/validarSolicitacao";
import type { ErrosSolicitacao, RascunhoSolicitacao } from "../../../crud/atendimentos/validarSolicitacao";
import {
  SEM_PREFERENCIA,
  diaTemHorarioLivre,
  diasDaAgenda,
  formatarAgendamento,
  horarioEstaLivre,
  nomeDoTecnico,
  primeiroTecnicoLivre,
} from "../../../crud/atendimentos/agenda";
import {
  ESCOLHA_CLIENTE_INICIAL,
  clienteDoAtendimento,
  validarClienteDaLoja,
} from "../../../crud/atendimentos/clienteDaLoja";
import type { EscolhaCliente } from "../../../crud/atendimentos/clienteDaLoja";
import { TECNICOS } from "../../../dados/tecnicos";
import type { ContatoAtendimento, HorarioVisita } from "../../../tipos/atendimento";
import { usePerfil } from "../perfil/usePerfil";
import { SeletorCliente } from "./componentes/SeletorCliente/SeletorCliente";
import { SeletorTipoServico } from "./componentes/SeletorTipoServico/SeletorTipoServico";
import { SeletorAtendente } from "./componentes/SeletorAtendente/SeletorAtendente";
import { SeletorDiaHorario } from "./componentes/SeletorDiaHorario/SeletorDiaHorario";
import { CampoFotos } from "./componentes/CampoFotos/CampoFotos";
import type { FotoSelecionada } from "./componentes/CampoFotos/CampoFotos";
import "./solicitar-atendimento.css";

/** O rascunho sem o contato: o contato é calculado à parte (do perfil do cliente, ou da conta escolhida pelo admin). */
type CamposRascunho = Omit<RascunhoSolicitacao, "contato">;

const RASCUNHO_INICIAL: CamposRascunho = {
  tipo: null,
  descricao: "",
  tecnico: SEM_PREFERENCIA,
  data: "",
  horario: null,
};

// depois de um envio pela loja, cliques no "Enviar" dentro deste intervalo são o resto de um duplo clique
const INTERVALO_DUPLO_CLIQUE_MS = 1000;

/** A conta do cliente escolhido; null quando ninguém foi escolhido ou o cliente não tem cadastro. */
function contaDaEscolha(escolha: EscolhaCliente) {
  return escolha.tipo === "cadastrado" ? (escolha.usuario?.id ?? null) : null;
}

/**
 * Formulário de pedido de visita técnica (rota "/solicitar-atendimento", só pra quem está logado).
 * Os blocos — tipo, descrição, fotos, atendente e horário, e contato — são numerados pelo CSS
 * (counter), então dá pra incluir um bloco no meio sem renumerar nada.
 *
 * Cliente: o contato vem do próprio perfil — completo, aparece só um resumo com "Alterar";
 * incompleto (ou se a busca do perfil falhar), os campos já abrem pra digitar. Mudar o contato
 * aqui vale só pra este atendimento. Ao enviar, vai pra aba "Atendimentos" do /perfil com um aviso.
 *
 * Administrador (abrindo pela loja): ganha o bloco "Cliente" no topo (uma conta cadastrada ou só o
 * nome de quem não tem conta), o contato vem da conta escolhida e, ao enviar, fica na página com
 * um aviso e o formulário limpo, pronto pro próximo cliente.
 *
 * Os pedidos vão pro ProvedorAtendimentos (em memória, sem backend ainda).
 */
export function PaginaSolicitarAtendimento() {
  const { solicitarAtendimento, ocupacoes } = useAtendimentos();
  const navigate = useNavigate();
  const { usuario, ehAdmin } = useAutenticacao();
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
  // trava contra duplo clique: um segundo submit antes de a página trocar não cria outro atendimento
  const enviadoRef = useRef(false);
  // quando foi o último envio pela loja: o formulário volta limpo na hora, então o 2º clique de um
  // duplo clique validaria o formulário vazio e encheria a tela de erros logo depois do aviso
  const ultimoEnvioLojaRef = useRef(0);
  // admin abrindo pela loja: quem é o cliente, o erro do bloco "Cliente" e o aviso depois do envio
  const [escolhaCliente, setEscolhaCliente] = useState<EscolhaCliente>(ESCOLHA_CLIENTE_INICIAL);
  const [erroCliente, setErroCliente] = useState<string | null>(null);
  const [avisoLoja, setAvisoLoja] = useState<string | null>(null);
  // muda a cada envio do admin: recria o SeletorCliente, que volta com a busca vazia
  const [envios, setEnvios] = useState(0);
  const [fotos, setFotos] = useState<FotoSelecionada[]>([]);
  // cópia das fotos pra limpeza ao sair da página (o cleanup do useEffect não enxerga o estado atual)
  const fotosRef = useRef<FotoSelecionada[]>([]);

  // ao sair sem enviar, libera as URLs temporárias das miniaturas; se enviou,
  // as URLs continuam valendo, porque foram pro ProvedorAtendimentos
  useEffect(() => {
    return () => {
      if (enviadoRef.current) return;
      fotosRef.current.forEach((foto) => URL.revokeObjectURL(foto.url));
    };
  }, []);

  function mudarFotos(novas: FotoSelecionada[]) {
    setFotos(novas);
    fotosRef.current = novas;
  }

  // de onde vem o contato: pro admin, da conta do cliente escolhido (sem cadastro, de lugar nenhum);
  // pro cliente, do próprio perfil. O endereço do admin nunca entra num pedido de outra pessoa
  const usuarioBase = ehAdmin ? (escolhaCliente.tipo === "cadastrado" ? escolhaCliente.usuario : null) : perfil;
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

  // trocar de atendente pode deixar o dia ou o horário escolhidos sem vaga: aí eles são limpos
  function escolherTecnico(escolha: string) {
    const diaContinua = rascunho.data !== "" && diaTemHorarioLivre(escolha, rascunho.data, ocupacoes);
    const horarioContinua =
      diaContinua &&
      rascunho.horario !== null &&
      horarioEstaLivre(escolha, rascunho.data, rascunho.horario, ocupacoes);
    setRascunho((atual) => ({
      ...atual,
      tecnico: escolha,
      data: diaContinua ? atual.data : "",
      horario: horarioContinua ? atual.horario : null,
    }));
    limparErro("tecnico");
    // o dia ou o horário que foi limpo leva junto o erro que era dele
    if (rascunho.data !== "" && !diaContinua) limparErro("data");
    if (rascunho.horario !== null && !horarioContinua) limparErro("horario");
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
  // (escolher, trocar ou largar uma conta cadastrada, que traz o próprio contato). Passar de
  // "ninguém escolhido" pra "sem cadastro" (ou voltar pra busca), ou corrigir o nome, mantém o contato
  function escolherCliente(escolha: EscolhaCliente) {
    const mesmaConta = contaDaEscolha(escolha) === contaDaEscolha(escolhaCliente);
    setEscolhaCliente(escolha);
    setErroCliente(null);
    // o aviso do envio anterior sai quando o atendente começa o próximo cliente
    if (escolha.tipo !== escolhaCliente.tipo || !mesmaConta) setAvisoLoja(null);
    if (mesmaConta) return;
    setContatoEditado(null);
    setEditandoContato(false);
    (Object.keys(contatoBase) as (keyof ContatoAtendimento)[]).forEach(limparErro);
  }

  function enviar(evento: FormEvent) {
    evento.preventDefault();
    if (enviadoRef.current) return;
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
    const encontrados = validarSolicitacao(completo, hoje, ocupacoes);
    // pela loja, o cliente também precisa estar escolhido
    const problemaCliente = ehAdmin ? validarClienteDaLoja(escolhaCliente) : null;
    setErroCliente(problemaCliente);
    if (Object.keys(encontrados).length > 0 || problemaCliente) {
      setErros(encontrados);
      // depois que o React mostrar as mensagens, rola até o primeiro bloco com erro
      requestAnimationFrame(() => {
        document
          .querySelector(".pagina-atendimento__erro")
          ?.closest("fieldset")
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
      return;
    }

    const { tipo, horario } = completo;
    // a validação já garante os dois; o if é só pro TypeScript saber que não são null
    if (!tipo || !horario) return;
    // "Sem preferência" vira o primeiro atendente livre naquele dia e horário
    const tecnicoId =
      completo.tecnico === SEM_PREFERENCIA
        ? primeiroTecnicoLivre(completo.data, horario, ocupacoes)
        : completo.tecnico;
    // a validação também já garantiu que tem alguém livre
    if (!tecnicoId) return;

    // pela loja, o cliente é o escolhido no bloco "Cliente"; pelo site, é quem está logado
    const cliente = ehAdmin
      ? clienteDoAtendimento(escolhaCliente)
      : { id: usuario?.id ?? null, nome: usuario?.nome ?? "" };
    enviadoRef.current = true;
    solicitarAtendimento({
      tipo,
      descricao: completo.descricao.trim(),
      fotos: fotos.map((foto) => foto.url),
      cliente,
      abertoNaLoja: ehAdmin,
      tecnicoId,
      data: completo.data,
      horario,
      contato,
    });
    const agendamento = formatarAgendamento(completo.data, horario, nomeDoTecnico(tecnicoId));
    if (ehAdmin) {
      // no balcão o atendente abre vários seguidos: fica na página, com o aviso e o formulário limpo
      setAvisoLoja(`Atendimento aberto para ${cliente.nome}: ${agendamento}.`);
      setRascunho(RASCUNHO_INICIAL);
      setEscolhaCliente(ESCOLHA_CLIENTE_INICIAL);
      setEnvios((atual) => atual + 1);
      setContatoEditado(null);
      setEditandoContato(false);
      setErros({});
      // as fotos foram pro pedido: só esvazia o campo, sem revogar as URLs
      mudarFotos([]);
      // libera o próximo envio; o resto de um duplo clique é barrado pelo ultimoEnvioLojaRef
      enviadoRef.current = false;
      ultimoEnvioLojaRef.current = Date.now();
      window.scrollTo(0, 0);
      return;
    }
    const mensagem = `Pedido enviado! Horário reservado pra ${agendamento}. A Bruxel confirma a visita com você.`;
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
                <SeletorCliente key={envios} escolha={escolhaCliente} onChange={escolherCliente} />
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
                Fotos do problema <span className="pagina-atendimento__opcional">(opcional)</span>
              </legend>
              <CampoFotos key={envios} fotos={fotos} onChange={mudarFotos} />
            </fieldset>

            <fieldset className="pagina-atendimento__bloco">
              <legend className="pagina-atendimento__titulo-bloco">Atendente e horário</legend>
              <SeletorAtendente tecnicos={TECNICOS} valor={rascunho.tecnico} onChange={escolherTecnico} />
              {erros.tecnico && (
                <p className="pagina-atendimento__erro" role="alert">
                  {erros.tecnico}
                </p>
              )}
              <SeletorDiaHorario
                dias={dias}
                escolha={rascunho.tecnico}
                ocupacoes={ocupacoes}
                data={rascunho.data}
                horario={rascunho.horario}
                onChangeData={escolherDia}
                onChangeHorario={(horario: HorarioVisita) => atualizarCampo("horario", horario)}
              />
              <p className="pagina-atendimento__dica">
                O horário fica reservado e a Bruxel confirma a visita com você.
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

            <div className="pagina-atendimento__acoes">
              {/* o bloco do contato ainda está carregando: enviar agora validaria um contato vazio que a pessoa nem vê */}
              <button
                type="submit"
                className="pagina-atendimento__enviar"
                disabled={esperandoPerfil}
                aria-busy={esperandoPerfil}
              >
                Enviar solicitação
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
