import { exigirCandidato } from "@/lib/auth";
import TicketsLista from "@/components/TicketsLista";

export default async function CandidatoTicketsPage() {
  const s = await exigirCandidato();
  return <TicketsLista userId={s.id} area="candidato" />;
}
