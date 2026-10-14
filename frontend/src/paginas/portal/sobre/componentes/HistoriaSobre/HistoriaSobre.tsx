import { Container } from "../../../../../componentes/layout/Container/Container";
import "./HistoriaSobre.css";

/**
 * A foto da equipe limpando a piscina ainda não foi enviada. Quando chegar,
 * basta salvar como src/assets/images/sobre/limpeza-piscina.jpg (ou .png/.webp):
 * o glob abaixo encontra o arquivo sozinho; sem ele, aparece o placeholder.
 */
const fotos = import.meta.glob<string>(
  "../../../../../assets/images/sobre/limpeza-piscina.{jpg,jpeg,png,webp}",
  { eager: true, import: "default" },
);
const fotoLimpeza = Object.values(fotos)[0];

/** Segunda parte da página Sobre: história à esquerda; foto e compromisso à direita (como no Figma). */
export function HistoriaSobre() {
  return (
    <section className="historia-sobre">
      <Container className="historia-sobre__interno">
        <div className="historia-sobre__coluna historia-sobre__coluna--historia">
          <p>
            Em 2019, formalizamos nossa atuação como empresa, consolidando um
            trabalho que já era reconhecido pela dedicação, confiança e
            qualidade dos serviços prestados. Com o crescimento da marca e a
            necessidade de oferecer ainda mais comodidade aos nossos
            clientes, ampliamos nossas atividades com a inauguração da loja
            física, reunindo em um único espaço produtos de qualidade,
            atendimento especializado e orientações técnicas confiáveis.
          </p>
          <p>
            Hoje, a Bruxel Piscinas é referência para quem busca soluções
            completas para o cuidado da piscina. Trabalhamos com uma linha
            selecionada de produtos, equipamentos e acessórios, sempre
            priorizando marcas reconhecidas e itens que entregam segurança,
            eficiência e durabilidade. Mais do que vender produtos, nosso
            objetivo é oferecer a solução adequada para cada necessidade,
            garantindo resultados que realmente fazem a diferença no dia a
            dia dos nossos clientes.
          </p>
          <p>
            Nosso atendimento é baseado na proximidade, na transparência e
            na confiança. Entendemos que cada piscina possui características
            específicas e, por isso, dedicamos atenção individual a cada
            cliente, analisando suas necessidades e indicando as melhores
            alternativas de forma clara e objetiva.
          </p>
        </div>

        <div className="historia-sobre__coluna historia-sobre__coluna--foto">
          {fotoLimpeza ? (
            <img
              className="historia-sobre__foto"
              src={fotoLimpeza}
              alt="Limpeza de piscina com peneira"
            />
          ) : (
            <div className="historia-sobre__foto historia-sobre__foto--vazia" aria-hidden="true" />
          )}
          <p>
            Na Bruxel Piscinas, nosso compromisso é manter sua piscina sempre
            limpa, segura e pronta para os melhores momentos de lazer. Com
            experiência, responsabilidade e dedicação, seguimos trabalhando
            para oferecer produtos, orientações e soluções que proporcionem
            tranquilidade e qualidade para você e sua família. Afinal, mais
            do que cuidar de piscinas, cuidamos da experiência e do bem-estar
            de quem deseja aproveitar cada momento ao máximo.
          </p>
        </div>
      </Container>
    </section>
  );
}

export default HistoriaSobre;
