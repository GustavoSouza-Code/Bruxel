import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import { ProvedorCarrinho } from "./contexto/ContextoCarrinho";
import { PaginaInicio } from "./paginas/portal/Inicio/Inicio";
import { PaginaSobre } from "./paginas/portal/Sobre/Sobre";
import { PaginaLoja } from "./paginas/portal/Loja/Loja";
import { PaginaPiscinator } from "./paginas/portal/Piscinator/Piscinator";
import { PaginaCarrinho } from "./paginas/portal/Carrinho/Carrinho";
import { PaginaLogin } from "./paginas/portal/Login/Login";
import { PaginaCadastro } from "./paginas/portal/Cadastro/Cadastro";
import { PaginaPerfil } from "./paginas/portal/Perfil/Perfil";
import { PaginaAdminUsuarios } from "./paginas/admin/AdminUsuarios/AdminUsuarios";
import { PaginaAdminProdutos } from "./paginas/admin/AdminProdutos/AdminProdutos";

/**
 * Raiz da aplicação: define as rotas do site.
 *
 * O ProvedorCarrinho envolve tudo pra que o carrinho seja um estado único,
 * compartilhado por todas as páginas e pelo contador do Cabecalho. Como fica
 * acima das rotas, os itens não se perdem ao navegar entre elas.
 */
function App() {
  return (
    <ProvedorCarrinho>
      <BrowserRouter>
        <Routes>
          {/* portal: site público da Bruxel */}
          <Route path="/" element={<PaginaInicio />} />
          <Route path="/sobre" element={<PaginaSobre />} />
          <Route path="/loja" element={<PaginaLoja />} />
          <Route path="/piscinator" element={<PaginaPiscinator />} />
          <Route path="/carrinho" element={<PaginaCarrinho />} />
          <Route path="/entrar" element={<PaginaLogin />} />
          <Route path="/criar-conta" element={<PaginaCadastro />} />
          <Route path="/perfil" element={<PaginaPerfil />} />
          {/* painel de gestão (usa o NavAdmin no lugar do Cabecalho) */}
          {/* TODO: proteger as rotas /admin/* — hoje qualquer pessoa consegue acessar */}
          <Route path="/admin/usuarios" element={<PaginaAdminUsuarios />} />
          <Route path="/admin/produtos" element={<PaginaAdminProdutos />} />
        </Routes>
      </BrowserRouter>
    </ProvedorCarrinho>
  );
}

export default App
