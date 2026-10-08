type Couleur = "pink" | "blue" | "orange" | "green" | "rose";

const TEINTES: Record<Couleur, { cercle: string; texte: string }> = {
  pink: { cercle: "bg-pink-100 text-pink-600", texte: "text-pink-600" },
  blue: { cercle: "bg-blue-100 text-[color:var(--brand-blue-end)]", texte: "text-[color:var(--brand-blue-end)]" },
  orange: { cercle: "bg-orange-100 text-orange-500", texte: "text-orange-500" },
  green: { cercle: "bg-green-100 text-green-600", texte: "text-green-600" },
  rose: { cercle: "bg-rose-100 text-rose-500", texte: "text-rose-500" },
};

type Props = {
  valeur: string | number;
  label: string;
  couleur: Couleur;
  /** "compte" = valeur dans un cercle pastel ; "montant" = texte coloré seul. */
  type: "compte" | "montant";
};

/** Carte de stat de l'accueil — même composant que les autres apps (Coordinateur/Fournisseur). */
export function CarteStatistique({ valeur, label, couleur, type }: Props) {
  const teinte = TEINTES[couleur];

  return (
    <div
      className="flex flex-1 flex-col items-center justify-center gap-2 rounded-[22px] bg-white px-2 py-3 text-center"
      style={{ boxShadow: "0px 1px 1px 0px rgba(0, 0, 0, 0.25)" }}
    >
      {type === "compte" ? (
        <span className={`flex h-10 w-10 items-center justify-center rounded-full text-base font-extrabold ${teinte.cercle}`}>
          {valeur}
        </span>
      ) : (
        <span className={`text-base font-extrabold ${teinte.texte}`}>{valeur}</span>
      )}
      <span className="text-[11px] font-medium leading-tight text-brand-muted">{label}</span>
    </div>
  );
}
