import { EcranDiscussionProduit } from "./EcranDiscussionProduit";

export default async function ProduitPage({ params }: PageProps<"/produit/[id]">) {
  const { id } = await params;

  return <EcranDiscussionProduit produitId={Number(id)} />;
}
