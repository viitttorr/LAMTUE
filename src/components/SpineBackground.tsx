"use client";

import { useEffect, useRef } from "react";
import type * as THREE from "three";

/** Evento disparado quando o modelo da coluna termina de carregar (ou desiste) — o IntroLoader escuta para não liberar o site antes da coluna estar pronta. */
export const SPINE_READY_EVENT = "lamtue:spine-ready";

function marcarSpineProntx() {
  if (typeof window === "undefined") return;
  (window as typeof window & { __lamtueSpineReady?: boolean }).__lamtueSpineReady = true;
  window.dispatchEvent(new Event(SPINE_READY_EVENT));
}

/**
 * Coluna vertebral 3D em WebGL — cadeia helicoidal de 32 vértebras
 * (modelo real, CC BY 4.0, sketchfab.com/sebaualde) girando lentamente
 * ao fundo, com rotação/descida acopladas ao scroll. Paleta retonalizada
 * para azul/ciano oficial da LAMTUE, com vermelho só como pulso de acento.
 */
export default function SpineBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      marcarSpineProntx();
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      marcarSpineProntx();
      return;
    }

    let destruido = false;
    let observer: IntersectionObserver | null = null;
    let cleanupCena: (() => void) | null = null;

    (async () => {
      const T = await import("three");
      const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
      if (destruido || !canvasRef.current) {
        marcarSpineProntx();
        return;
      }

      const renderer = new T.WebGLRenderer({
        canvas: canvasRef.current,
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
      renderer.setClearColor(0x000000, 0);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
      renderer.toneMapping = T.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.25;

      const scene = new T.Scene();
      const camera = new T.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 120);
      camera.position.set(0, 0, 7.2);

      // luzes — azul/ciano dominante (paleta oficial), vermelho só como pulso de acento
      scene.add(new T.AmbientLight(0x3a5c8f, 2.2));
      scene.add(new T.HemisphereLight(0x9fd9ff, 0x0b1120, 1.4));
      const keyLight = new T.PointLight(0x38bdf8, 28, 42, 2);
      keyLight.position.set(4.6, 3.6, 6.0);
      const fillLight = new T.PointLight(0x0ea5e9, 24, 40, 2);
      fillLight.position.set(-4.6, -3.2, 5.0);
      const accentLight = new T.PointLight(0xe2536f, 14, 30, 2);
      accentLight.position.set(1.0, 6.4, -2.8);
      const rimLight = new T.PointLight(0x67e8f9, 22, 36, 2);
      rimLight.position.set(-2.6, 4.6, -5.0);
      scene.add(keyLight, fillLight, accentLight, rimLight);

      const rig = new T.Group();
      scene.add(rig);
      const column = new T.Group();
      rig.add(column);
      const trackGroup = new T.Group();
      column.add(trackGroup);
      const modelGroup = new T.Group();
      modelGroup.scale.setScalar(0.001);
      trackGroup.add(modelGroup);

      const VERTEBRA_COUNT = 32;
      const OVERLAP = 0.58;
      const TWIST_TURNS = 1;
      const TWIST_STEP = (Math.PI * 2 * TWIST_TURNS) / VERTEBRA_COUNT;
      const TILT_AMP = T.MathUtils.degToRad(3);
      const CURVE_CYCLES = 1;
      const LAT_CYCLES = 1;

      let SPAN = 10;

      function buildChain(template: THREE.Object3D, vertSpacing: number, latAmp: number) {
        const group = new T.Group();
        for (let i = 0; i < VERTEBRA_COUNT; i++) {
          const inst = template.clone(true);
          const centered = i - (VERTEBRA_COUNT - 1) / 2;
          const phase = (i / VERTEBRA_COUNT) * Math.PI * 2;
          inst.position.set(
            Math.sin(phase * LAT_CYCLES) * latAmp,
            centered * vertSpacing,
            Math.cos(phase * LAT_CYCLES + 0.6) * latAmp * 0.7
          );
          inst.rotation.set(
            Math.sin(phase * CURVE_CYCLES) * TILT_AMP,
            i * TWIST_STEP,
            Math.cos(phase * CURVE_CYCLES + 1.1) * TILT_AMP * 0.8
          );
          group.add(inst);
        }
        return group;
      }

      let modelReady = false;
      let revealStart = 0;
      const slots: THREE.Group[] = [];

      new GLTFLoader().load(
        "/models/vertebra.glb",
        (gltf: { scene: THREE.Group }) => {
          if (destruido) return;
          const model = gltf.scene;
          const box = new T.Box3().setFromObject(model);
          const size = new T.Vector3();
          const center = new T.Vector3();
          box.getSize(size);
          box.getCenter(center);

          const TARGET_WIDTH = 0.85;
          model.position.sub(center);
          const scaleFactor = TARGET_WIDTH / Math.max(size.x, 0.0001);
          model.scale.setScalar(scaleFactor);

          model.traverse((obj) => {
            if ((obj as THREE.Mesh).isMesh) {
              const mesh = obj as THREE.Mesh;
              const oldMat = mesh.material as THREE.MeshStandardMaterial;
              mesh.material = new T.MeshPhysicalMaterial({
                map: oldMat?.map || null,
                color: 0xdcecff,
                emissive: 0x123a5e,
                emissiveIntensity: 0.32,
                metalness: 0.4,
                roughness: 0.24,
                iridescence: 1,
                iridescenceIOR: 1.3,
                iridescenceThicknessRange: [100, 600],
                clearcoat: 0.6,
                clearcoatRoughness: 0.15,
              });
            }
          });

          const vertSpacing = size.y * scaleFactor * OVERLAP;
          const latAmp = TARGET_WIDTH * 0.07;
          SPAN = VERTEBRA_COUNT * vertSpacing;

          for (let i = 0; i < 3; i++) {
            const slot = new T.Group();
            slot.position.y = (i - 1) * SPAN;
            modelGroup.add(slot);
            slots.push(slot);
          }

          const chainTemplate = buildChain(model, vertSpacing, latAmp);
          slots.forEach((slot, i) => {
            slot.add(i === 0 ? chainTemplate : chainTemplate.clone(true));
          });

          buildParticles();
          modelReady = true;
          revealStart = performance.now();
          marcarSpineProntx();
        },
        undefined,
        (err: unknown) => {
          console.error("Falha ao carregar vertebra.glb:", err);
          marcarSpineProntx();
        }
      );

      const impulse = new T.Mesh(
        new T.SphereGeometry(0.14, 14, 12),
        new T.MeshBasicMaterial({ color: 0xbfe8ff })
      );
      impulse.add(new T.PointLight(0x67e8f9, 15, 5));
      column.add(impulse);

      function makeDotTexture() {
        const size = 64;
        const c = document.createElement("canvas");
        c.width = c.height = size;
        const ctx = c.getContext("2d")!;
        const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
        g.addColorStop(0, "rgba(255,255,255,1)");
        g.addColorStop(0.35, "rgba(255,255,255,.85)");
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, size, size);
        return new T.CanvasTexture(c);
      }

      /* ================================================================
         Fagulhas incandescentes emitidas pelas vértebras: nascem rentes ao
         eixo, sobem e se abrem para as laterais, acendem rápido e apagam
         devagar. Ficam em `column` (giram junto, mas não descem com o
         trilho), então permanecem sempre na faixa visível da tela.
         O passo por frame é aritmética simples sobre Float32Array — a
         ordem é O(n), não O(n²) como no antigo campo de partículas 2D que
         causava travamento; 320 fagulhas custam fração de milissegundo.
         ================================================================ */
      const FAGULHAS = 320;
      const ALTURA_EMISSAO = 7.0;
      const PALETA_FAGULHA = [
        [1.0, 0.95, 0.84], // branco incandescente
        [0.63, 0.9, 1.0], // ciano claro
        [0.22, 0.74, 0.97], // azul LAMTUE
        [1.0, 0.76, 0.4], // âmbar quente
        [0.89, 0.33, 0.44], // vermelho-brasa (acento de emergência)
      ];
      const fgPos = new Float32Array(FAGULHAS * 3);
      const fgCor = new Float32Array(FAGULHAS * 3);
      const fgVel = new Float32Array(FAGULHAS * 3);
      const fgBase = new Float32Array(FAGULHAS * 3);
      const fgVida = new Float32Array(FAGULHAS);
      const fgVidaMax = new Float32Array(FAGULHAS);
      let fagulhas: THREE.Points | null = null;

      function nascerFagulha(i: number, espalharVida: boolean) {
        const ang = Math.random() * Math.PI * 2;
        const raio = 0.26 + Math.random() * 0.22; // rente à superfície da vértebra
        fgPos[i * 3] = Math.cos(ang) * raio;
        fgPos[i * 3 + 1] = (Math.random() - 0.5) * ALTURA_EMISSAO;
        fgPos[i * 3 + 2] = Math.sin(ang) * raio * 0.7;
        const abertura = 0.15 + Math.random() * 0.34; // afastamento lateral
        fgVel[i * 3] = Math.cos(ang) * abertura;
        fgVel[i * 3 + 1] = 0.22 + Math.random() * 0.6; // subida
        fgVel[i * 3 + 2] = Math.sin(ang) * abertura * 0.7;
        fgVidaMax[i] = 2.8 + Math.random() * 3.2;
        // na primeira carga as vidas começam espalhadas, senão todas
        // nasceriam e morreriam juntas, piscando em bloco
        fgVida[i] = espalharVida ? Math.random() * fgVidaMax[i] : 0;
        const c = PALETA_FAGULHA[(Math.random() * PALETA_FAGULHA.length) | 0];
        fgBase[i * 3] = c[0];
        fgBase[i * 3 + 1] = c[1];
        fgBase[i * 3 + 2] = c[2];
      }

      function buildParticles() {
        for (let i = 0; i < FAGULHAS; i++) nascerFagulha(i, true);
        const geo = new T.BufferGeometry();
        geo.setAttribute("position", new T.BufferAttribute(fgPos, 3));
        geo.setAttribute("color", new T.BufferAttribute(fgCor, 3));
        fagulhas = new T.Points(
          geo,
          new T.PointsMaterial({
            size: 0.145,
            map: makeDotTexture(),
            vertexColors: true,
            transparent: true,
            depthWrite: false,
            blending: T.AdditiveBlending,
          })
        );
        column.add(fagulhas);
      }

      function atualizarFagulhas(dt: number) {
        if (!fagulhas) return;
        for (let i = 0; i < FAGULHAS; i++) {
          fgVida[i] += dt;
          if (fgVida[i] >= fgVidaMax[i]) nascerFagulha(i, false);
          const f = fgVida[i] / fgVidaMax[i];
          fgPos[i * 3] += fgVel[i * 3] * dt;
          fgPos[i * 3 + 1] += fgVel[i * 3 + 1] * dt;
          fgPos[i * 3 + 2] += fgVel[i * 3 + 2] * dt;
          // acende em 12% da vida e apaga no restante; com AdditiveBlending
          // escurecer a cor equivale a desaparecer
          const brilho = f < 0.12 ? f / 0.12 : 1 - (f - 0.12) / 0.88;
          fgCor[i * 3] = fgBase[i * 3] * brilho;
          fgCor[i * 3 + 1] = fgBase[i * 3 + 1] * brilho;
          fgCor[i * 3 + 2] = fgBase[i * 3 + 2] * brilho;
        }
        fagulhas.geometry.attributes.position.needsUpdate = true;
        fagulhas.geometry.attributes.color.needsUpdate = true;
      }

      let baseY = 0;
      function applyResponsive() {
        const w = window.innerWidth;
        let offsetY: number, scale: number;
        if (w <= 640) {
          offsetY = 2.5;
          scale = 0.85;
        } else if (w <= 1024) {
          offsetY = 0.3;
          scale = 1.2;
        } else {
          offsetY = 0;
          scale = 1.45;
        }
        baseY = offsetY;
        rig.position.set(0, offsetY, 0);
        rig.scale.setScalar(scale);
      }

      function onResize() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
        applyResponsive();
      }
      window.addEventListener("resize", onResize);
      onResize();

      const IDLE_SPEED = 0.012;
      const SCROLL_RATE = 0.00023; // rad por pixel rolado
      const DESCENT_RATE = 0.0041; // unidades de descida por pixel rolado

      let scrollSpin = 0;
      let scrollDescent = 0;
      let visivel = true;
      function onScroll() {
        if (!visivel) return;
        scrollSpin = window.scrollY * SCROLL_RATE;
        scrollDescent = window.scrollY * DESCENT_RATE;
      }
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();

      observer = new IntersectionObserver(
        ([entry]) => {
          visivel = entry.isIntersecting;
        },
        { threshold: 0 }
      );
      observer.observe(canvasRef.current);

      let raf = 0;
      const startTime = performance.now();
      const impulsePos = new T.Vector3();
      let descentY = 0;
      let tAnterior = startTime;

      function animate() {
        raf = requestAnimationFrame(animate);
        const agora = performance.now();
        // teto no dt: ao voltar de uma aba em segundo plano o intervalo é
        // enorme e as fagulhas dariam um salto visível
        const dt = Math.min(0.05, (agora - tAnterior) / 1000);
        tAnterior = agora;
        if (!visivel) return;
        const elapsed = (agora - startTime) / 1000;

        const targetRotY = elapsed * IDLE_SPEED + scrollSpin;
        column.rotation.y += (targetRotY - column.rotation.y) * 0.07;
        column.rotation.x = -0.1 + Math.sin(elapsed * 0.26) * 0.045;
        rig.position.y = baseY + Math.sin(elapsed * 0.4) * 0.13;

        descentY += (scrollDescent - descentY) * 0.08;
        trackGroup.position.y = ((descentY % SPAN) + SPAN) % SPAN;

        const tp = (Math.sin(elapsed * 0.5) + 1) / 2;
        impulsePos.set(0, (tp - 0.5) * SPAN + trackGroup.position.y, 0.2);
        impulse.position.copy(impulsePos);
        impulse.scale.setScalar(0.85 + Math.sin(elapsed * 6.5) * 0.28);

        if (modelReady) {
          const revealT = Math.min((agora - revealStart) / 900, 1);
          const eased = 1 - Math.pow(1 - revealT, 3);
          modelGroup.scale.setScalar(0.001 + eased * 0.999);
        }

        atualizarFagulhas(dt);

        keyLight.position.x = 4.2 + Math.sin(elapsed * 0.3) * 0.7;
        fillLight.position.y = -3.0 + Math.cos(elapsed * 0.25) * 0.7;

        renderer.render(scene, camera);
      }
      animate();

      cleanupCena = () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("resize", onResize);
        window.removeEventListener("scroll", onScroll);
        renderer.dispose();
        scene.traverse((obj) => {
          const mesh = obj as THREE.Mesh;
          if (mesh.geometry) mesh.geometry.dispose();
          const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
          if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
          else mat?.dispose();
        });
      };
    })();

    return () => {
      destruido = true;
      observer?.disconnect();
      cleanupCena?.();
    };
  }, []);

  return <canvas ref={canvasRef} className="spine-bg-canvas" aria-hidden="true" />;
}
