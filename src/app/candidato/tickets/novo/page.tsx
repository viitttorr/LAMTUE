import { exigirCandidato } from "@/lib/auth";
import NovoTicketForm from "@/components/NovoTicketForm";

export default async function NovoTicketCandidatoPage({ searchParams }: { searchParams: Promise<{ assunto?: string }> }) {
  await exigirCandidato();
  const { assunto } = await searchParams;
  return <NovoTicketForm assuntoPadrao={assunto} />;
}
