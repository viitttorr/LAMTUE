import Link from "next/link";
import Image from "next/image";
import { db, DIRETORIA, TEMAS } from "@/lib/db";
import ParticleField from "@/components/ParticleField";
import HeroParallax from "@/components/HeroParallax";
import HeartbeatPulse from "@/components/HeartbeatPulse";
import ECGLine from "@/components/ECGLine";
import Reveal from "@/components/Reveal";
import Counter from "@/components/Counter";
import Countdown from "@/components/Countdown";
import TiltCard from "@/components/TiltCard";
import ChapterNav from "@/components/ChapterNav";
import Parallax from "@/components/Parallax";

export const dynamic = "force-dynamic";

const AREAS = [
  { t: "Ensino", d: "Aulas teóricas e práticas quinzenais sobre trauma, urgência e emergência, com trilha de aprendizado estruturada nos protocolos ATLS, ACLS e PHTLS.", i: "◆" },
  { t: "Pesquisa", d: "Produção acadêmica orientada pela Diretoria de Ensino e Pesquisa, com participação em eventos científicos como a SAMURI.", i: "◈" },
  { t: "Extensão", d: "Ações junto à comunidade: capacitações em primeiros socorros, campanhas de prevenção e presença em eventos da universidade e da cidade.", i: "❖" },
];

