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
