import { Container } from "../Container/Container";
import "./Footer.css";

export function Footer() {
  return (
    <footer className="footer">
      <Container className="footer__inner">
        <div className="footer__column">
          <h3>Localização</h3>
          <p>
            Av. Benjamim Constant, 2361, sala 101, Lajeado, Rio Grande Do
            Sul, Brazil 95900700
          </p>
          <p>
            Segunda a Sexta: 08h às 11h45min | 13h30min às 18h
            <br />
            Sábado: 08h às 12h
          </p>
        </div>

        <div className="footer__column">
          <h3>Contato</h3>
          <p>(51) 993078577</p>
        </div>

        <div className="footer__column">
          <h3>Redes sociais</h3>
          <p>📷 @bruxelpiscinas</p>
          <p>📘 BruxelPiscinas</p>
        </div>

        <div className="footer__logo">
          <span className="footer__logo-main">Bruxel</span>
          <span className="footer__logo-sub">Piscinas</span>
        </div>
      </Container>
    </footer>
  );
}

export default Footer;
