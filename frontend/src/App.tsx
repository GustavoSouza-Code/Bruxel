import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import { ProvedorCarrinho } from "./contexto/ContextoCarrinho";
import { AuthProvider } from "./contexto/AuthContext";
import PaginaInicio from "./paginas/portal/inicio/inicio";
import PaginaSobre from "./paginas/portal/sobre/sobre";
import PaginaLoja from "./paginas/portal/loja/loja";
import PaginaPiscinator from "./paginas/portal/piscinator/piscinator";
import PaginaCarrinho from "./paginas/portal/carrinho/carrinho";
import { LoginPage } from "./paginas/portal/entrar/entrar";
import { SignupPage } from "./paginas/portal/criar-conta/criar-conta";
import PaginaPerfil from "./paginas/portal/perfil/perfil";
import { PaginaAdminUsuarios } from "./paginas/admin/usuarios/usuarios";
import PaginaAdminProdutos from "./paginas/admin/produtos/produtos";

/**
 * Raiz da aplicação: define as rotas do site.
 *
 * AuthProvider guarda a sessão (token + usuário logado) pro app inteiro.
 * ProvedorCarrinho faz o mesmo pro carrinho. Como os dois ficam acima das
 * rotas, nada se perde ao navegar entre páginas.
 */
function App() {
  return (
      <AuthProvider>
        <ProvedorCarrinho>
          <BrowserRouter>
            <Routes>
              {/* portal: site público da Bruxel */}
              <Route path="/" element={<PaginaInicio />} />
              <Route path="/sobre" element={<PaginaSobre />} />
              <Route path="/loja" element={<PaginaLoja />} />
              <Route path="/piscinator" element={<PaginaPiscinator />} />
              <Route path="/carrinho" element={<PaginaCarrinho />} />
              <Route path="/entrar" element={<LoginPage />} />
              <Route path="/criar-conta" element={<SignupPage />} />
              <Route path="/perfil" element={<PaginaPerfil />} />
              {/* painel de gestão (usa o NavAdmin no lugar do Cabecalho) */}
              {/* TODO: proteger as rotas /admin/* — hoje qualquer pessoa consegue acessar */}
              <Route path="/admin/usuarios" element={<PaginaAdminUsuarios />} />
              <Route path="/admin/produtos" element={<PaginaAdminProdutos />} />
            </Routes>
          </BrowserRouter>
        </ProvedorCarrinho>
      </AuthProvider>
  );
}

export default App
