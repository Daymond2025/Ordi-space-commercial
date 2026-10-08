/**
 * Horodatage relatif ("il y a 2h") — copié de Cordinateur_App_Web/src/lib/temps.ts
 * (même origine que les autres apps). Pas de dépendance externe
 * (date-fns/dayjs absents du projet).
 */
export function formaterTempsRelatif(iso: string | null): string {
  if (!iso) return "";

  const date = new Date(iso.replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return "";

  const secondes = Math.max(0, (Date.now() - date.getTime()) / 1000);

  if (secondes < 60) return "à l'instant";
  if (secondes < 3600) return `il y a ${Math.floor(secondes / 60)}min`;
  if (secondes < 86400) return `il y a ${Math.floor(secondes / 3600)}h`;
  if (secondes < 604800) return `il y a ${Math.floor(secondes / 86400)}j`;

  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/** "Aujourd'hui à 10:15" / "Hier à 09:15" / "sam 17 jan 26, à 10:15" — liste "Mes paiements". */
export function formaterDateTransaction(iso: string): string {
  const date = new Date(iso.replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return "";

  const heure = date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  const maintenant = new Date();
  const debutAujourdhui = new Date(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate());
  const debutJourDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const joursEcart = Math.round((debutAujourdhui.getTime() - debutJourDate.getTime()) / 86_400_000);

  if (joursEcart === 0) return `Aujourd'hui à ${heure}`;
  if (joursEcart === 1) return `Hier à ${heure}`;

  const jourMois = date
    .toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "short", year: "2-digit" })
    .replace(".", "");
  return `${jourMois}, à ${heure}`;
}
