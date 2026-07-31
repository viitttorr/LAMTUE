import { exigirCandidato } from "@/lib/auth";
import NovoTicketForm from "@/components/NovoTicketForm";

export default async function NovoTicketCandidatoPage({ searchParams }: { searchParams: Promise<{ erro?: string; assunto?: string }> }) {
  await exigirCandidato();
  const { erro, assunto } = await searchParams;
  return <NovoTicketForm erro={erro} assuntoPadrao={assunto} />;
}
