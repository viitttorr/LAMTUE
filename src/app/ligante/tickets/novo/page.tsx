import { exigirLigante } from "@/lib/auth";
import NovoTicketForm from "@/components/NovoTicketForm";

export default async function NovoTicketLigantePage({ searchParams }: { searchParams: Promise<{ erro?: string; assunto?: string }> }) {
  await exigirLigante();
  const { erro, assunto } = await searchParams;
  return <NovoTicketForm erro={erro} assuntoPadrao={assunto} />;
}
