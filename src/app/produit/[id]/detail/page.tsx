import { EcranDetailProduit } from "./EcranDetailProduit";

export default async function DetailProduitPage({ params }: PageProps<"/produit/[id]/detail">) {
  const { id } = await params;

  return <EcranDetailProduit produitId={Number(id)} />;
}
