import { exigirCandidato } from "@/lib/auth";
import BloqueadoSeletivo from "@/components/BloqueadoSeletivo";

export default async function CandidatoCasosPage() {
  await exigirCandidato();
  return <BloqueadoSeletivo />;
}
