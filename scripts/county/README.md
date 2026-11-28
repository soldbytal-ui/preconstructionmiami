# Building profiles from public records

Adds profiles for finished condo towers in Miami-Dade.

- **Names, unit counts, recorded date:** State of Florida condominium registry (DBPR), `Condo_MD.csv`.
- **Position, folio, footprint height:** Miami-Dade County open data, "Building Footprint Ubid Folio".
- A registry entry is kept only when its street address matches a county footprint 90 ft or taller.
- Skipped: towers that already have a profile, listed new projects, registry entries whose address is an office suite, hotels, and anything outside the areas the site covers.
- County heights are **not** published: some footprints are a podium, not the tower (Marquis shows as 148 ft). They are kept in `data/` for checking against a second source.
- Year built is not in either source. The page states the year the condominium was recorded instead.

Run order: `pull.py` (county, one request every 2.5 s), `join.py`, `batch.py`, then send `batch.json` to the `building-ingest` function.
