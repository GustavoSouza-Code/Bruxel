import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Cabecalho } from "../../../componentes/layout/Cabecalho/Cabecalho";
import { Rodape } from "../../../componentes/layout/Rodape/Rodape";
import { Container } from "../../../componentes/layout/Container/Container";
import { useAtendimentos } from "../../../contexto/useAtendimentos";
import { CAMPOS_ENDERECO, formatarEndereco } from "../../../crud/usuarios/camposUsuario";
import { contatoDoUsuario, validarContato } from "../../../crud/atendimentos/contatoAtendimento";
import { dataMinima } from "../../../crud/atendimentos/datasAtendimento";
import { DESCRICAO_MAX, validarSolicitacao } from "../../../crud/atendimentos/validarSolicitacao";
import type { ErrosSolicitacao, RascunhoSolicitacao } from "../../../crud/atendimentos/validarSolicitacao";
import type { ContatoAtendimento } from "../../../tipos/atendimento";
import { usePerfil } from "../perfil/usePerfil";
import { SeletorTipoServico } from "./componentes/SeletorTipoServico/SeletorTipoServico";
import { SeletorQuando } from "./componentes/SeletorQuando/SeletorQuando";
import "./solicitar-atendimento.css";

/** O rascunho sem o contato: o contato é calculado à parte, a partir do perfil. */
type CamposRascunho = Omit<RascunhoSolicitacao, "contato">;

const RASCUNHO_INICIAL: CamposRascunho = { tipo: null, descricao: "", dataPreferida: "", periodo: null };

// aviso que o /perfil mostra na aba Atendimentos depois do envio
const MENSAGEM_ENVIADO = "Solicitação enviada! A Bruxel vai entrar em contato pra confirmar a visita.";

/**
 * Formulário em que o cliente pede uma visita técnica (rota "/solicitar-atendimento",
 * só pra quem está logado). Os blocos são numerados pelo CSS (counter), então
 * dá pra incluir um bloco no meio sem renumerar nada.
 *
 * O contato vem do perfil: completo, aparece só um resumo com "Alterar";
 * incompleto (ou se a busca do perfil falhar), os campos já abrem pra digitar.
 * Mudar o contato aqui vale só pra este atendimento.
 *
 * Ao enviar, guarda no ProvedorAtendimentos (em memória, sem backend ainda) e
 * leva pra aba "Atendimentos" do /perfil com um aviso.
 */
export function PaginaSolicitarAtendimento() {
  const { solicitarAtendimento } = useAtendimentos();
  const navigate = useNavigate();
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
  // primeiro dia aceito no calendário; o inicializador roda uma vez só (o render não pode chamar new Date())
  const [minimo] = useState(() => dataMinima(new Date()));
  // trava contra duplo clique: um segundo submit antes de a página trocar não cria outro atendimento
  const enviadoRef = useRef(false);

  // o contato é derivado a cada renderização, em vez de um useEffect copiar o perfil pro estado
  const contatoPerfil = contatoDoUsuario(perfil);
  const contato = contatoEditado ?? contatoPerfil;
  const perfilTemContato = Object.keys(validarContato(contatoPerfil)).length === 0;
  const mostrarCamposContato = editandoContato || !perfilTemContato;

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

  function atualizarContato(campo: keyof ContatoAtendimento, valor: string) {
    // a primeira edição parte do contato do perfil
    setContatoEditado((atual) => ({ ...(atual ?? contatoPerfil), [campo]: valor }));
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
    (Object.keys(contatoPerfil) as (keyof ContatoAtendimento)[]).forEach(limparErro);
  }

  function enviar(evento: FormEvent) {
    evento.preventDefault();
    if (enviadoRef.current) return;

    const completo: RascunhoSolicitacao = { ...rascunho, contato };
    const encontrados = validarSolicitacao(completo, new Date());
    if (Object.keys(encontrados).length > 0) {
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

    const { tipo, periodo } = completo;
    // a validação já garante os dois; o if é só pro TypeScript saber que não são null
    if (!tipo || !periodo) return;

    enviadoRef.current = true;
    solicitarAtendimento({
      tipo,
      periodo,
      descricao: completo.descricao.trim(),
      dataPreferida: completo.dataPreferida,
      fotos: [],
      contato,
    });
    navigate("/perfil", { state: { aba: "atendimentos", mensagem: MENSAGEM_ENVIADO } });
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

          <h1 className="pagina-atendimento__titulo">Solicitar atendimento</h1>
          <p className="pagina-atendimento__subtitulo">
            Conte o que está acontecendo com a sua piscina e a Bruxel confirma a visita com você.
          </p>

          {/* noValidate: as mensagens vêm do validarSolicitacao, não dos balões do navegador */}
          <form className="pagina-atendimento__formulario" onSubmit={enviar} noValidate>
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
              <legend className="pagina-atendimento__titulo-bloco">Quando você prefere?</legend>
              <SeletorQuando
                data={rascunho.dataPreferida}
                periodo={rascunho.periodo}
                dataMinima={minimo}
                onChangeData={(data) => atualizarCampo("dataPreferida", data)}
                onChangePeriodo={(periodo) => atualizarCampo("periodo", periodo)}
              />
              <p className="pagina-atendimento__dica">A Bruxel confirma o dia e o horário com você.</p>
              {erros.dataPreferida && (
                <p className="pagina-atendimento__erro" role="alert">
                  {erros.dataPreferida}
                </p>
              )}
              {erros.periodo && (
                <p className="pagina-atendimento__erro" role="alert">
                  {erros.periodo}
                </p>
              )}
            </fieldset>

            <fieldset className="pagina-atendimento__bloco">
              <legend className="pagina-atendimento__titulo-bloco">Onde e como falar com você</legend>

              {carregandoPerfil ? (
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
                  {editandoContato && perfilTemContato && (
                    <button type="button" className="pagina-atendimento__usar-perfil" onClick={usarContatoDoPerfil}>
                      Usar o endereço do meu perfil
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
                Vale só pra este atendimento: o endereço do seu perfil não muda.
              </p>
            </fieldset>

            <div className="pagina-atendimento__acoes">
              {/* o bloco do contato ainda está carregando: enviar agora validaria um contato vazio que a pessoa nem vê */}
              <button
                type="submit"
                className="pagina-atendimento__enviar"
                disabled={carregandoPerfil}
                aria-busy={carregandoPerfil}
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
