import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import "./App.css";
import { ProvedorAutenticacao } from "./contexto/ContextoAutenticacao";
import { ProvedorCarrinho } from "./contexto/ContextoCarrinho";
import { RotaAdmin } from "./componentes/layout/RotaAdmin/RotaAdmin";
import { RotaLogado } from "./componentes/layout/RotaLogado/RotaLogado";
import { PaginaInicio } from "./paginas/portal/inicio/inicio";
import { PaginaSobre } from "./paginas/portal/sobre/sobre";
import { PaginaLoja } from "./paginas/portal/loja/loja";
import { PaginaProduto } from "./paginas/portal/produto/produto";
import { PaginaPiscinator } from "./paginas/portal/piscinator/piscinator";
import { PaginaCarrinho } from "./paginas/portal/carrinho/carrinho";
import { PaginaEntrar } from "./paginas/portal/entrar/entrar";
import { PaginaCriarConta } from "./paginas/portal/criar-conta/criar-conta";
import { PaginaPerfil } from "./paginas/portal/perfil/perfil";
import { PaginaSolicitarAtendimento } from "./paginas/portal/solicitar-atendimento/solicitar-atendimento";
import { PaginaAdminInicio } from "./paginas/admin/inicio/inicio";
import { PaginaAdminUsuarios } from "./paginas/admin/usuarios/usuarios";
import { PaginaAdminProdutos } from "./paginas/admin/produtos/produtos";
import { PaginaAdminAtendimentos } from "./paginas/admin/atendimentos/atendimentos";
import { PaginaAdminAtendimento } from "./paginas/admin/atendimento/atendimento";
import { PaginaNaoEncontrada } from "./paginas/portal/nao-encontrada/nao-encontrada";
import { LimiteDeErro } from "./componentes/ui/LimiteDeErro/LimiteDeErro";

/**
 * Rotas dentro do LimiteDeErro. Fica separado do App porque o useLocation só
 * funciona dentro do BrowserRouter; a rota atual reinicia o aviso de falha.
 */
function RotasDoSite() {
  const { pathname } = useLocation();
  return (
    <LimiteDeErro chaveReinicio={pathname}>
      <Routes>
        {/* portal: site público da Bruxel */}
        <Route path="/" element={<PaginaInicio />} />
        <Route path="/sobre" element={<PaginaSobre />} />
        <Route path="/loja" element={<PaginaLoja />} />
        <Route path="/produto/:id" element={<PaginaProduto />} />
        <Route path="/piscinator" element={<PaginaPiscinator />} />
        <Route path="/carrinho" element={<PaginaCarrinho />} />
        <Route path="/entrar" element={<PaginaEntrar />} />
        <Route path="/criar-conta" element={<PaginaCriarConta />} />
        {/* área do cliente: o RotaLogado manda quem não está logado pro /entrar */}
        <Route element={<RotaLogado />}>
          <Route path="/perfil" element={<PaginaPerfil />} />
          <Route path="/solicitar-atendimento" element={<PaginaSolicitarAtendimento />} />
        </Route>
        {/* painel de gestão (usa o NavAdmin, a barra própria do painel, no lugar do Cabecalho);
            o RotaAdmin só deixa passar quem está logado como administrador */}
        <Route element={<RotaAdmin />}>
          <Route path="/admin" element={<PaginaAdminInicio />} />
          <Route path="/admin/usuarios" element={<PaginaAdminUsuarios />} />
          <Route path="/admin/produtos" element={<PaginaAdminProdutos />} />
          <Route path="/admin/atendimentos" element={<PaginaAdminAtendimentos />} />
          <Route path="/admin/atendimentos/:id" element={<PaginaAdminAtendimento />} />
        </Route>
        {/* qualquer endereço que nenhuma rota acima reconhece */}
        <Route path="*" element={<PaginaNaoEncontrada />} />
      </Routes>
    </LimiteDeErro>
  );
}

/**
 * Raiz da aplicação: define as rotas do site.
 *
 * Os provedores envolvem tudo pra que a sessão (ProvedorAutenticacao) e o
 * carrinho (ProvedorCarrinho) sejam estados únicos, compartilhados por todas as
 * páginas e pelo Cabecalho. Os atendimentos vêm da API em cada tela
 * (crud/atendimentos/useAtendimentos).
 * Como ficam acima das rotas, não se perdem ao navegar entre elas.
 */
function App() {
  return (
    <ProvedorAutenticacao>
      <ProvedorCarrinho>
        <BrowserRouter>
          <RotasDoSite />
        </BrowserRouter>
      </ProvedorCarrinho>
    </ProvedorAutenticacao>
  );
}

export default App
