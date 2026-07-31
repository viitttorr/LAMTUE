import { exigirLigante } from "@/lib/auth";
import NovoTicketForm from "@/components/NovoTicketForm";

export default async function NovoTicketLigantePage({ searchParams }: { searchParams: Promise<{ assunto?: string }> }) {
  await exigirLigante();
  const { assunto } = await searchParams;
  return <NovoTicketForm assuntoPadrao={assunto} />;
}
