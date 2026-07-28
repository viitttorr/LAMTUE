/**
 * Camada decorativa de fundo, atrás da coluna vertebral — grade sutil, dois
 * brilhos de cor (azul/vermelho da paleta oficial) e uma varredura lenta.
 * Puramente CSS (transform/opacity via @keyframes): roda no compositor da
 * GPU, sem JS e sem listener de scroll, então não custa fluidez de rolagem.
 */
export default function SiteAtmosphere() {
  return (
    <div className="atmosfera" aria-hidden>
      <div className="atmosfera-grade" />
      <div className="atmosfera-brilho brilho-azul" />
      <div className="atmosfera-brilho brilho-vermelho" />
      <div className="atmosfera-scan" />
    </div>
  );
}
