// Startgegevens uit je Excel en het schema. Worden één keer geïmporteerd via de knop in de app.
export const SEED_KM = [
  { km: 133890, date: "2026-10-27", note: "Startstand uit het schema" },
];

const h = (name, date, km) => ({ name, date, km, approx: true });
export const SEED_HISTORY = [
  h("Banden rondom", "2025-12-01", 111000),
  h("Oliebeurt", "2025-12-01", 111000),
  h("Luchtfilter", "2025-12-01", 111000),
  h("Interieurfilter", "2025-12-01", 111000),
  h("Voorremmen vervangen", "2026-01-01", 113000),
  h("Uitlijnen", "2026-01-01", 113000),
  h("Eventuri inlets", "2026-03-01", 117000),
  h("MHD tune Stage 1", "2026-03-01", 117000),
  h("Front Maxton Design splitter", "2026-04-01", 117000),
  h("Bougies", "2026-07-01", 125000),
  h("Oliebeurt", "2026-07-01", 125000),
  h("Ruitenwissers V/A", "2026-07-01", 125000),
  h("Remmen achter vervangen", "2026-08-01", 126000),
  h("Differentieel voor oliebeurt", "2026-10-01", 132000),
  h("Differentieel achter oliebeurt", "2026-10-01", 132000),
  h("Tussenbak oliebeurt", "2026-10-01", 132000),
  h("Linksachterpaneel gepolijst", "2026-10-01", 132000),
  h("Nieuw achterlogo", "2026-10-01", 132000),
];
