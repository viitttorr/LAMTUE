import { exigirCandidato } from "@/lib/auth";
import BloqueadoSeletivo from "@/components/BloqueadoSeletivo";

export default async function CandidatoMuralPage() {
  await exigirCandidato();
  return <BloqueadoSeletivo />;
}
