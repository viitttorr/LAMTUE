import { exigirCandidato } from "@/lib/auth";
import BloqueadoSeletivo from "@/components/BloqueadoSeletivo";

export default async function CandidatoTrilhaPage() {
  await exigirCandidato();
  return <BloqueadoSeletivo />;
}
