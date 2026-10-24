"""Generate properties/<slug>/ data from Manatee PAO parcel GIS + Manatee streets + OSM Overpass.
Usage: python3 build_property.py <slug> <PARID> "<Tab label>" facts_extra.json
Raw inputs: data_raw/parcels.geojson, streets.geojson, osm.json (bbox around parcel)."""
import json, sys, os
slug, parid, label, extra = sys.argv[1:5]
R='data_raw/'; P=json.load(open(R+'parcels.geojson')); S=json.load(open(R+'streets.geojson')); O=json.load(open(R+'osm.json'))
tgt=[f for f in P['features'] if f['properties']['PARID']==parid][0]
keep=['PARID','SITUS_ADDRESS','LAND_ACREAGE_CAMA']
slim=lambda f:{'type':'Feature','geometry':f['geometry'],'properties':{k:f['properties'].get(k) for k in keep}}
fc=lambda fs:{'type':'FeatureCollection','features':fs}
d=f'properties/{slug}/'; os.makedirs(d,exist_ok=True)
json.dump(fc([slim(tgt)]),open(d+'parcel.geojson','w'))
json.dump(fc([slim(f) for f in P['features'] if f is not tgt]),open(d+'neighbors.geojson','w'))
json.dump(fc([{'type':'Feature','geometry':f['geometry'],'properties':{'name':(f['properties'].get('STREET_NAME') or '').title()}} for f in S['features']]),open(d+'roads.geojson','w'))
ctx=[]
for e in O['elements']:
  n=e.get('tags',{}).get('natural')
  if n in ('coastline','beach','water','wood','scrub','wetland') and e.get('geometry'):
    c=[[p['lon'],p['lat']] for p in e['geometry']]
    g={'type':'LineString','coordinates':c} if n=='coastline' or c[0]!=c[-1] else {'type':'Polygon','coordinates':[c]}
    ctx.append({'type':'Feature','geometry':g,'properties':{'kind':n}})
json.dump(fc(ctx),open(d+'context.geojson','w'))
p=tgt['properties']
facts={'label':label,'parcel_id':parid,'boundary':'REAL — Manatee County Property Appraiser parcel GIS',
 'pao':{'acres':round(p['LAND_ACREAGE_CAMA'],3),'sqft':p['LAND_SQFT_CAMA'],'frontage_ft':p['LAND_FRONTAGE'],'depth_ft':p['LAND_DEPTH'],
  'legal':(p['PAR_LEGAL1']+' '+p['PAR_LEGAL2']).strip(),'subdivision':p['PAR_SUBDIV_NAME'],'zoning':p['PAR_ZONING'],
  'use':p['CUR_MAN_LUC_DESC'],'just_value':p['CER_JUST_VALUE'],'roll_year':p['CER_ROLL_YEAR'],'waterfront':p['PAR_WATERFRT_FLAG'].strip()}}
facts.update(json.load(open(extra)))
json.dump(facts,open(d+'facts.json','w'),indent=1)
idx=json.load(open('properties.json')) if os.path.exists('properties.json') else []
idx=[i for i in idx if i['slug']!=slug]+[{'slug':slug,'label':label}]
json.dump(idx,open('properties.json','w'),indent=1); print('ok',d)
