import { useState } from "react";
import type { KeyboardEvent } from "react";
import { Link } from "react-router-dom";
import type { Usuario } from "../../../../../tipos/usuario";
import { buscarClientes, mascararCpf } from "../../../../../crud/atendimentos/clienteDaLoja";
import { useUsuarios } from "../../../../../crud/usuarios/useUsuarios";
import "./SeletorCliente.css";

interface SeletorClienteProps {
  /** conta escolhida; null = ninguém ainda */
  cliente: Usuario | null;
  onChange: (cliente: Usuario | null) => void;
}

/**
 * Bloco "Cliente", que só o administrador vê ao abrir um atendimento pela loja:
 * busca o cliente entre as contas cadastradas (nome, e-mail ou CPF). O backend
 * só abre pedido pra conta cadastrada, então quem não tem conta é cadastrado
 * antes, pelo link pra gestão de usuários.
 *
 * Usa o useUsuarios (GET /users, só de administrador): por isso a página só monta
 * este componente quando quem está logado é admin.
 */
export function SeletorCliente({ cliente, onChange }: SeletorClienteProps) {
  const { usuarios, carregando, erro, recarregar } = useUsuarios();
  // o que está digitado na busca (só existe enquanto ninguém foi escolhido)
  const [termo, setTermo] = useState("");
  const sugestoes = buscarClientes(usuarios, termo);

  function escolher(usuario: Usuario) {
    setTermo("");
    onChange(usuario);
  }

  // Enter na busca escolhe a primeira sugestão; sem isso ele enviaria o formulário inteiro
  function aoApertarTecla(evento: KeyboardEvent<HTMLInputElement>) {
    if (evento.key !== "Enter") return;
    evento.preventDefault();
    if (sugestoes[0]) escolher(sugestoes[0]);
  }

  if (cliente) {
    return (
      <div className="seletor-cliente">
        <div className="seletor-cliente__escolhido">
          <span className="seletor-cliente__avatar" aria-hidden="true">
            {cliente.nome.slice(0, 2).toUpperCase()}
          </span>
          <span className="seletor-cliente__dados">
            <strong>{cliente.nome}</strong>
            <span>
              {cliente.email} · CPF {mascararCpf(cliente.cpf)}
            </span>
          </span>
          <button
            type="button"
            className="seletor-cliente__trocar"
            onClick={() => onChange(null)}
          >
            Trocar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="seletor-cliente">
      <input
        type="search"
        className="seletor-cliente__busca"
        value={termo}
        onChange={(e) => setTermo(e.target.value)}
        onKeyDown={aoApertarTecla}
        placeholder="Buscar cliente por nome, e-mail ou CPF"
        aria-label="Buscar cliente por nome, e-mail ou CPF"
        autoComplete="off"
      />

      {carregando ? (
        <p className="seletor-cliente__estado">Carregando clientes…</p>
      ) : erro ? (
        <p className="seletor-cliente__estado" role="alert">
          {erro}{" "}
          <button type="button" className="seletor-cliente__link" onClick={recarregar}>
            Tentar novamente
          </button>
        </p>
      ) : termo.trim().length >= 2 && sugestoes.length === 0 ? (
        <p className="seletor-cliente__estado">
          Nenhum cliente encontrado. Se ele ainda não tem conta, cadastre antes.
        </p>
      ) : (
        sugestoes.length > 0 && (
          <ul className="seletor-cliente__sugestoes">
            {sugestoes.map((usuario) => (
              <li key={usuario.id}>
                <button type="button" className="seletor-cliente__sugestao" onClick={() => escolher(usuario)}>
                  <strong>{usuario.nome}</strong>
                  <span>{usuario.email}</span>
                </button>
              </li>
            ))}
          </ul>
        )
      )}

      {/* abre em outra aba pra não perder o que já foi preenchido aqui; depois de cadastrar,
          "Atualizar lista" busca as contas de novo */}
      <p className="seletor-cliente__estado">
        Cliente sem conta?{" "}
        <Link to="/admin/usuarios" target="_blank" rel="noreferrer" className="seletor-cliente__link">
          Cadastrar na gestão de usuários
        </Link>{" "}
        <button type="button" className="seletor-cliente__link" onClick={recarregar}>
          Atualizar lista
        </button>
      </p>
    </div>
  );
}

export default SeletorCliente;
