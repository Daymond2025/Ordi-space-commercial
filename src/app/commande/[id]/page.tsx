import { RouteGuard } from "@/components/RouteGuard";
import { EcranCommande } from "./EcranCommande";

export default async function CommandePage({ params }: PageProps<"/commande/[id]">) {
  const { id } = await params;

  return (
    <RouteGuard>
      <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col bg-white md:my-6 md:min-h-[calc(100dvh-3rem)] md:max-h-[calc(100dvh-3rem)] md:overflow-hidden md:rounded-[2rem] md:shadow-2xl md:shadow-slate-900/15 md:ring-1 md:ring-black/5">
        <EcranCommande commandeId={Number(id)} />
      </div>
    </RouteGuard>
  );
}
