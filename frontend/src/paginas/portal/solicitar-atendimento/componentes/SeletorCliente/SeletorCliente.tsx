import { useState } from "react";
import type { KeyboardEvent } from "react";
import type { EscolhaCliente } from "../../../../../crud/atendimentos/clienteDaLoja";
import { buscarClientes, mascararCpf } from "../../../../../crud/atendimentos/clienteDaLoja";
import { useUsuarios } from "../../../../../crud/usuarios/useUsuarios";
import "./SeletorCliente.css";

interface SeletorClienteProps {
  escolha: EscolhaCliente;
  onChange: (escolha: EscolhaCliente) => void;
}

/**
 * Bloco "Cliente", que só o administrador vê ao abrir um atendimento pela loja:
 * busca o cliente entre as contas cadastradas (nome, e-mail ou CPF) ou, se a
 * pessoa não tem conta, deixa digitar só o nome.
 *
 * Usa o useUsuarios (GET /users, só de administrador): por isso a página só monta
 * este componente quando quem está logado é admin.
 */
export function SeletorCliente({ escolha, onChange }: SeletorClienteProps) {
  const { usuarios, carregando, erro, recarregar } = useUsuarios();
  // o que está digitado na busca (só existe enquanto ninguém foi escolhido)
  const [termo, setTermo] = useState("");
  const sugestoes = buscarClientes(usuarios, termo);

  function escolher(usuario: (typeof sugestoes)[number]) {
    setTermo("");
    onChange({ tipo: "cadastrado", usuario });
  }

  // Enter na busca escolhe a primeira sugestão; sem isso ele enviaria o formulário inteiro
  function aoApertarTecla(evento: KeyboardEvent<HTMLInputElement>) {
    if (evento.key !== "Enter") return;
    evento.preventDefault();
    if (sugestoes[0]) escolher(sugestoes[0]);
  }

  if (escolha.tipo === "sem-cadastro") {
    return (
      <div className="seletor-cliente">
        <label className="seletor-cliente__campo">
          Nome do cliente
          <input
            type="text"
            value={escolha.nome}
            onChange={(e) => onChange({ tipo: "sem-cadastro", nome: e.target.value })}
            maxLength={150}
            placeholder="Ex.: Maria Oliveira"
            autoComplete="off"
          />
        </label>
        <button
          type="button"
          className="seletor-cliente__link"
          onClick={() => onChange({ tipo: "cadastrado", usuario: null })}
        >
          Buscar cliente cadastrado
        </button>
      </div>
    );
  }

  if (escolha.usuario) {
    const cliente = escolha.usuario;
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
            onClick={() => onChange({ tipo: "cadastrado", usuario: null })}
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
          Nenhum cliente encontrado. Se ele não tiver conta, use 'Cliente sem cadastro'.
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

      <button
        type="button"
        className="seletor-cliente__link"
        onClick={() => onChange({ tipo: "sem-cadastro", nome: "" })}
      >
        Cliente sem cadastro? Digitar o nome
      </button>
    </div>
  );
}

export default SeletorCliente;
