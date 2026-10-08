import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import { ProvedorAutenticacao } from "./contexto/ContextoAutenticacao";
import { ProvedorCarrinho } from "./contexto/ContextoCarrinho";
import { RotaAdmin } from "./componentes/layout/RotaAdmin/RotaAdmin";
import { PaginaInicio } from "./paginas/portal/inicio/inicio";
import { PaginaSobre } from "./paginas/portal/sobre/sobre";
import { PaginaLoja } from "./paginas/portal/loja/loja";
import { PaginaPiscinator } from "./paginas/portal/piscinator/piscinator";
import { PaginaCarrinho } from "./paginas/portal/carrinho/carrinho";
import { PaginaEntrar } from "./paginas/portal/entrar/entrar";
import { PaginaCriarConta } from "./paginas/portal/criar-conta/criar-conta";
import { PaginaPerfil } from "./paginas/portal/perfil/perfil";
import { PaginaAdminUsuarios } from "./paginas/admin/usuarios/usuarios";
import { PaginaAdminProdutos } from "./paginas/admin/produtos/produtos";

/**
 * Raiz da aplicação: define as rotas do site.
 *
 * Os provedores envolvem tudo pra que a sessão (ProvedorAutenticacao) e o
 * carrinho (ProvedorCarrinho) sejam estados únicos, compartilhados por todas
 * as páginas e pelo Cabecalho. Como ficam acima das rotas, não se perdem ao
 * navegar entre elas.
 */
function App() {
  return (
    <ProvedorAutenticacao>
      <ProvedorCarrinho>
        <BrowserRouter>
          <Routes>
            {/* portal: site público da Bruxel */}
            <Route path="/" element={<PaginaInicio />} />
            <Route path="/sobre" element={<PaginaSobre />} />
            <Route path="/loja" element={<PaginaLoja />} />
            <Route path="/piscinator" element={<PaginaPiscinator />} />
            <Route path="/carrinho" element={<PaginaCarrinho />} />
            <Route path="/entrar" element={<PaginaEntrar />} />
            <Route path="/criar-conta" element={<PaginaCriarConta />} />
            <Route path="/perfil" element={<PaginaPerfil />} />
            {/* painel de gestão (usa o NavAdmin no lugar do Cabecalho);
                o RotaAdmin só deixa passar quem está logado como administrador */}
            <Route element={<RotaAdmin />}>
              <Route path="/admin/usuarios" element={<PaginaAdminUsuarios />} />
              <Route path="/admin/produtos" element={<PaginaAdminProdutos />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ProvedorCarrinho>
    </ProvedorAutenticacao>
  );
}

export default App
