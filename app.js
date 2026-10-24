// Cheryl's Florida Beach Compound — module registry driven app. See README.
const COL={wood:'#2e8b57',scrub:'#6b8e23',wetland:'#3cb371',beach:'#f4d58d',water:'#1e90ff',coastline:'#00e5ff'};
const $=id=>document.getElementById(id);
const J=u=>fetch(u,{cache:'no-store'}).then(r=>r.ok?r.json():null).catch(()=>null);
const esc=x=>String(x??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const money=n=>'$'+Number(n).toLocaleString();
const map=L.map('map',{maxZoom:21});
const sat=L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{attribution:'Esri World Imagery',maxZoom:21,maxNativeZoom:19}).addTo(map);
const st=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap',maxZoom:21,maxNativeZoom:19});
L.control.scale().addTo(map);
let MOD,IDX,groups=[],ctl=null,cur={};

function hideAll(){['map','info'].forEach(i=>$(i).style.visibility='hidden');document.querySelectorAll('.view').forEach(v=>v.style.display='none');}
function showMap(){$('map').style.visibility='visible';$('info').style.visibility='visible';map.invalidateSize();}
function setTab(id){document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('on',b.dataset.s==id));}

async function loadProperty(slug){
  if(cur.slug==slug) return cur;
  const d=`properties/${slug}/`;
  const [par,nb,rd,cx,f,notes]=await Promise.all(['parcel.geojson','neighbors.geojson','roads.geojson','context.geojson','facts.json','constraints.json'].map(x=>J(d+x)));
  groups.forEach(g=>map.removeLayer(g)); if(ctl) map.removeControl(ctl);
  const gCx=L.geoJSON(cx,{style:x=>({color:COL[x.properties.kind],weight:x.properties.kind=='coastline'?4:1,fillOpacity:.3}),onEachFeature:(x,l)=>l.bindTooltip(x.properties.kind=='coastline'?'Gulf shoreline':x.properties.kind)});
  const gNb=L.geoJSON(nb,{style:{color:'#fff',weight:1.5,fillOpacity:0},onEachFeature:(x,l)=>l.bindTooltip(`${esc(x.properties.SITUS_ADDRESS)}<br>Parcel ${x.properties.PARID} · ${(+x.properties.LAND_ACREAGE_CAMA).toFixed(2)} ac`)});
  const gRd=L.layerGroup(),seen={};
  L.geoJSON(rd,{style:{color:'#ffd400',weight:4,opacity:.8},onEachFeature:(x,l)=>{const n=x.properties.name;l.bindTooltip(n);
    if(n&&!seen[n]){seen[n]=1;L.marker(l.getBounds().getCenter(),{icon:L.divIcon({className:'',html:`<div class="rl">${esc(n)}</div>`,iconSize:[0,0]})}).addTo(gRd);}}}).addTo(gRd);
  const gP=L.geoJSON(par,{style:{color:'#ff2d55',weight:6,fillColor:'#ff2d55',fillOpacity:.18}}).bindTooltip(`${esc(f.label)} — parcel ${f.parcel_id}`);
  groups=[gCx,gNb,gRd,gP]; groups.forEach(g=>g.addTo(map));
  ctl=L.control.layers({'Satellite':sat,'Street':st},{'Subject parcel':gP,'Neighbor parcels':gNb,'Roads':gRd,'Shoreline / vegetation (OSM)':gCx},{collapsed:false}).addTo(map);
  showMap(); map.fitBounds(gP.getBounds(),{padding:[200,200],maxZoom:19});
  const p=f.pao,a=f.agent;
  $('info').innerHTML=`<b class="t">${esc(f.label)}</b><br>${esc(f.address)}<br>${esc(f.county)} · Parcel <b>${f.parcel_id}</b><br>
   Lot <b>${esc(f.listed_acres)}</b> (PAO ${p.acres} ac) · List <b>${esc(f.list_price)}</b><br>Listing: ${esc(a.name)}, MLS ${esc(f.mls)}<br>
   <span style="color:#7CFC00">Boundary: ${esc(f.boundary)}</span><br><button class="btn" onclick="go('${slug}','dossier')">Property Dossier →</button>`;
  $('dossier').innerHTML=`<h2 style="font-size:36px;color:#ff6b88;margin:0">${esc(f.label)} – Property Dossier</h2>
   <button class="btn" onclick="go('${slug}','map')">← Back to Map</button><table>
   <tr><td>Address</td><td>${esc(f.address)}</td></tr><tr><td>MLS</td><td>${esc(f.mls)}</td></tr>
   <tr><td>County</td><td>${esc(f.county)}</td></tr><tr><td>Neighborhood</td><td>${esc(f.neighborhood)}</td></tr>
   <tr><td>List price</td><td>${esc(f.list_price)}</td></tr>
   <tr><td>Lot size</td><td>${esc(f.listed_acres)} listed · ${p.acres} ac / ${Number(p.sqft).toLocaleString()} sq ft <span class="src">(PAO)</span></td></tr>
   <tr><td>Parcel ID</td><td>${f.parcel_id} <span class="src">(PAO)</span></td></tr>
   <tr><td>Lot dimensions</td><td>${p.frontage_ft} ft frontage × ${p.depth_ft} ft depth <span class="src">(PAO land record)</span></td></tr>
   <tr><td>Legal</td><td>${esc(p.legal)} <span class="src">(PAO)</span></td></tr>
   <tr><td>Waterfront</td><td>${esc(f.waterfront)} (PAO flag: ${esc(p.waterfront)})</td></tr>
   <tr><td>Zoning / use</td><td>${esc(p.zoning)} · ${esc(p.use)} <span class="src">(PAO)</span></td></tr>
   <tr><td>${p.roll_year} just value</td><td>${money(p.just_value)} <span class="src">(PAO)</span></td></tr>
   <tr><td>Listing agent</td><td>${esc(a.name)} · <a href="${esc(a.url)}" target="_blank">${esc(a.url.replace('https://',''))}</a> · <a href="tel:+1${a.phone.replace(/\D/g,'')}">${esc(a.phone)}</a></td></tr>
   </table><p class="src">${esc(f.sources)}</p>`;
  cur={slug,f,notes}; return cur;
}

