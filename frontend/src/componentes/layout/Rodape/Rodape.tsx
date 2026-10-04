import { Container } from "../Container/Container";
import "./Rodape.css";

/**
 * Rodapé do site: localização, horário de atendimento, contato e redes
 * sociais da Bruxel. Os dados são fixos (não vêm de API).
 */
export function Rodape() {
  return (
    <footer className="rodape">
      <Container className="rodape__interno">
        <div className="rodape__coluna">
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

        <div className="rodape__coluna">
          <h3>Contato</h3>
          <p>(51) 993078577</p>
        </div>

        <div className="rodape__coluna">
          <h3>Redes sociais</h3>
          <p>📷 @bruxelpiscinas</p>
          <p>📘 BruxelPiscinas</p>
        </div>

        <div className="rodape__logo">
          <span className="rodape__logo-principal">Bruxel</span>
          <span className="rodape__logo-secundario">Piscinas</span>
        </div>
      </Container>
    </footer>
  );
}

export default Rodape;
