import { exigirCandidato } from "@/lib/auth";
import BloqueadoSeletivo from "@/components/BloqueadoSeletivo";

export default async function CandidatoPresencasPage() {
  await exigirCandidato();
  return <BloqueadoSeletivo />;
}