export default function Home() {
  const seletivo = db().prepare("SELECT * FROM seletivo WHERE id = 1").get() as {
    ativo: number; vagas: number; prazo: string | null;
  };
  const inscritos = (db().prepare("SELECT COUNT(*) AS n FROM inscricoes").get() as { n: number }).n;
  const ligantes = (db().prepare("SELECT COUNT(*) AS n FROM users WHERE role='ligante' AND ativo=1").get() as { n: number }).n;
  const aulas = (db().prepare("SELECT COUNT(*) AS n FROM aulas").get() as { n: number }).n;
  const acoes = (db().prepare("SELECT COUNT(*) AS n FROM extensao WHERE tipo='acao'").get() as { n: number }).n;

  const capitulos = [
    { id: "inicio", label: "Início" },
    ...(seletivo.ativo ? [{ id: "seletivo-aberto", label: "Seletivo" }] : []),
    { id: "sobre", label: "A Liga" },
    { id: "numeros", label: "Em números" },
    { id: "trilha", label: "Trilha" },
    { id: "diretoria", label: "Diretoria" },
    { id: "plantao", label: "Plantão" },
  ];
  const num = (id: string) => String(capitulos.findIndex((c) => c.id === id) + 1).padStart(2, "0");

  return (
    <>
      <ChapterNav chapters={capitulos} />

      {/* ── CAPÍTULO 01 · HERO ───────────────────────── */}
      <section id="inicio" className="chapter hero2">
        <div className="hero2-grid" aria-hidden />
        <div className="hero2-beam" aria-hidden />
        <div className="hero2-beam vermelho" aria-hidden />
        <ParticleField variant="hero" />
        <HeartbeatPulse />
        <div className="hero2-side" aria-hidden>Trauma · Urgência · Emergência</div>
        <HeroParallax>
          <div className="hero2-content">
            <div className="eyebrow">Liga Acadêmica · URI Erechim · CAMED</div>
            <h1 className="hero-title mt-2">
              Medicina de <span className="accent">Trauma</span>,<br />
              <span className="accent-blue">Urgência</span> e Emergência
            </h1>
            <p className="muted mt-2" style={{ maxWidth: 620, fontSize: 17.5 }}>
              A LAMTUE forma acadêmicos preparados para os primeiros minutos que decidem vidas —
              com ensino baseado em protocolos, simulação realística, pesquisa e extensão.
            </p>
            <div className="flex mt-3" style={{ flexWrap: "wrap" }}>
              <Link href="/seletivo" className="btn btn-primary">Processo Seletivo</Link>
              <Link href="/#sobre" className="btn">Conhecer a Liga</Link>
              <Link href="/login" className="btn btn-ghost">Área do Ligante →</Link>
            </div>
          </div>
        </HeroParallax>
        <div className="hero2-ecg" aria-hidden><ECGLine height={64} /></div>
        <div className="scroll-cue"><span>Role para explorar</span><span className="chevron" /></div>
      </section>

      {/* ── SELETIVO AO VIVO ─────────────────────────── */}
      {!!seletivo.ativo && (
        <section id="seletivo-aberto" className="chapter container" style={{ marginTop: 40 }}>
          <Reveal>
            <div className="card hoverable live-band">
              <div className="flex-between">
                <div className="flex">
                  <span className="pulse-dot red" />
                  <strong style={{ fontFamily: "var(--font-display)" }}>Processo seletivo aberto</strong>
                </div>
                <div className="flex" style={{ gap: 34, flexWrap: "wrap" }}>
                  <div><div className="small">Vagas</div><strong style={{ fontSize: 22, fontFamily: "var(--font-display)" }}><Counter to={seletivo.vagas} /></strong></div>
                  <div><div className="small">Inscritos</div><strong style={{ fontSize: 22, fontFamily: "var(--font-display)" }}><Counter to={inscritos} /></strong></div>
                  {seletivo.prazo && <div><div className="small">Encerra em</div><Countdown prazo={seletivo.prazo} /></div>}
                  <Link href="/seletivo" className="btn btn-primary">Inscreva-se</Link>
                </div>
              </div>
            </div>
          </Reveal>
        </section>
      )}

      {/* ── CAPÍTULO · SOBRE ─────────────────────────── */}
      <section id="sobre" className="chapter container" style={{ paddingTop: 110 }}>
        <Parallax speed={0.06} className="chapter-ghost" style={{ position: "absolute", top: 12, right: "max(2vw, 10px)" }}>
          <span aria-hidden>{num("sobre")}</span>
        </Parallax>
        <div className="sobre-grid" style={{ position: "relative", zIndex: 1 }}>
          <div className="sobre-sticky">
            <Reveal variant="left">
              <div className="chapter-head">
                <span className="chapter-no">{num("sobre")}</span>
                <div>
                  <div className="eyebrow">Quem somos</div>
                  <h2 className="section-title">Precisão quando cada segundo importa</h2>
                </div>
              </div>
              <p className="muted mt-2" style={{ maxWidth: 760 }}>
                A LAMTUE é a Liga Acadêmica de Medicina de Trauma, Urgência e Emergência da Universidade
                Regional Integrada do Alto Uruguai e das Missões, campus Erechim/RS, vinculada ao CAMED.
                Nossa missão é aproximar o acadêmico de medicina da realidade do atendimento de urgência —
                do suporte básico de vida ao manejo avançado do politraumatizado.
              </p>
            </Reveal>
          </div>
          <div className="pillars">
            {AREAS.map((a, i) => (
              <Reveal key={a.t} delay={i * 120} variant="right">
                <div className="pillar">
                  <div className="pillar-node" aria-hidden>{a.i}</div>
                  <div>
                    <h3>{a.t}</h3>
                    <p>{a.d}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CAPÍTULO · NÚMEROS ───────────────────────── */}
      <section id="numeros" className="chapter container" style={{ paddingTop: 110 }}>
        <Reveal>
          <div className="chapter-head">
            <span className="chapter-no">{num("numeros")}</span>
            <div>
              <div className="eyebrow">A liga em atividade</div>
            </div>
          </div>
        </Reveal>
        <div className="stats-band mt-2">
          <span className="stats-word" aria-hidden>LAMTUE</span>
          {[
            { n: ligantes, l: "Ligantes ativos" },
            { n: aulas, l: "Aulas e capacitações" },
            { n: acoes, l: "Ações de extensão" },
          ].map((s, i) => (
            <Reveal key={s.l} delay={i * 110} variant="up">
              <div className={`stat2${i % 2 ? " azul" : ""}`}>
                <div className="stat2-num"><Counter to={s.n} /></div>
                <div className="stat2-line" aria-hidden />
                <div className="stat-label">{s.l}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── CAPÍTULO · TEMAS ─────────────────────────── */}
      <section id="trilha" className="chapter container" style={{ paddingTop: 110 }}>
        <Parallax speed={0.05} className="chapter-ghost esq" style={{ position: "absolute", top: 12, left: "max(2vw, 10px)", right: "auto" }}>
          <span aria-hidden>{num("trilha")}</span>
        </Parallax>
        <Reveal>
          <div className="chapter-head" style={{ position: "relative", zIndex: 1 }}>
            <span className="chapter-no">{num("trilha")}</span>
            <div>
              <div className="eyebrow">Trilha de conhecimento</div>
              <h2 className="section-title">O que você aprende na liga</h2>
              <p className="muted" style={{ maxWidth: 620 }}>
                {TEMAS.length} frentes de estudo que sustentam a formação prática da LAMTUE — da via aérea
                ao transporte do paciente crítico.
              </p>
            </div>
          </div>
        </Reveal>
        <div className="temas-field mt-2">
          <ParticleField variant="field" palette="blue" density={0.6} className="temas-canvas" />
          <div className="temas-grid">
            {TEMAS.map((t, i) => (
              <Reveal key={t} delay={(i % 6) * 70} variant="scale">
                <TiltCard max={12}>
                  <div
                    className="card hoverable tema-card"
                    style={{ animationDelay: `${(i % 7) * 0.35}s`, animationDuration: `${4.5 + (i % 5) * 0.5}s` }}
                  >
                    <span className="tema-idx">{String(i + 1).padStart(2, "0")}</span>
                    <span className="tema-nome">{t}</span>
                  </div>
                </TiltCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CAPÍTULO · DIRETORIA ─────────────────────── */}
      <section id="diretoria" className="chapter container" style={{ paddingTop: 110 }}>
        <Reveal>
          <div className="chapter-head">
            <span className="chapter-no">{num("diretoria")}</span>
            <div>
              <div className="eyebrow">Gestão 2026–2027</div>
              <h2 className="section-title">Diretoria</h2>
            </div>
          </div>
        </Reveal>
        <div className="diretoria-grid mt-2">
          {DIRETORIA.map((m, i) => (
            <Reveal key={m.nome} delay={i * 90} variant="scale">
              <TiltCard>
                <div className="dir-card">
                  <div className="dir-avatar">
                    {m.nome.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                  </div>
                  <div style={{ fontWeight: 700, fontFamily: "var(--font-display)" }}>{m.nome}</div>
                  <div className="small mt-1" style={{ color: "var(--red-bright)" }}>{m.cargo}</div>
                </div>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── CAPÍTULO · CTA FINAL ─────────────────────── */}
      <section id="plantao" className="chapter container" style={{ paddingTop: 110 }}>
        <Reveal variant="scale">
          <div className="cta-band">
            <div className="cta-ecg" aria-hidden><ECGLine height={50} color="rgba(226,83,111,0.55)" /></div>
            <Image src="/logo.png" alt="" width={64} height={64} className="logo-ring" style={{ borderRadius: "50%", margin: "0 auto 18px" }} />
            <h2 className="section-title">Pronto para o plantão?</h2>
            <p className="muted" style={{ maxWidth: 520, margin: "0 auto" }}>
              Acompanhe o processo seletivo, conheça nossas ações e entre em contato com a diretoria.
            </p>
            <div className="flex mt-3" style={{ justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/seletivo" className="btn btn-primary">Ver processo seletivo</Link>
              <Link href="/contato" className="btn">Falar com a liga</Link>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
