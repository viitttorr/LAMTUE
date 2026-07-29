import { exigirCandidato } from "@/lib/auth";
import BloqueadoSeletivo from "@/components/BloqueadoSeletivo";

export default async function CandidatoCertificadoPage() {
  await exigirCandidato();
  return <BloqueadoSeletivo />;
}
