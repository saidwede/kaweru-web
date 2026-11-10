export const BENIN_CITIES = [
  "Cotonou",
  "Parakou",
  "Bohicon",
  "Dassa-Zoumè",
  "Natitingou",
  "Porto-Novo",
  "Abomey-Calavi",
  "Djougou",
  "Abomey",
  "Lokossa",
  "Kandi",
  "Malanville",
];

export function formatFrenchDate(dateVal?: string | Date): string {
  if (!dateVal) return "";
  try {
    if (typeof dateVal === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateVal)) {
      const [year, month, day] = dateVal.split("-").map(Number);
      const d = new Date(year, month - 1, day);
      return d.toLocaleDateString("fr-FR", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }
    const d = typeof dateVal === "string" ? new Date(dateVal) : dateVal;
    if (isNaN(d.getTime())) return String(dateVal);
    return d.toLocaleDateString("fr-FR", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return String(dateVal);
  }
}

export function getLocalDateString(offsetDays = 0): string {
  const d = new Date();
  if (offsetDays !== 0) {
    d.setDate(d.getDate() + offsetDays);
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
