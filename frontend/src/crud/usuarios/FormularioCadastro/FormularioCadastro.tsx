import { useState } from "react";
import type { FormEvent } from "react";
import { mensagemDeErro } from "../../../api/cliente";
import type { DadosNovoUsuario } from "../../../api/usuarios";
import "./FormularioCadastro.css";

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
  // true enquanto espera a API: desabilita o botão pra não cadastrar duas vezes
  const [enviando, setEnviando] = useState(false);

  async function enviar(event: FormEvent) {
    event.preventDefault();

    if (senha !== confirmarSenha) {
      setErro("As senhas não conferem.");
      return;
    }

    setEnviando(true);
    setErro(null);
    try {
      await onEnviar({ nome: nome.trim(), email: email.trim(), cpf, senha });
    } catch (falha) {
      // mantém os campos pra pessoa só corrigir o que deu problema
      setErro(mensagemDeErro(falha));
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
          onChange={(e) => setNome(e.target.value)}
          maxLength={150}
          required
        />
      </label>
      <label>
        E-mail
        <input
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          maxLength={255}
          autoComplete="email"
          required
        />
      </label>
      <label>
        CPF
        <input
          type="text"
          inputMode="numeric"
          placeholder="Só números"
          value={cpf}
          // tira tudo que não é dígito, pra ficar no formato do banco (11 dígitos)
          onChange={(e) => setCpf(e.target.value.replace(/\D/g, ""))}
          maxLength={11}
          minLength={11}
          required
        />
      </label>
      <label>
        Senha
        <input
          type="password"
          placeholder="••••••••"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          autoComplete="new-password"
          required
        />
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
