"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { registrarPagina } from "@/app/actions/acesso";

/**
 * Envia a rota atual para o log a cada navegação dentro da área logada.
 * Não renderiza nada; a de-duplicação fica no servidor.
 */
export default function RegistroDePagina() {
  const path = usePathname();
  useEffect(() => {
    if (!path) return;
    void registrarPagina(path);
  }, [path]);
  return null;
}
