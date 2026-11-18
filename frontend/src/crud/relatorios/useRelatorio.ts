import { useEffect, useState } from "react";
import { mensagemDeErro } from "../../api/cliente";
import { baixarRelatorio, buscarRelatorio } from "../../api/relatorios";
import { useAutenticacao } from "../../contexto/useAutenticacao";
import { montarQueryRelatorio } from "./filtros";
import type { Relatorio, TipoRelatorio } from "../../api/relatorios";
import type { FiltrosRelatorio } from "./filtros";

interface Resultado {
  chave: string;
  relatorio: Relatorio | null;
  erro: string | null;
}

/**
 * Prévia do relatório (JSON) e download em CSV/PDF. A prévia é buscada quando
 * muda o tipo ou os filtros, esperando 300 ms sem mudanças (pra não pedir a
 * cada tecla ao digitar uma data).
 */
export function useRelatorio(tipo: TipoRelatorio, filtros: FiltrosRelatorio) {
  const { token } = useAutenticacao();
  const query = montarQueryRelatorio(tipo, filtros);

  const [estavel, setEstavel] = useState({ tipo, query });
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [baixando, setBaixando] = useState<"csv" | "pdf" | null>(null);
  const [erroDownload, setErroDownload] = useState<{ chave: string; mensagem: string } | null>(null);

  // trocar de tipo vale na hora (com a query nova do tipo); só os filtros esperam o debounce
  const mudouTipo = estavel.tipo !== tipo;
  const queryEstavel = mudouTipo ? query : estavel.query;

  useEffect(() => {
    const espera = window.setTimeout(() => setEstavel({ tipo, query }), mudouTipo ? 0 : 300);
    return () => window.clearTimeout(espera);
  }, [tipo, query, mudouTipo]);

  const chave = `${tipo}|${queryEstavel}`;

  useEffect(() => {
    if (!token) return;
    // se os filtros mudarem antes da resposta, ela é ignorada
    let cancelado = false;

    buscarRelatorio(token, tipo, queryEstavel)
      .then((relatorio) => {
        if (!cancelado) setResultado({ chave, relatorio, erro: null });
      })
      .catch((falha: unknown) => {
        if (!cancelado) setResultado({ chave, relatorio: null, erro: mensagemDeErro(falha) });
      });

    return () => {
      cancelado = true;
    };
  }, [token, tipo, queryEstavel, chave]);

  async function baixar(formato: "csv" | "pdf") {
    if (!token) return;
    const chaveDownload = `${tipo}|${query}`;
    setErroDownload(null);
    setBaixando(formato);
    try {
      await baixarRelatorio(token, tipo, formato, query);
    } catch (falha) {
      setErroDownload({ chave: chaveDownload, mensagem: mensagemDeErro(falha) });
    } finally {
      setBaixando(null);
    }
  }

  // a resposta guardada é a dos filtros que estão na tela agora?
  const atual = resultado?.chave === chave && queryEstavel === query;

  return {
    // da prévia anterior só aparece o que é do mesmo tipo
    relatorio: resultado?.relatorio && resultado.chave.startsWith(`${tipo}|`) ? resultado.relatorio : null,
    carregando: !atual,
    erro: atual ? resultado.erro : null,
    baixando,
    // o erro do download só vale para o tipo e os filtros em que ele aconteceu
    erroDownload: erroDownload?.chave === `${tipo}|${query}` ? erroDownload.mensagem : null,
    baixar,
  };
}
