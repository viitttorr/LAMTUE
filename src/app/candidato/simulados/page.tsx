import { exigirCandidato } from "@/lib/auth";
import BloqueadoSeletivo from "@/components/BloqueadoSeletivo";

export default async function CandidatoSimuladosPage() {
  await exigirCandidato();
  return <BloqueadoSeletivo />;
}
