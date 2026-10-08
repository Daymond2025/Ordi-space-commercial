import { EcranFormationDetail } from "./EcranFormationDetail";

export default async function FormationDetailPage({ params }: PageProps<"/formation/[id]">) {
  const { id } = await params;

  return <EcranFormationDetail id={id} />;
}
