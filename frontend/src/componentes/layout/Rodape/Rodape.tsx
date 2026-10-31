import type { ReactNode } from "react";
import { Container } from "../Container/Container";
import "./Rodape.css";

// Endereço escrito uma vez só: o texto do rodapé e os links do mapa saem dele.
const ENDERECO = "Av. Benjamim Constant, 2361, sala 101, Lajeado, Rio Grande do Sul, Brasil, CEP 95900-700";

// Mapa do Google do rodapé: é o link oficial da Bruxel (Compartilhar > Incorporar um mapa).
// Para trocar, cole aqui só o valor do src="..." do código que o Google gera.
const URL_MAPA =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3474.140088043995!2d-51.9740744!3d-29.453919399999997!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x951c617408f6d953%3A0x114d1735fc041489!2sBruxel%20PISCINAS!5e0!3m2!1spt-BR!2sbr!4v1793322217755!5m2!1spt-BR!2sbr";

// abre o endereço no app ou no site do Google Maps
const URL_ABRIR_NO_MAPS = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ENDERECO)}`;

// perfis oficiais da Bruxel
const URL_INSTAGRAM = "https://www.instagram.com/bruxelpiscinas/";
const URL_FACEBOOK = "https://www.facebook.com/piscinasbruxel/";

// base dos ícones: traço na cor do texto (currentColor), decorativos pra leitores de tela
function Icone({ children }: { children: ReactNode }) {
  return (
    <svg
      className="rodape__icone"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

const IconePino = () => (
  <Icone>
    <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </Icone>
);

const IconeRelogio = () => (
  <Icone>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Icone>
);

const IconeTelefone = () => (
  <Icone>
    <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />
  </Icone>
);

const IconeInstagram = () => (
  <Icone>
    <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17" cy="7" r="0.6" fill="currentColor" />
  </Icone>
);

const IconeFacebook = () => (
  <Icone>
    <path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8.5A.5.5 0 0 1 14 8Z" />
  </Icone>
);

/**
 * Rodapé do site: à esquerda localização, horário, contato e redes sociais da
 * Bruxel; à direita um mapa grande do Google (com zoom). Os dados são fixos
 * (não vêm de API). No celular tudo empilha e o mapa vem por último.
 */
export function Rodape() {
  return (
    <footer className="rodape">
      <Container className="rodape__interno">
        <div className="rodape__info">
          <div className="rodape__logo">
            <span className="rodape__logo-principal">Bruxel</span>
            <span className="rodape__logo-secundario">Piscinas</span>
          </div>

          <ul className="rodape__lista">
            <li className="rodape__item">
              <IconePino />
              <div>
                <h3>Localização</h3>
                <address>Av. Benjamim Constant, 2361, sala 101 — Lajeado, RS, CEP 95900-700</address>
                <a className="rodape__link-mapa" href={URL_ABRIR_NO_MAPS} target="_blank" rel="noopener noreferrer">
                  Abrir no Google Maps
                </a>
              </div>
            </li>

            <li className="rodape__item">
              <IconeRelogio />
              <div>
                <h3>Horário de atendimento</h3>
                <p>
                  Segunda a sexta: 08h às 11h45 e 13h30 às 18h
                  <br />
                  Sábado: 08h às 12h
                </p>
              </div>
            </li>

            <li className="rodape__item">
              <IconeTelefone />
              <div>
                <h3>Contato</h3>
                <a className="rodape__link" href="tel:+5551993078577">
                  (51) 99307-8577
                </a>
              </div>
            </li>
          </ul>

          <div className="rodape__redes">
            <h3>Redes sociais</h3>
            <div className="rodape__botoes-redes">
              <a
                className="rodape__rede"
                href={URL_INSTAGRAM}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram da Bruxel Piscinas"
              >
                <IconeInstagram />
                <span>@bruxelpiscinas</span>
              </a>
              <a
                className="rodape__rede"
                href={URL_FACEBOOK}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook da Bruxel Piscinas"
              >
                <IconeFacebook />
                <span>piscinasbruxel</span>
              </a>
            </div>
          </div>
        </div>

        <div className="rodape__mapa">
          <iframe
            title="Mapa com a localização da Bruxel Piscinas"
            src={URL_MAPA}
            loading="lazy"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      </Container>

      <div className="rodape__base">
        <Container>
          <p>© {new Date().getFullYear()} Bruxel Piscinas. Todos os direitos reservados.</p>
        </Container>
      </div>
    </footer>
  );
}

export default Rodape;
