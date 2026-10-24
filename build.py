import json, folium
from folium.features import DivIcon
NAME="Cheryl's Florida Beach Compound"
P=json.load(open('parcels.geojson'));S=json.load(open('streets.geojson'));O=json.load(open('osm.json'))
tgt=[f for f in P['features'] if f['properties']['PARID']=='7843900007'][0]
nb=[f for f in P['features'] if f is not tgt]
ring=tgt['geometry']['coordinates'][0]
cy=sum(c[1] for c in ring)/len(ring);cx=sum(c[0] for c in ring)/len(ring)
m=folium.Map([cy,cx],zoom_start=19,max_zoom=21,tiles=None,control_scale=True)
folium.TileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',attr='Esri World Imagery',name='Satellite',max_zoom=21,max_native_zoom=19).add_to(m)
folium.TileLayer('OpenStreetMap',name='Street',max_zoom=21,max_native_zoom=19).add_to(m)
veg=folium.FeatureGroup('Vegetation / beach / water (OSM)').add_to(m)
col={'wood':'#2e8b57','scrub':'#6b8e23','wetland':'#3cb371','beach':'#f4d58d','water':'#1e90ff','coastline':'#00e5ff'}
for e in O['elements']:
  t=e.get('tags',{});n=t.get('natural');g=[(p['lat'],p['lon']) for p in e.get('geometry',[])]
  if n in col:
    if n=='coastline': folium.PolyLine(g,color=col[n],weight=4,tooltip='Gulf of Mexico shoreline').add_to(veg)
    else: folium.Polygon(g,color=col[n],fill=True,fill_opacity=.3,weight=1,tooltip=n).add_to(veg)
nbg=folium.FeatureGroup('Neighbor parcels (Manatee PAO)').add_to(m)
folium.GeoJson({'type':'FeatureCollection','features':nb},style_function=lambda f:{'color':'#ffffff','weight':1.5,'fillOpacity':0},
  tooltip=folium.GeoJsonTooltip(['SITUS_ADDRESS','PARID','LAND_ACREAGE_CAMA'],aliases=['Address','Parcel','Acres'])).add_to(nbg)
rd=folium.FeatureGroup('Roads (Manatee GIS)').add_to(m);seen=set()
for f in S['features']:
  g=f['geometry'];lines=g['coordinates'] if g['type']=='MultiLineString' else [g['coordinates']]
  nm=f['properties'].get('STREET_NAME') or ''
  for L in lines:
    pts=[(c[1],c[0]) for c in L];folium.PolyLine(pts,color='#ffd400',weight=4,opacity=.8,tooltip=nm).add_to(rd)
    if nm and (nm not in seen or len(pts)>4):
      seen.add(nm);mid=pts[len(pts)//2]
      folium.Marker(mid,icon=DivIcon(icon_size=(260,30),icon_anchor=(0,15),html=f'<div style="font:bold 22px sans-serif;color:#ffd400;text-shadow:0 0 4px #000,0 0 4px #000">{nm.title()}</div>')).add_to(rd)
folium.GeoJson(tgt,style_function=lambda f:{'color':'#ff2d55','weight':6,'fillColor':'#ff2d55','fillOpacity':.18},tooltip='6441 Gulfside Rd — parcel 7843900007',name='Subject parcel').add_to(m)
folium.LayerControl(collapsed=False).add_to(m)
m.get_root().header.add_child(folium.Element(f"<title>{NAME}</title><style>html,body{{margin:0;height:100%}}.leaflet-control-layers{{font-size:20px}}.leaflet-tooltip{{font-size:20px}}</style>"))
m.get_root().html.add_child(folium.Element(f'''<div style="position:fixed;top:12px;left:60px;z-index:9999;background:rgba(0,0,0,.78);color:#fff;padding:16px 22px;border-radius:12px;font:22px/1.4 sans-serif;max-width:520px">
<div style="font-size:30px;font-weight:bold;color:#ff6b88">{NAME}</div>
6441 Gulfside Rd, Longboat Key, FL 34228<br>Manatee County · Parcel <b>7843900007</b><br>
Listing: Reed Murphy, MLS 84692771, Sleepy Lagoon<br>Lot <b>0.71 ac</b> (PAO: 0.714 ac) · List <b>$5.6M</b> · Gulf-front<br>
<span style="color:#7CFC00">Boundary: REAL (Manatee County PAO parcel GIS)</span><br>
<span style="font-size:16px">Context: Manatee GIS streets, OSM shoreline/vegetation. Envelope only, no structures.</span></div>'''))
m.save('index.html')
