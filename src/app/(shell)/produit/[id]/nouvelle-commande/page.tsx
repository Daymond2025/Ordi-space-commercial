import { EcranNouvelleCommande } from "./EcranNouvelleCommande";

export default async function NouvelleCommandePage({ params }: PageProps<"/produit/[id]/nouvelle-commande">) {
  const { id } = await params;

  return <EcranNouvelleCommande produitId={Number(id)} />;
}