async function constraintsHTML(title,notes){
  const data=await J('constraints/constraints.json');
  let h=`<h2 style="font-size:36px;color:#ff6b88;margin:0">${esc(title)}</h2>`;
  if(notes&&notes.length) h+='<h3>Property-specific notes</h3>'+notes.map(n=>`<div class="card"><b>${esc(n.title)}</b><p>${esc(n.note||n.rule)}</p></div>`).join('');
  if(!data||!data.length) return h+'<p>Constraints research is in progress and will appear here soon.</p>';
  const g={};data.forEach(c=>(g[c.category||'Other']=g[c.category||'Other']||[]).push(c));
  return h+Object.entries(g).map(([k,v])=>`<h3>${esc(k)}</h3>`+v.map(c=>{const ok=/^verified$/i.test(c.status||'');
    return `<div class="card"><b style="font-size:26px">${esc(c.title)}</b><span class="badge ${ok?'ok':'nv'}">${ok?'Verified':'Needs verification'}</span>
    <p><b>Rule:</b> ${esc(c.rule)}</p><p><b>Implication:</b> ${esc(c.implication)}</p>${c.notes?`<p class="src">${esc(c.notes)}</p>`:''}
    <p>${(c.sources||[]).map(s=>`<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label||s.url)}</a>`).join(' · ')}</p></div>`}).join('')).join('');
}

const RENDER={
  constraints:m=>constraintsHTML('Constraints (global reference)'),
  table:async m=>{const d=await J(m.data);let h=`<h2 style="font-size:36px;color:#ff6b88;margin:0">${esc(m.label)}</h2>`;
    if(!d||!d.length) return h+`<p>No ${esc(m.label.toLowerCase())} data yet. Add <code>${esc(m.data)}</code> (array of {item,value,notes,source}).</p>`;
    return h+'<table>'+d.map(r=>`<tr><td>${esc(r.item)}</td><td>${esc(r.value)}${r.notes?`<br><span class="src">${esc(r.notes)}</span>`:''}${r.source?` <a href="${esc(r.source)}" target="_blank">source</a>`:''}</td></tr>`).join('')+'</table>';}
};

async function go(slug,view){
  location.hash=`${slug}/${view}`; setTab(slug); hideAll();
  $('sub').innerHTML=MOD.property_views.map(v=>v.status=='live'?`<button class="sub ${v.id==view?'on':''}" onclick="go('${slug}','${v.id}')">${esc(v.label)}</button>`:`<button class="sub soon" title="Coming soon">${esc(v.label)} · soon</button>`).join('');
  const c=await loadProperty(slug);
  if(view=='map') showMap();
  else if(view=='dossier') $('dossier').style.display='block';
  else if(view=='constraints'){ $('cons').innerHTML=await constraintsHTML(`${c.f.label} – Constraints`,c.notes); $('cons').style.display='block'; }
}
async function goGlobal(id){
  const m=MOD.global.find(x=>x.id==id); location.hash=`g/${id}`; setTab('g/'+id); hideAll(); $('sub').innerHTML=`<span class="sec">${esc(m.section)}</span>`;
  $('glob').innerHTML=await RENDER[m.renderer](m); $('glob').style.display='block';
}
(async()=>{
  [MOD,IDX]=await Promise.all([J('modules.json'),J('properties.json')]);
  const t=$('tabs'); let html=IDX.map(i=>`<button class="tab" data-s="${i.slug}" onclick="go('${i.slug}','map')">${esc(i.label)}</button>`).join('');
  let sec=null; MOD.global.forEach(m=>{ if(m.section!=sec){sec=m.section;html+=`<span class="sec">${esc(sec)}</span>`;}
    html+=m.status=='live'?`<button class="tab" data-s="g/${m.id}" onclick="goGlobal('${m.id}')">${esc(m.label)}</button>`:`<button class="tab soon" title="Coming soon">${esc(m.label)} · soon</button>`;});
  t.innerHTML=html;
  const [a,b]=location.hash.slice(1).split('/');
  if(a=='g'&&MOD.global.some(m=>m.id==b&&m.status=='live')) goGlobal(b);
  else go(IDX.some(i=>i.slug==a)?a:IDX[0].slug, MOD.property_views.some(v=>v.id==b&&v.status=='live')?b:'map');
})();
