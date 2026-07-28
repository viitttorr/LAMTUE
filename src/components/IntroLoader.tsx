"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { SPINE_READY_EVENT } from "./SpineBackground";

/**
 * Tela de carregamento inicial em tela cheia, com ECG e percentual 0–100%.
 * Regras: duração mínima de 3s, percentual sincronizado ao carregamento real
 * (fontes + evento load + modelo 3D da coluna), trava perto de 95% enquanto
 * aguarda e só libera o site quando todas as condições terminam. Um flag em
 * escopo de módulo garante que ela só aparece em carregamento completo —
 * navegações SPA não a reexibem.
 */
let jaExibido = false;

const ECG_PATH =
  "M0,40 L110,40 L124,40 L136,20 L148,60 L160,40 L250,40 L262,33 L274,40 L400,40 L414,10 L430,72 L444,40 L540,40 L552,32 L564,40 L720,40";

export default function IntroLoader() {
  const [visivel, setVisivel] = useState(!jaExibido);
  const [finale, setFinale] = useState(false);
  const [saida, setSaida] = useState(false);
  const [pct, setPct] = useState(0);
  const pathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    if (!visivel) return;
    jaExibido = true;
    document.documentElement.classList.add("intro-lock");
    const reduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t0 = performance.now();
    const MIN = 3000;
    const TETO = 10000; // nunca prender o usuário indefinidamente

    // Consultado a cada frame (evita corrida entre hidratação e o evento load)
    const carregouTudo = () => document.readyState === "complete";
    const fontesProntas = () => !document.fonts || document.fonts.status === "loaded";
    document.fonts?.ready.catch(() => undefined);

    // O modelo 3D da coluna carrega via fetch próprio (fora do document.readyState),
    // então sem isso o loader podia sumir antes da coluna terminar de aparecer.
    let spineProntx = (window as typeof window & { __lamtueSpineReady?: boolean }).__lamtueSpineReady === true;
    const onSpinePronto = () => { spineProntx = true; };
    window.addEventListener(SPINE_READY_EVENT, onSpinePronto);

    const path = pathRef.current;
    const len = path ? path.getTotalLength() : 0;
    if (path) {
      path.style.strokeDasharray = `${len}`;
      path.style.strokeDashoffset = `${len}`;
    }

    let atual = 0;
    let raf = 0;
    let encerrado = false;
    let ultimo = t0;
    const frame = (agora: number) => {
      const t = agora - t0;
      const dt = Math.max(1, agora - ultimo);
      ultimo = agora;
      const carregado = carregouTudo();
      const fontesOk = fontesProntas();
      // progresso "real": rampa própria + fontes prontas + página carregada + coluna 3D (máx. 95)
      const rampa = Math.min(30, t / 55);
      const real = Math.min(95, rampa + (fontesOk ? 17 : 0) + (carregado ? 27 : 0) + (spineProntx ? 21 : 0));
      // o tempo mínimo dita o ritmo: nem o real adianta o relógio dos 3s
      const ritmo = (Math.min(t, MIN) / MIN) * 95;
      const pronto = (t >= MIN && carregado && fontesOk && spineProntx) || t >= TETO;
      const alvo = pronto ? 100 : Math.min(ritmo, real);
      // suavização baseada em tempo: independe da taxa de frames
      atual += (alvo - atual) * (1 - Math.exp(-dt / (pronto ? 110 : 260)));
      if (pronto && atual > 99.4) atual = 100;
      const p = Math.min(100, atual);
      setPct(Math.floor(p));
      if (path) path.style.strokeDashoffset = `${len * (1 - p / 100)}`;
      if (p >= 100 && !encerrado) {
        encerrado = true;
        setFinale(true); // último pulso do ECG
        window.setTimeout(() => {
          setSaida(true);
          document.documentElement.classList.remove("intro-lock");
          window.setTimeout(() => setVisivel(false), reduzido ? 260 : 700);
        }, reduzido ? 120 : 520);
        return;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    // Failsafe fora do rAF: em abas em segundo plano o rAF fica pausado;
    // este timer garante que o loader nunca prenda o usuário indefinidamente.
    const failsafe = window.setTimeout(() => {
      if (encerrado) return;
      encerrado = true;
      cancelAnimationFrame(raf);
      setPct(100);
      if (path) path.style.strokeDashoffset = "0";
      setFinale(true);
      window.setTimeout(() => {
        setSaida(true);
        document.documentElement.classList.remove("intro-lock");
        window.setTimeout(() => setVisivel(false), 260);
      }, 150);
    }, TETO + 2000);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(failsafe);
      window.removeEventListener(SPINE_READY_EVENT, onSpinePronto);
      document.documentElement.classList.remove("intro-lock");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visivel]);

  if (!visivel) return null;
  return (
    <div
      className={`intro-loader${finale ? " finale" : ""}${saida ? " saida" : ""}`}
      role="status"
      aria-label={`Carregando o portal da LAMTUE: ${pct}%`}
    >
      <Image src="/logo.png" alt="LAMTUE" width={86} height={86} className="intro-logo" priority />
      <svg className="intro-ecg" viewBox="0 0 720 80" preserveAspectRatio="none" aria-hidden>
        <path className="intro-ecg-base" d={ECG_PATH} />
        <path ref={pathRef} className="intro-ecg-draw" d={ECG_PATH} />
      </svg>
      <div className="intro-pct" aria-hidden>{pct}%</div>
      <div className="intro-bar" aria-hidden><span style={{ width: `${pct}%` }} /></div>
      <div className="intro-status">Preparando o portal</div>
    </div>
  );
}
