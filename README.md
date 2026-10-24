# Cheryl's Florida Beach Compound

Tabbed static site (Leaflet), one tab per property opportunity: parcel envelope map (satellite/street, neighbors, roads, shoreline, vegetation) + dossier. No buildings drawn.

Live: https://jbarseneau99.github.io/cheryls-florida-beach-compound/

## How to add a property
1. Pull raw data for a bbox around the parcel into `data_raw/` (overwrite or use a subfolder and adjust paths):
   - Parcels: `https://gis.manateepao.gov/arcgis/rest/services/Website/WebLayers/MapServer/0/query?geometry=W,S,E,N&geometryType=esriGeometryEnvelope&inSR=4326&outFields=*&outSR=4326&f=geojson` → `parcels.geojson` (other counties: use their PAO/GIS parcel service)
   - Streets: same service, layer `25` → `streets.geojson`
   - OSM: Overpass `way["natural"~"coastline|beach|water|wood|scrub|wetland"](bbox); out geom;` → `osm.json`
2. Write `data_raw/<slug>-extra.json` with listing facts (address, county, neighborhood, mls, list_price, listed_acres, waterfront, agent{name,url,phone}, sources). Only sourced facts.
3. Run `python3 build_property.py <slug> <PARID> "<Tab label>" data_raw/<slug>-extra.json`. This writes `properties/<slug>/` (parcel, neighbors, roads, context geojson + facts.json) and adds the entry to `properties.json`.
4. Commit and push; GitHub Pages redeploys in about a minute.

## App structure (research → discover → plan → execute)
- `index.html` + `app.js`: static Leaflet app; everything is driven by two config files.
- `properties.json`: index of property tabs. Each `properties/<slug>/` has `parcel/neighbors/roads/context.geojson`, `facts.json`, and optional `constraints.json` (property-specific notes: array of {title,note}).
- `modules.json`: the module registry.
  - `property_views`: sub-views shown inside every property tab (Map, Dossier, Constraints live; Due Diligence, Offer & Negotiation, Closing Timeline coming soon).
  - `global`: top-nav modules grouped by `section` (Reference: Constraints; Management: Finance, Insurance; Build: Contractor/Architect Shortlist, Build Schedule coming soon).
- Global constraints live in `constraints/constraints.json` (array of {category,title,rule,implication,sources[{label,url}],status,notes}); shown in the global Constraints tab and in each property's Constraints view.
- Finance/Insurance read `management/finance.json` / `management/insurance.json` (array of {item,value,notes,source}) and show a placeholder until those exist.

### Adding a module
1. Add an entry to `modules.json` with `status: "coming_soon"` and it appears greyed in the nav.
2. To make it live, set `status: "live"`, a `renderer`, and a `data` path. Reuse `table` or `constraints`, or add a function to `RENDER` in `app.js` (global), or a branch in `go()` (per-property view).
