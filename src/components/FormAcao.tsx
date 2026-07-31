"use client";
import { useActionState, useEffect, useRef } from "react";
import { mostrarToast } from "./Toaster";

export type ResultadoAcao = { ok?: string; erro?: string } | void;

/**
 * Formulário que exibe o retorno da server action como toast, sem navegar.
 *
 * Server actions que fazem `redirect()` recarregam a página inteira e jogam o
 * usuário para o topo. Aqui a action apenas RETORNA `{ ok }` / `{ erro }`: o
 * Next trata a submissão via fetch, o `revalidatePath` dentro da action
 * atualiza os dados no lugar, e a posição de rolagem é preservada.
 *
 * `limparAoConcluir` esvazia o formulário depois de um sucesso — útil em
 * formulários de cadastro que antes eram limpos pelo recarregamento.
 */
export default function FormAcao({
  action,
  children,
  limparAoConcluir = false,
  ...props
}: {
  action: (formData: FormData) => Promise<ResultadoAcao>;
  /** Opcional: o form da tabela de inscritos é vazio e recebe os campos via atributo `form={id}`. */
  children?: React.ReactNode;
  limparAoConcluir?: boolean;
} & Omit<React.FormHTMLAttributes<HTMLFormElement>, "action">) {
  const ref = useRef<HTMLFormElement>(null);
  const [estado, formAction] = useActionState<ResultadoAcao, FormData>(
    async (_anterior, formData) => await action(formData),
    undefined
  );

  useEffect(() => {
    if (!estado) return;
    if (estado.erro) mostrarToast(estado.erro, "erro");
    else if (estado.ok) {
      mostrarToast(estado.ok, "ok");
      if (limparAoConcluir) ref.current?.reset();
    }
  }, [estado, limparAoConcluir]);

  return <form ref={ref} action={formAction} {...props}>{children}</form>;
}
