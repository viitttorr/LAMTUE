import { exigirLigante } from "@/lib/auth";
import MuralConteudo from "@/components/MuralConteudo";

export default async function MuralPage() {
  await exigirLigante();
  return <MuralConteudo />;
}
