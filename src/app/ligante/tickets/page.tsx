import { exigirLigante } from "@/lib/auth";
import TicketsLista from "@/components/TicketsLista";

export default async function LiganteTicketsPage() {
  const s = await exigirLigante();
  return <TicketsLista userId={s.id} area="ligante" />;
}
