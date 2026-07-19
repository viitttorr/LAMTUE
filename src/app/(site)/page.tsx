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

  return (
    <>
      {/* ── HERO ─────────────────────────────────────── */}
      <section className="hero" style={{ minHeight: "92vh", display: "flex", alignItems: "center" }}>
        <ParticleField variant="hero" />
        <HeartbeatPulse />
        <HeroParallax>
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
        </HeroParallax>
        <div className="scroll-cue"><span>Role para explorar</span><span className="chevron" /></div>
      </section>

      <ECGLine />

      {/* ── SELETIVO AO VIVO ─────────────────────────── */}
      {!!seletivo.ativo && (
        <section className="container" style={{ marginTop: 40 }}>
          <Reveal>
            <div className="card hoverable" style={{ borderColor: "rgba(226,83,111,0.35)" }}>
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

      {/* ── SOBRE ────────────────────────────────────── */}
      <section id="sobre" className="container" style={{ paddingTop: 90 }}>
        <Reveal>
          <div className="eyebrow">Quem somos</div>
          <h2 className="section-title">Precisão quando cada segundo importa</h2>
          <p className="muted" style={{ maxWidth: 760 }}>
            A LAMTUE é a Liga Acadêmica de Medicina de Trauma, Urgência e Emergência da Universidade
            Regional Integrada do Alto Uruguai e das Missões, campus Erechim/RS, vinculada ao CAMED.
            Nossa missão é aproximar o acadêmico de medicina da realidade do atendimento de urgência —
            do suporte básico de vida ao manejo avançado do politraumatizado.
          </p>
        </Reveal>
        <div className="grid3 mt-3">
          {AREAS.map((a, i) => (
            <Reveal key={a.t} delay={i * 120} variant={i === 0 ? "left" : i === 2 ? "right" : "up"}>
              <TiltCard>
                <div className="card hoverable" style={{ height: "100%" }}>
                  <div style={{ fontSize: 26, color: "var(--red-bright)" }}>{a.i}</div>
                  <h3 style={{ fontSize: 19, margin: "10px 0 8px" }}>{a.t}</h3>
                  <p className="muted" style={{ fontSize: 14.5 }}>{a.d}</p>
                </div>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── NÚMEROS ──────────────────────────────────── */}
      <section className="container" style={{ paddingTop: 80 }}>
        <div className="grid3">
          {[
            { n: ligantes, l: "Ligantes ativos" },
            { n: aulas, l: "Aulas e capacitações" },
            { n: acoes, l: "Ações de extensão" },
          ].map((s, i) => (
            <Reveal key={s.l} delay={i * 100} variant="scale">
              <TiltCard>
                <div className="card stat hoverable">
                  <div className="stat-num" style={{ color: i % 2 ? "var(--blue)" : "var(--red-bright)" }}>
                    <Counter to={s.n} />
                  </div>
                  <div className="stat-label">{s.l}</div>
                </div>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── TEMAS ────────────────────────────────────── */}
      <section className="container" style={{ paddingTop: 90 }}>
        <Reveal>
          <div className="eyebrow">Trilha de conhecimento</div>
          <h2 className="section-title">O que você aprende na liga</h2>
          <p className="muted" style={{ maxWidth: 620 }}>
            {TEMAS.length} frentes de estudo que sustentam a formação prática da LAMTUE — da via aérea
            ao transporte do paciente crítico.
          </p>
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

      {/* ── DIRETORIA ────────────────────────────────── */}
      <section id="diretoria" className="container" style={{ paddingTop: 90 }}>
        <Reveal>
          <div className="eyebrow">Gestão 2026–2027</div>
          <h2 className="section-title">Diretoria</h2>
        </Reveal>
        <div className="diretoria-grid mt-2">
          {DIRETORIA.map((m, i) => (
            <Reveal key={m.nome} delay={i * 90} variant="scale">
              <TiltCard>
                <div className="card hoverable" style={{ textAlign: "center", height: "100%" }}>
                  <div
                    style={{
                      width: 72, height: 72, borderRadius: "50%", margin: "0 auto 14px",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: "linear-gradient(135deg, rgba(139,21,56,0.5), rgba(14,165,233,0.25))",
                      border: "1px solid var(--border)", font: "700 24px var(--font-display)",
                    }}
                  >
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

      {/* ── CTA FINAL ────────────────────────────────── */}
      <section className="container" style={{ paddingTop: 90 }}>
        <Reveal variant="scale">
          <div className="card" style={{ textAlign: "center", padding: "54px 30px", position: "relative", overflow: "hidden" }}>
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
