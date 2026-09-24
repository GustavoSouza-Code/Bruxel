import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import { CartProvider } from "./context/CartContext";
import { PortalHome } from "./pages/portal/Home";
import { AboutPage } from "./pages/portal/About";
import { StorePage } from "./pages/portal/Store";
import { PiscinatorPage } from "./pages/portal/Piscinator";
import { CartPage } from "./pages/portal/Cart";
import { LoginPage } from "./pages/portal/Login";
import { SignupPage } from "./pages/portal/Signup";
import { ProfilePage } from "./pages/portal/Profile";
import { AdminUsersPage } from "./pages/admin/AdminUsers";
import { AdminProductsPage } from "./pages/admin/AdminProducts";

function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PortalHome />} />
          <Route path="/sobre" element={<AboutPage />} />
          <Route path="/loja" element={<StorePage />} />
          <Route path="/piscinator" element={<PiscinatorPage />} />
          <Route path="/carrinho" element={<CartPage />} />
          <Route path="/entrar" element={<LoginPage />} />
          <Route path="/criar-conta" element={<SignupPage />} />
          <Route path="/perfil" element={<ProfilePage />} />
          <Route path="/admin/usuarios" element={<AdminUsersPage />} />
          <Route path="/admin/produtos" element={<AdminProductsPage />} />
        </Routes>
      </BrowserRouter>
    </CartProvider>
  );
}

export default App
