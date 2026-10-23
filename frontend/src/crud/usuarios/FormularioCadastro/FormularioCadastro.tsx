import { useState } from "react";
import type { FormEvent } from "react";
import { errosPorCampo, mensagemDeErro } from "../../../api/cliente";
import type { DadosNovoUsuario } from "../../../api/usuarios";
import "./FormularioCadastro.css";

// campos que têm lugar pra mensagem própria; o nome é o mesmo `campo` que o backend devolve em erros[]
const CAMPOS_COM_ERRO = ["nome", "email", "cpf", "senha"];

/** O que o formulário entrega ao ser enviado (a confirmação de senha fica só aqui dentro). */
export type DadosFormularioCadastro = DadosNovoUsuario;

interface FormularioCadastroProps {
  /** salva os dados; se a promessa rejeitar, a mensagem do erro aparece no formulário */
  onEnviar: (dados: DadosFormularioCadastro) => Promise<void>;
  /** texto do botão de enviar; padrão "Criar conta" */
  textoBotao?: string;
}

/**
 * Formulário de cadastro de usuário, usado no "/criar-conta" e no modal de
 * "Novo usuário" do painel admin. Confere se as duas senhas são iguais, espera
 * o onEnviar terminar e só limpa os campos se der certo. Se der erro (ex.: CPF
 * já cadastrado), mostra a mensagem e mantém o que foi digitado.
 */
export function FormularioCadastro({
  onEnviar,
  textoBotao = "Criar conta",
}: FormularioCadastroProps) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  // mensagem de erro mostrada acima do botão; null = sem erro
  const [erro, setErro] = useState<string | null>(null);
  // mensagens que o backend devolveu por campo (ex.: { cpf: "CPF inválido." }), mostradas embaixo de cada input
  const [errosCampos, setErrosCampos] = useState<Record<string, string>>({});
  // true enquanto espera a API: desabilita o botão pra não cadastrar duas vezes
  const [enviando, setEnviando] = useState(false);

  // ao mexer num campo, o aviso dele some (a pessoa já está corrigindo)
  function limparErroCampo(campo: string) {
    setErrosCampos((atuais) => {
      if (!(campo in atuais)) return atuais;
      const restantes = { ...atuais };
      delete restantes[campo];
      return restantes;
    });
  }

  // aria-invalid só aparece (true) quando o campo tem erro; undefined some do HTML
  const invalido = (campo: string) => (campo in errosCampos ? true : undefined);

  // mensagem do backend embaixo do input; vazia quando o campo está ok
  function avisoCampo(campo: string) {
    return errosCampos[campo] ? (
      <span className="formulario-cadastro__erro-campo" role="alert">
        {errosCampos[campo]}
      </span>
    ) : null;
  }

  async function enviar(event: FormEvent) {
    event.preventDefault();

    if (senha !== confirmarSenha) {
      setErro("As senhas não conferem.");
      return;
    }

    setEnviando(true);
    setErro(null);
    setErrosCampos({});
    try {
      await onEnviar({ nome: nome.trim(), email: email.trim(), cpf, senha });
    } catch (falha) {
      // mantém os campos pra pessoa só corrigir o que deu problema
      const porCampo = errosPorCampo(falha);
      const campos = Object.keys(porCampo);
      setErrosCampos(porCampo);
      // se todos os erros têm um input, o aviso fica no input; senão mostra o texto geral
      const todosNoInput = campos.length > 0 && campos.every((c) => CAMPOS_COM_ERRO.includes(c));
      setErro(todosNoInput ? null : mensagemDeErro(falha));
      setEnviando(false);
      return;
    }

    setEnviando(false);
    setNome("");
    setEmail("");
    setCpf("");
    setSenha("");
    setConfirmarSenha("");
  }

  return (
    <form className="formulario-cadastro" onSubmit={enviar}>
      <label>
        Nome completo
        <input
          type="text"
          placeholder="Seu nome completo"
          value={nome}
          onChange={(e) => {
            setNome(e.target.value);
            limparErroCampo("nome");
          }}
          maxLength={150}
          aria-invalid={invalido("nome")}
          required
        />
        {avisoCampo("nome")}
      </label>
      <label>
        E-mail
        <input
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            limparErroCampo("email");
          }}
          maxLength={255}
          aria-invalid={invalido("email")}
          autoComplete="email"
          required
        />
        {avisoCampo("email")}
      </label>
      <label>
        CPF
        <input
          type="text"
          inputMode="numeric"
          placeholder="Só números"
          value={cpf}
          // tira tudo que não é dígito, pra ficar no formato do banco (11 dígitos)
          onChange={(e) => {
            setCpf(e.target.value.replace(/\D/g, ""));
            limparErroCampo("cpf");
          }}
          maxLength={11}
          minLength={11}
          aria-invalid={invalido("cpf")}
          required
        />
        {avisoCampo("cpf")}
      </label>
      <label>
        Senha
        <input
          type="password"
          placeholder="••••••••"
          value={senha}
          onChange={(e) => {
            setSenha(e.target.value);
            limparErroCampo("senha");
          }}
          autoComplete="new-password"
          aria-invalid={invalido("senha")}
          required
        />
        {avisoCampo("senha")}
      </label>
      <label>
        Confirmar senha
        <input
          type="password"
          placeholder="••••••••"
          value={confirmarSenha}
          onChange={(e) => setConfirmarSenha(e.target.value)}
          autoComplete="new-password"
          required
        />
      </label>

      {erro && (
        <p className="formulario-cadastro__erro" role="alert">
          {erro}
        </p>
      )}

      <button type="submit" className="formulario-cadastro__enviar" disabled={enviando}>
        {enviando ? "Enviando…" : textoBotao}
      </button>
    </form>
  );
}

export default FormularioCadastro;
