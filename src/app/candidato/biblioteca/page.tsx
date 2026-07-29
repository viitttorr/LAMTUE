import { exigirCandidato } from "@/lib/auth";
import BloqueadoSeletivo from "@/components/BloqueadoSeletivo";

export default async function CandidatoBibliotecaPage() {
  await exigirCandidato();
  return <BloqueadoSeletivo />;
}
