import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import { CartProvider } from "./context/CartContext";
import { PortalHome } from "./pages/portal/Home/Home";
import { AboutPage } from "./pages/portal/About/About";
import { StorePage } from "./pages/portal/Store/Store";
import { PiscinatorPage } from "./pages/portal/Piscinator/Piscinator";
import { CartPage } from "./pages/portal/Cart/Cart";
import { LoginPage } from "./pages/portal/Login/Login";
import { SignupPage } from "./pages/portal/Signup/Signup";
import { ProfilePage } from "./pages/portal/Profile/Profile";
import { AdminUsersPage } from "./pages/admin/AdminUsers/AdminUsers";
import { AdminProductsPage } from "./pages/admin/AdminProducts/AdminProducts";

/**
 * Raiz da aplicação: define as rotas do site.
 *
 * O CartProvider envolve tudo pra que o carrinho seja um estado único,
 * compartilhado por todas as páginas e pelo contador do Header. Como fica
 * acima das rotas, os itens não se perdem ao navegar entre elas.
 */
function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <Routes>
          {/* portal: site público da Bruxel */}
          <Route path="/" element={<PortalHome />} />
          <Route path="/sobre" element={<AboutPage />} />
          <Route path="/loja" element={<StorePage />} />
          <Route path="/piscinator" element={<PiscinatorPage />} />
          <Route path="/carrinho" element={<CartPage />} />
          <Route path="/entrar" element={<LoginPage />} />
          <Route path="/criar-conta" element={<SignupPage />} />
          <Route path="/perfil" element={<ProfilePage />} />
          {/* painel de gestão (usa o AdminNav no lugar do Header) */}
          {/* TODO: proteger as rotas /admin/* — hoje qualquer pessoa consegue acessar */}
          <Route path="/admin/usuarios" element={<AdminUsersPage />} />
          <Route path="/admin/produtos" element={<AdminProductsPage />} />
        </Routes>
      </BrowserRouter>
    </CartProvider>
  );
}

export default App
