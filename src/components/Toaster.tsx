"use client";
import { useEffect, useSyncExternalStore } from "react";

export type ToastTipo = "ok" | "erro";
export type Toast = { id: number; mensagem: string; tipo: ToastTipo };

const DURACAO_MS = 3400;

/**
 * O estado do toast vive FORA do React, em módulo.
 *
 * `revalidatePath` dentro das server actions dispara um refresh da árvore RSC,
 * que remonta os client components do layout — se o toast morasse num
 * `useState` do Toaster, ele piscaria e sumiria no mesmo instante em que os
 * dados se atualizam (exatamente quando ele precisa aparecer). Guardando fora,
 * a remontagem apenas relê o toast pendente e o mantém até o tempo acabar.
 */
let atual: Toast | null = null;
let proximoId = 1;
let timer: ReturnType<typeof setTimeout> | null = null;
const inscritos = new Set<() => void>();

function notificar() {
  for (const fn of inscritos) fn();
}

function inscrever(fn: () => void) {
  inscritos.add(fn);
  return () => { inscritos.delete(fn); };
}

function lerAtual() {
  return atual;
}

/** Dispara um toast de qualquer client component, sem precisar de contexto/provider. */
export function mostrarToast(mensagem: string, tipo: ToastTipo = "ok") {
  atual = { id: proximoId++, mensagem, tipo };
  notificar();
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    atual = null;
    timer = null;
    notificar();
  }, DURACAO_MS);
}

export function fecharToast() {
  if (timer) { clearTimeout(timer); timer = null; }
  atual = null;
  notificar();
}

/**
 * Aviso flutuante central. Substitui o padrão antigo de `redirect("?ok=...")`,
 * que recarregava a página e jogava o usuário para o topo — aqui a posição de
 * rolagem é preservada e os dados se atualizam sozinhos via revalidatePath.
 */
export default function Toaster() {
  const toast = useSyncExternalStore(inscrever, lerAtual, () => null);

  // fecha com Esc
  useEffect(() => {
    if (!toast) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") fecharToast(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [toast]);

  if (!toast) return null;

  return (
    <div className="toast-wrap" role="status" aria-live="polite" key={toast.id}>
      <div className={`toast toast-${toast.tipo}`}>
        <span className="toast-icone">{toast.tipo === "ok" ? "✓" : "!"}</span>
        <span>{toast.mensagem}</span>
        <button type="button" className="toast-fechar" aria-label="Fechar aviso" onClick={fecharToast}>✕</button>
      </div>
    </div>
  );
}
