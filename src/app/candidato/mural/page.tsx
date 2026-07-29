import { exigirCandidato } from "@/lib/auth";
import MuralConteudo from "@/components/MuralConteudo";

export default async function CandidatoMuralPage() {
  await exigirCandidato();
  return <MuralConteudo />;
}
