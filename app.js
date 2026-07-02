/* ============================================================
   SOSER · Agregar Caso — App Web (v3, rediseño premium)
   ============================================================ */
const COL={RBD:0,NOM:1,DIR:2,COM:3,SUP:4,INST:5,TEC:6};
const LOGO_SVG=`<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="sg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F49A0F"/><stop offset="0.5" stop-color="#E8A30C"/><stop offset="1" stop-color="#7DB61C"/></linearGradient></defs><path d="M50 12 C30 12 20 30 28 48 C34 62 50 64 50 64 C50 64 66 62 72 48 C80 30 70 12 50 12 Z" fill="url(#sg)"/><path d="M50 20 C44 30 56 40 50 52 C46 44 54 34 50 20 Z" fill="#2E7D32" opacity="0.85"/></svg>`;
const LS_CFG='soser_caso_cfg', LS_REPORTS='soser_caso_reports';
const CFG_PIN='123456789';
const State={est:null,cat:null,desc:'',media:[],gps:null,gpsWatch:null,startedAt:null};
let CFG=loadCfg();
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const content=$('#content'),navwrap=$('#navwrap'),overlays=$('#overlays');
const btnBack=$('#btnBack'),btnNext=$('#btnNext');
$('#logoSlot').innerHTML=LOGO_SVG;

function toast(m,ms=2000){const t=document.createElement('div');t.className='toast';t.textContent=m;document.body.appendChild(t);setTimeout(()=>t.remove(),ms);}
function norm(s){return (s||'').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');}
function loadCfg(){try{return JSON.parse(localStorage.getItem(LS_CFG))||{}}catch{return{}}}
function saveCfg(c){localStorage.setItem(LS_CFG,JSON.stringify(c));CFG=c;}
function loadReports(){try{return JSON.parse(localStorage.getItem(LS_REPORTS))||[]}catch{return[]}}
function saveReports(r){localStorage.setItem(LS_REPORTS,JSON.stringify(r));}
function stamp(){const d=new Date();const p=n=>String(n).padStart(2,'0');return `${p(d.getDate())}-${p(d.getMonth()+1)}-${d.getFullYear()}_${p(d.getHours())}-${p(d.getMinutes())}-${p(d.getSeconds())}`;}
function nextReportId(){const ini=(CFG.encargado||'X').trim().charAt(0).toUpperCase();const reps=loadReports().filter(r=>r.encargado===CFG.encargado);return ini+String(reps.length+1).padStart(4,'0');}
function showNav(show){navwrap.classList.toggle('hidden',!show);}

/* GPS */
function startGPS(){const chip=$('#gpsChip'),dot=$('#gpsDot'),txt=$('#gpsTxt');chip.classList.remove('hidden');dot.className='dot wait';txt.textContent='GPS…';
  if(!navigator.geolocation){txt.textContent='Sin GPS';dot.className='dot';return;}
  if(State.gpsWatch)navigator.geolocation.clearWatch(State.gpsWatch);
  State.gpsWatch=navigator.geolocation.watchPosition(p=>{State.gps={lat:p.coords.latitude,lon:p.coords.longitude,acc:p.coords.accuracy};dot.className='dot ok';txt.textContent='±'+Math.round(p.coords.accuracy)+'m';},()=>{dot.className='dot';txt.textContent='GPS off';},{enableHighAccuracy:true,maximumAge:0,timeout:20000});}
function stopGPS(){if(State.gpsWatch){navigator.geolocation.clearWatch(State.gpsWatch);State.gpsWatch=null;}}

/* ============================================================ HOME */
function renderHome(){
  stopGPS();$('#gpsChip').classList.add('hidden');showNav(false);$('#btnHome').classList.add('hidden');$('#modeLabel').textContent='Casos';
  const cfgOk=CFG.sheetUrl&&CFG.encargado;
  const nrep=loadReports().filter(r=>r.encargado===CFG.encargado).length;
  content.innerHTML=`<div class="screen"><div style="flex:0 0 auto">
    <div class="hero"><div class="mark">${LOGO_SVG}</div><h1>Gestión de Casos</h1>
      <p>${cfgOk?('Encargado: '+CFG.encargado):'Registro de mantención · SOSER'}</p></div>
    <div class="home-actions">
      <button class="emerg-action" id="aEmerg"><div class="pulse"></div><div class="pa-ic">🚨</div><div><h3>Emergencia</h3><p>Reporte inmediato · salta la categoría</p></div><div class="pa-arrow">›</div></button>
      <button class="primary-action" id="aAdd"><div class="pa-ic">➕</div><div><h3>Agregar caso</h3><p>Nuevo reporte de mantención en terreno</p></div><div class="pa-arrow">›</div></button>
      <button class="primary-action rep" id="aReports"><div class="pa-ic">📋</div><div><h3>Reportes generados</h3><p>${nrep} registrado(s) · estados y derivaciones</p></div><div class="pa-arrow">›</div></button>
    </div>
    <div class="cfg-fab" id="aCfg" title="Configuración">⚙️</div>
    ${cfgOk?'':'<div class="cfg-warn">Configura primero (ícono ⚙️) el <b>Sheet</b> y el <b>nombre de encargado</b>.</div>'}
  </div></div>`;
  $('#aEmerg').onclick=()=>{ if(!cfgOk){toast('Primero completa la configuración');askPin(renderConfig);return;} startCase(true); };
  $('#aAdd').onclick=()=>{ if(!cfgOk){toast('Primero completa la configuración');askPin(renderConfig);return;} startCase(false); };
  $('#aReports').onclick=renderReports;
  $('#aCfg').onclick=()=>askPin(renderConfig);
}

/* PIN */
function askPin(onOk){
  showNav(false);$('#btnHome').classList.remove('hidden');$('#btnHome').onclick=renderHome;let entered='';
  content.innerHTML=`<div class="screen"><div style="flex:1;display:flex;align-items:center;justify-content:center">
    <div class="card" style="max-width:340px;width:100%">
      <div class="eyebrow"><b>Configuración</b></div>
      <h2 class="q" style="text-align:center;margin-bottom:4px">Ingresa la clave</h2>
      <div class="pin-dots" id="pinDots">${'<i></i>'.repeat(9)}</div>
      <div class="pin-grid" id="pinGrid">
        ${[1,2,3,4,5,6,7,8,9].map(n=>`<button class="pin-key" data-k="${n}">${n}</button>`).join('')}
        <button class="pin-key" data-k="del">⌫</button><button class="pin-key" data-k="0">0</button><button class="pin-key" data-k="ok" style="background:var(--grad);color:#fff">✓</button>
      </div>
    </div></div></div>`;
  const dots=()=>$$('#pinDots i').forEach((d,i)=>d.classList.toggle('on',i<entered.length));
  const check=()=>{if(entered===CFG_PIN)onOk();else{toast('Clave incorrecta');entered='';dots();}};
  $$('#pinGrid .pin-key').forEach(b=>b.onclick=()=>{const k=b.dataset.k;if(k==='del')entered=entered.slice(0,-1);else if(k==='ok')return check();else if(entered.length<9)entered+=k;dots();if(entered.length===9)check();});
}

/* CONFIG */
function renderConfig(){
  showNav(true);$('#btnHome').classList.remove('hidden');$('#btnHome').onclick=renderHome;
  content.innerHTML=`<div class="screen"><div style="flex:1;overflow-y:auto"><div class="card">
    <div class="eyebrow"><b>Configuración</b></div><h2 class="q">Conexión y encargado</h2>
    <div class="banner">Pega la URL de tu <b>Apps Script</b> (termina en <code>/exec</code>) y tu <b>nombre de encargado</b>.</div>
    <div class="field-block"><label class="fld">URL del Apps Script (/exec)</label><input type="url" id="cfgUrl" placeholder="https://script.google.com/macros/s/.../exec" value="${CFG.sheetUrl||''}"></div>
    <div class="field-block"><label class="fld">Nombre de encargado</label><input type="text" id="cfgEnc" placeholder="Ej: Manuel Echeverría" value="${CFG.encargado||''}"></div>
    <p class="note">Se guardan en este dispositivo. Cada encargado usa su propio nombre.</p>
  </div></div></div>`;
  btnBack.onclick=renderHome;btnNext.textContent='Guardar';btnNext.disabled=false;btnNext.className='btn accent';
  btnNext.onclick=()=>{const url=$('#cfgUrl').value.trim(),enc=$('#cfgEnc').value.trim();if(!enc){toast('Falta el nombre de encargado');return;}
    if(url&&!/^https:\/\/script\.google\.com\/.*\/exec$/.test(url)){if(!confirm('La URL no parece /exec. ¿Guardar igual?'))return;}
    saveCfg({sheetUrl:url,encargado:enc});toast('Configuración guardada');renderHome();};
}

/* ============================================================ REPORTES (2 pestañas) */
let repTab='mios';        // 'mios' | 'general'
let repFilterEst=null;    // establecimiento elegido en General
let repMios=[], repGeneral=[];
async function renderReports(){
  showNav(false);$('#btnHome').classList.remove('hidden');$('#btnHome').onclick=renderHome;
  repTab='mios';repFilterEst=null;
  repMios=loadReports().filter(r=>r.encargado===CFG.encargado);
  paintReports();
  // refrescar "míos" desde el Sheet
  const mine=await fetchMine();
  if(mine){const pend=repMios.filter(r=>r.enviado===false);repMios=[...mine.map(r=>({...r,enviado:true})),...pend];paintReports();}
}
function estadoDe(r){
  const v=(r.visado||'').toString().trim().toLowerCase(), d=(r.derivadoA||'').toString().trim();
  if(v.startsWith('eliminado'))return{k:'pend',t:'Eliminado'};
  if(r.enviado===false)return{k:'pend',t:'Pendiente envío'};
  if(v.includes('final')||v.includes('solucion'))return{k:'fin',t:'Finalizado'};
  if(d)return{k:'der',t:'Derivado'};
  if(v)return{k:'vis',t:'Visado'};
  return{k:'pend',t:'Sin visar'};
}
function isBorrado(r){return r.borrado||(r.visado||'').toString().toLowerCase().startsWith('eliminado');}
function paintReports(){
  const source = repTab==='mios' ? repMios : repGeneral;
  const activos=source.filter(r=>!isBorrado(r));
  const scope = (repTab==='general'&&repFilterEst)? source.filter(r=>(r.nom||r.establecimiento)===repFilterEst) : source;
  const scopeAct=scope.filter(r=>!isBorrado(r));
  const total=scopeAct.length;
  const derivados=scopeAct.filter(r=>estadoDe(r).k==='der').length;
  const solucion=scopeAct.filter(r=>estadoDe(r).k==='fin').length;
  const ests=[...new Set(activos.map(r=>r.nom||r.establecimiento).filter(Boolean))];
  const searchBlock = repTab==='general' ? (
    repFilterEst
      ? `<button class="btn ghost" id="clrEst" style="width:100%;margin-bottom:12px;flex:none">‹ Ver todos los establecimientos</button>`
      : `<div class="rep-search search-wrap" style="margin-bottom:12px"><span class="ic-lead">🔎</span>
          <input type="text" id="repQ" placeholder="Buscar establecimiento con casos…" autocomplete="off">
          <div class="suggest hidden" id="repSug"></div></div>`
  ) : '';
  content.innerHTML=`<div class="screen">
    <div class="rep-head">
      <div class="tabs">
        <button class="tab ${repTab==='mios'?'sel':''}" data-tab="mios">Mis reportes</button>
        <button class="tab ${repTab==='general'?'sel':''}" data-tab="general">General</button>
      </div>
      <div class="kpis">
        <div class="kpi"><div class="bar"></div><div class="n">${total}</div><div class="l">${(repTab==='general'&&repFilterEst)?'Casos':'Total'}</div></div>
        <div class="kpi der"><div class="bar"></div><div class="n">${derivados}</div><div class="l">Derivados</div></div>
        <div class="kpi sol"><div class="bar"></div><div class="n">${solucion}</div><div class="l">Solucionados</div></div>
      </div>
      ${searchBlock}
    </div>
    <div class="rep-list" id="repList">${renderRepList(scope)}</div>
  </div>`;
  $$('.tab').forEach(t=>t.onclick=()=>switchTab(t.dataset.tab));
  bindRepList(scope);
  if(repTab==='general'){
    if(repFilterEst){$('#clrEst').onclick=()=>{repFilterEst=null;paintReports();};}
    else{
      const inp=$('#repQ'),sug=$('#repSug');
      inp.addEventListener('input',()=>{const v=norm(inp.value.trim());if(!v){sug.classList.add('hidden');return;}
        const m=ests.filter(e=>norm(e).includes(v)).slice(0,12);
        if(!m.length){sug.classList.add('hidden');return;}
        sug.innerHTML=m.map(e=>{const n=activos.filter(r=>(r.nom||r.establecimiento)===e).length;return `<div data-e="${e.replace(/"/g,'&quot;')}"><div>${e}<small>${n} caso(s)</small></div></div>`;}).join('');
        sug.classList.remove('hidden');
        $$('#repSug div[data-e]').forEach(d=>d.onclick=()=>{repFilterEst=d.dataset.e;paintReports();});});
    }
  }
}
async function switchTab(tab){
  repTab=tab;repFilterEst=null;
  if(tab==='general'&&!repGeneral.length){
    paintReports(); // pinta vacío
    const box=$('#repList');if(box)box.innerHTML=`<div class="loading" style="padding:30px;text-align:center;color:var(--muted)"><span class="spinner" style="border-top-color:var(--orange)"></span><p>Cargando casos generales…</p></div>`;
    const all=await fetchGeneral();
    if(all)repGeneral=all;
    paintReports();
  } else { paintReports(); }
}
function renderRepList(scope){
  const list=scope.slice().sort((a,b)=>{
    const ba=isBorrado(a),bb=isBorrado(b);
    if(ba!==bb)return ba?1:-1;                 // borrados al final
    return (b.ts||0)-(a.ts||0) || String(b.id).localeCompare(String(a.id));
  });
  if(!list.length)return `<div class="empty"><div class="ic">📭</div><p>Sin reportes ${repTab==='general'?'en general':'aún'}.</p></div>`;
  return list.map((r,i)=>{
    const borrado=isBorrado(r);
    const st=estadoDe(r);
    const verifCount=verifList(r).length;
    const canDelete = repTab==='mios' && !borrado;
    return `<div class="rep ${borrado?'deleting':''}">
      <div class="rid">${r.id}</div>
      <div class="rbody">
        <div class="rtitle" style="${borrado?'text-decoration:line-through;color:#999':''}">${r.nom||r.establecimiento} · RBD ${r.rbd}</div>
        <div class="rdesc" style="${borrado?'text-decoration:line-through':''}">${r.desc||r.descripcion||''}</div>
        <div class="rmeta"><span>${r.cat||r.categoria||''}</span><span>${r.fecha||''}</span><span class="rstate ${st.k}">${st.t}</span>${r.derivadoA?`<span>↗ ${r.derivadoA}</span>`:''}${borrado&&r.motivoBorrado?`<span>· ${r.motivoBorrado}</span>`:''}</div>
      </div>
      ${verifCount?`<button class="rverif" data-verif="${i}"><span class="vic">📎</span>Ver<br>(${verifCount})</button>`:''}
      ${canDelete?`<button class="rdel" data-del="${r.id}" title="Eliminar">🗑️</button>`:''}
    </div>`;}).join('');
}
// Extrae verificadores (de media local o del texto del Sheet)
function verifList(r){
  if(Array.isArray(r.media)&&r.media.length)return r.media.map(m=>({name:m.name||'',url:m.url||'',type:m.type||(/\.webm$/i.test(m.name)?'video':'photo')}));
  const raw=r.verificadores||'';
  if(!raw)return [];
  return String(raw).split('\n').map(line=>{
    if(!line.trim())return null;
    const um=line.match(/(https?:\/\/[^\s]+)/);
    const url=um?um[1]:'';
    const type=/video/i.test(line)||/\.webm/i.test(line)?'video':'photo';
    const nm=line.split(':')[0].trim();
    return url?{name:nm,url,type}:null;
  }).filter(Boolean);
}
function bindRepList(scope){
  const list=scope.slice().sort((a,b)=>{const ba=isBorrado(a),bb=isBorrado(b);if(ba!==bb)return ba?1:-1;return (b.ts||0)-(a.ts||0)||String(b.id).localeCompare(String(a.id));});
  $$('#repList .rdel').forEach(btn=>btn.onclick=()=>openDelete(btn.dataset.del));
  $$('#repList .rverif').forEach(btn=>btn.onclick=()=>openViewer(verifList(list[+btn.dataset.verif])));
}

/* ---------- VISOR de verificadores ---------- */
function openViewer(items){
  if(!items||!items.length){toast('Sin verificadores');return;}
  let idx=0;
  const ov=document.createElement('div');ov.className='viewer-bg';
  overlays.appendChild(ov);
  const render=()=>{
    const it=items[idx];
    ov.innerHTML=`<div class="viewer-top"><span class="vcount">${idx+1} / ${items.length}</span><button class="vclose">✕</button></div>
      <div class="viewer-stage">
        ${items.length>1?`<button class="viewer-nav prev" ${idx===0?'disabled':''}>‹</button>`:''}
        ${it.type==='video'?`<video src="${it.url}" controls autoplay playsinline></video>`:`<img src="${it.url}" alt="">`}
        ${items.length>1?`<button class="viewer-nav next" ${idx===items.length-1?'disabled':''}>›</button>`:''}
      </div>
      <div class="viewer-cap">${it.name||''}</div>`;
    $('.vclose',ov).onclick=close;
    const pv=$('.viewer-nav.prev',ov),nx=$('.viewer-nav.next',ov);
    if(pv)pv.onclick=()=>{if(idx>0){idx--;render();}};
    if(nx)nx.onclick=()=>{if(idx<items.length-1){idx++;render();}};
  };
  const close=()=>ov.remove();
  ov.addEventListener('click',e=>{if(e.target===ov)close();});
  render();
}

function openDelete(id){
  const bg=document.createElement('div');bg.className='modal-bg';
  bg.innerHTML=`<div class="modal"><h3>Eliminar caso ${id}</h3><p>Indica el motivo de la eliminación. El caso quedará tachado y al final de la lista, pero seguirá visible.</p>
    <textarea id="delMotivo" placeholder="Ej: subido por error, duplicado…"></textarea>
    <div class="mbtns"><button class="btn ghost" id="delCancel" style="flex:1">Cancelar</button><button class="btn" id="delOk" style="flex:1;background:var(--red);color:#fff">Eliminar</button></div>
  </div>`;
  overlays.appendChild(bg);
  const close=()=>bg.remove();
  bg.onclick=e=>{if(e.target===bg)close();};
  $('#delCancel',bg).onclick=close;
  $('#delOk',bg).onclick=async()=>{
    const motivo=$('#delMotivo',bg).value.trim();if(!motivo){toast('Indica el motivo');return;}
    $('#delOk',bg).innerHTML='<span class="spinner"></span>';
    const reps=loadReports();const r=reps.find(x=>x.id===id&&x.encargado===CFG.encargado);
    if(r){r.borrado=true;r.motivoBorrado=motivo;saveReports(reps);}
    const m=repMios.find(x=>x.id===id);if(m){m.borrado=true;m.motivoBorrado=motivo;}
    await sendAction({accion:'borrar',encargado:CFG.encargado,reporteId:id,motivo});
    close();toast('Caso eliminado');paintReports();
  };
}
async function fetchMine(){
  if(!CFG.sheetUrl||!CFG.encargado)return null;
  try{const res=await fetch(CFG.sheetUrl+'?encargado='+encodeURIComponent(CFG.encargado)+'&t='+Date.now());const d=await res.json();
    if(d&&d.ok&&Array.isArray(d.reportes))return d.reportes.reverse();return null;}catch(e){return null;}
}
async function fetchGeneral(){
  if(!CFG.sheetUrl)return null;
  try{const res=await fetch(CFG.sheetUrl+'?admin=1&t='+Date.now());const d=await res.json();
    if(d&&d.ok&&Array.isArray(d.reportes))return d.reportes.reverse();return null;}catch(e){return null;}
}
// acción sin necesidad de leer respuesta (borrar); usa CORS normal para consistencia
async function sendAction(payload){try{const res=await fetch(CFG.sheetUrl,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(payload)});return await res.json().catch(()=>({ok:true}));}catch(e){return {ok:false};}}

/* ============================================================ NUEVO CASO */
function startCase(emergencia){State.est=null;State.cat=emergencia?'EMERGENCIA':null;State.emergencia=!!emergencia;State.desc='';State.media=[];State.startedAt=new Date();$('#modeLabel').textContent=emergencia?'Emergencia':'Agregar caso';startGPS();renderEstablecimiento();}

function renderEstablecimiento(){
  showNav(true);$('#btnHome').classList.remove('hidden');$('#btnHome').onclick=renderHome;
  const chosen=!!State.est;
  content.innerHTML=`<div class="screen"><div style="flex:1;overflow-y:auto"><div class="card">
    <div class="eyebrow"><b>Agregar caso</b> <span class="grp">· Establecimiento</span></div>
    <h2 class="q">Indica el establecimiento</h2>
    <div id="searchZone">
      ${chosen?renderBubbles():renderSearchInputs()}
    </div>
    <div id="estData" class="${chosen?'':'hidden'}"><div class="readonly-grid" style="margin-top:4px">
      <div class="ro full"><span>Dirección</span><b id="dDir">${chosen?State.est[COL.DIR]:'—'}</b></div>
      <div class="ro"><span>Comuna</span><b id="dCom">${chosen?State.est[COL.COM]:'—'}</b></div>
      <div class="ro"><span>Institución</span><b id="dInst">${chosen?State.est[COL.INST]:'—'}</b></div>
      <div class="ro"><span>Supervisor</span><b id="dSup">${chosen?State.est[COL.SUP]:'—'}</b></div>
      <div class="ro tech"><span>Técnico manten.</span><b id="dTec">${chosen?State.est[COL.TEC]:'—'}</b></div>
    </div></div>
  </div></div></div>`;
  btnBack.onclick=renderHome;btnNext.className='btn accent';btnNext.textContent='Continuar';btnNext.disabled=!chosen;
  btnNext.onclick=()=>{ State.emergencia?renderDescripcion():renderCategoria(); };
  if(chosen)bindBubbles();else bindSearchInputs();
}
function renderSearchInputs(){
  return `<div class="field-block"><label class="fld">Establecimiento</label>
      <div class="search-wrap"><span class="ic-lead">🏫</span>
        <input type="text" id="qNom" placeholder="Ej: Estado de Palestina" autocomplete="off">
        <button class="clearbtn hidden" id="clrNom">✕</button><div class="suggest hidden" id="sgNom"></div></div></div>
    <div class="divider-or">O BIEN</div>
    <div class="field-block"><label class="fld">RBD</label>
      <div class="search-wrap"><span class="ic-lead">🔢</span>
        <input type="text" id="qRbd" inputmode="numeric" placeholder="Ej: 9880" autocomplete="off">
        <button class="clearbtn hidden" id="clrRbd">✕</button><div class="suggest hidden" id="sgRbd"></div></div></div>`;
}
function renderBubbles(){
  const e=State.est;
  return `<div class="bubble-row"><button class="bubble" id="bubble"><span class="b-ic">🏫</span><span class="b-txt">${e[COL.NOM]} · RBD ${e[COL.RBD]}</span><span class="b-edit">✎</span></button></div>`;
}
function bindBubbles(){
  const b=$('#bubble');if(b)b.onclick=()=>{State.est=null;renderEstablecimiento();};
}
function bindSearchInputs(){
  setupSearch('qRbd','sgRbd','clrRbd',COL.RBD,true);
  setupSearch('qNom','sgNom','clrNom',COL.NOM,false);
}
function setupSearch(inputId,sgId,clrId,col,isRbd){
  const inp=$('#'+inputId);if(!inp)return;const sg=$('#'+sgId),clr=$('#'+clrId);let hl=-1,cur=[];
  inp.addEventListener('input',()=>{const v=norm(inp.value.trim());clr.classList.toggle('hidden',!inp.value);
    if(!v){sg.classList.add('hidden');return;}
    cur=BBDD.filter(r=>norm(r[col]).includes(v)).slice(0,14);
    if(!cur.length){sg.classList.add('hidden');return;}
    sg.innerHTML=cur.map((r,i)=>`<div data-i="${i}"><div>${r[col]}<small>${isRbd?r[COL.NOM]:'RBD '+r[COL.RBD]} · ${r[COL.COM]}</small></div></div>`).join('');
    sg.classList.remove('hidden');hl=-1;$$('#'+sgId+' div[data-i]').forEach(d=>d.onclick=()=>pickEst(cur[+d.dataset.i]));});
  inp.addEventListener('keydown',e=>{const it=$$('#'+sgId+' div[data-i]');if(!it.length)return;if(e.key==='ArrowDown')hl=Math.min(hl+1,it.length-1);else if(e.key==='ArrowUp')hl=Math.max(hl-1,0);else if(e.key==='Enter'&&hl>=0){pickEst(cur[hl]);return;}else return;it.forEach((d,i)=>d.classList.toggle('hl',i===hl));e.preventDefault();});
  clr.onclick=()=>{inp.value='';clr.classList.add('hidden');sg.classList.add('hidden');};
}
function pickEst(r){
  State.est=r;
  // animación: reemplaza inputs por burbuja y muestra datos
  $('#searchZone').innerHTML=renderBubbles();bindBubbles();
  $('#dDir').textContent=r[COL.DIR]||'—';$('#dCom').textContent=r[COL.COM]||'—';$('#dInst').textContent=r[COL.INST]||'—';$('#dSup').textContent=r[COL.SUP]||'—';$('#dTec').textContent=r[COL.TEC]||'—';
  $('#estData').classList.remove('hidden');btnNext.disabled=false;
}

/* CATEGORÍA — tap directo = continuar (sin botón) */
const CATS=[
  ['Calor','🔥','Equipos, gas, filtración'],
  ['Electricidad','⚡','Enchufes, iluminación, observaciones'],
  ['Filtraciones','💧','Agua, cañería, humedad'],
  ['Infraestructura','🏗️','Mosquiteros, pisos, muros'],
  ['Frío','🧊','Equipos, temperatura, filtración'],
  ['Otro','🧰','Otro tipo de caso']
];
function renderCategoria(){
  showNav(true);
  content.innerHTML=`<div class="screen">
    <div class="eyebrow" style="margin:0 2px 8px;flex:0 0 auto"><b>Agregar caso</b> <span class="grp">· Categoría</span></div>
    <h2 class="q" style="margin:0 2px 14px;flex:0 0 auto">Selecciona el tipo de caso</h2>
    <div class="cat-grid">${CATS.map(([n,ic,sub])=>`<div class="cat" data-c="${n}"><div class="glow"></div><div class="cat-ic">${ic}</div><div><div class="cat-name">${n}</div><div class="cat-sub">${sub}</div></div></div>`).join('')}</div>
  </div>`;
  // solo Back en la barra; el tap en la categoría avanza
  btnBack.onclick=renderEstablecimiento;
  btnNext.classList.add('hidden');
  navwrap.querySelector('.inner').style.justifyContent='flex-start';
  $$('.cat').forEach(c=>c.onclick=()=>{State.cat=c.dataset.c;renderDescripcion();});
}

/* ============================================================ DESCRIPCIÓN + VERIFICADORES (subida en background) */
function renderDescripcion(){
  showNav(true);btnNext.classList.remove('hidden');
  navwrap.querySelector('.inner').style.justifyContent='';
  content.innerHTML=`<div class="screen"><div style="flex:1;overflow-y:auto"><div class="card">
    <div class="eyebrow"><b>Agregar caso</b> <span class="grp">· ${State.cat}</span></div>
    <h2 class="q">Describe la situación</h2>
    <div class="field-block"><label class="fld">Indique</label><textarea id="descTxt" placeholder="Describe el caso, la falla o el requerimiento...">${State.desc||''}</textarea></div>
    <div class="verifier"><div class="vtitle">Verificadores</div>
      <div class="vbtns">
        <button class="vbtn" data-cap="photo"><span class="ic">📷</span>Cámara foto</button>
        <button class="vbtn" data-cap="video"><span class="ic">🎥</span>Cámara video</button>
        <button class="vbtn" id="galBtn"><span class="ic">🖼️</span>Galería</button>
      </div>
      <div class="thumbs" id="thumbs"></div>
      <div id="upSummary"></div>
    </div>
  </div></div></div>`;
  btnBack.onclick=()=>{ State.emergencia?renderHome():renderCategoria(); };
  btnNext.className='btn finish';btnNext.textContent='Finalizar';
  const upd=()=>{State.desc=$('#descTxt').value;refreshFinish();};
  $('#descTxt').oninput=upd;
  renderThumbs();
  $$('[data-cap]').forEach(b=>b.onclick=()=>openCamera(b.dataset.cap));
  $('#galBtn').onclick=pickFromGallery;
  refreshFinish();
  btnNext.onclick=finishCase;
}
// Bloquea Finalizar hasta que descripción esté y NO haya subidas pendientes
function refreshFinish(){
  const hasDesc=(State.desc||'').trim().length>0;
  const uploading=State.media.some(m=>!m.cancelled&&m.upState==='uploading');
  if(btnNext){btnNext.disabled=!hasDesc||uploading;}
  renderUpBar();
}
function renderUpBar(){
  const box=$('#upSummary');if(!box)return;
  const active=State.media.filter(m=>!m.cancelled);
  const uploading=active.filter(m=>m.upState==='uploading');
  const done=active.filter(m=>m.upState==='done');
  const err=active.filter(m=>m.upState==='error');
  if(!active.length){box.innerHTML='';return;}
  const pct=active.length?Math.round(done.length/active.length*100):0;
  let cls=uploading.length?'':(err.length?'err':'ok');
  let st=uploading.length?`Subiendo ${done.length}/${active.length}…`:(err.length?`${err.length} con error`:`${done.length}/${active.length} listo`);
  box.innerHTML=`<div class="upglobal ${cls}"><div class="ut"><span>Verificadores</span><span class="st">${st}</span></div><div class="track"><i style="width:${pct}%"></i></div>${uploading.length?'<p class="note" style="margin-top:8px">Espera a que terminen de subir para finalizar.</p>':''}${err.length?'<p class="note" style="margin-top:8px;color:var(--red)">Algún archivo falló. Elimínalo y vuelve a intentar, o reintenta.</p>':''}</div>`;
}
function renderThumbs(){
  const box=$('#thumbs');if(!box)return;
  box.innerHTML=State.media.map((m,i)=>{
    let ov='';
    if(m.upState==='uploading')ov=`<div class="up"><div class="ring"></div></div>`;
    else if(m.upState==='done')ov=`<div class="up done"><span class="ok">✓</span></div>`;
    else if(m.upState==='error')ov=`<div class="up err"><span class="ok">!</span></div>`;
    return `<div class="thumb">${m.type==='video'?`<video src="${m.url}" muted></video>`:`<img src="${m.url}">`}<span class="badge">${m.type}</span><button class="del" data-del="${i}">✕</button>${ov}</div>`;
  }).join('');
  $$('#thumbs .del').forEach(b=>b.onclick=()=>removeMedia(+b.dataset.del));
}
function removeMedia(i){
  const m=State.media[i];if(!m)return;
  if(m.upState==='uploading'||m.upState==='done'){
    if(m.driveName&&!String(m.driveName).startsWith('error_')){ sendAction({accion:'borrarArchivo',encargado:CFG.encargado,fileName:m.driveName}); }
    m.cancelled=true;
  }
  State.media.splice(i,1);renderThumbs();refreshFinish();
}

/* ---------- CÁMARA (robusta) ---------- */
let camStream=null,camRec=null,camChunks=[],camTimer=null;
function stopCam(){ if(camTimer){clearInterval(camTimer);camTimer=null;} if(camStream){camStream.getTracks().forEach(t=>{try{t.stop();}catch(e){}});camStream=null;} }
async function openCamera(kind){
  // requiere contexto seguro (https) para getUserMedia
  const secure = window.isSecureContext || location.hostname==='localhost' || location.protocol==='file:';
  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){
    toast('Tu navegador no permite la cámara aquí. Usa "Galería".',3200); return;
  }
  if(!secure){
    toast('La cámara requiere HTTPS. Abre la app con https:// o usa "Galería".',3600); return;
  }
  const ov=document.createElement('div');ov.className='cam-bg';
  ov.innerHTML=`<button class="camclose">✕</button><video autoplay playsinline muted></video><div class="cambar"><div class="shoot ${kind==='photo'?'photo':''}"></div></div>`;
  overlays.appendChild(ov);const video=$('video',ov);
  const close=()=>{stopCam();ov.remove();};
  $('.camclose',ov).onclick=close;
  stopCam(); // por si quedó una sesión previa tomada
  try{
    camStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:kind==='video'});
    video.srcObject=camStream;
    await video.play().catch(()=>{});
  }catch(err){
    close();
    let msg='No se pudo abrir la cámara.';
    if(err&&err.name==='NotAllowedError')msg='Permiso de cámara denegado. Actívalo en el navegador o usa "Galería".';
    else if(err&&err.name==='NotFoundError')msg='No se encontró cámara. Usa "Galería".';
    else if(err&&err.name==='NotReadableError')msg='La cámara está ocupada por otra app. Ciérrala y reintenta, o usa "Galería".';
    toast(msg,3800); return;
  }
  const shoot=$('.shoot',ov);
  if(kind==='photo'){
    shoot.onclick=()=>{const c=document.createElement('canvas');c.width=video.videoWidth||1280;c.height=video.videoHeight||720;c.getContext('2d').drawImage(video,0,0,c.width,c.height);
      c.toBlob(b=>{addMedia({type:'photo',blob:b,url:URL.createObjectURL(b)});close();},'image/jpeg',.82);};
  } else {
    let rec=false;
    shoot.onclick=()=>{
      if(!rec){camChunks=[];
        try{camRec=new MediaRecorder(camStream);}catch(e){toast('No se pudo grabar video en este navegador. Usa "Galería".',3200);close();return;}
        camRec.ondataavailable=e=>{if(e.data&&e.data.size)camChunks.push(e.data);};
        camRec.onstop=()=>{const b=new Blob(camChunks,{type:'video/webm'});addMedia({type:'video',blob:b,url:URL.createObjectURL(b)});close();};
        camRec.start();rec=true;shoot.style.background='#fff';
        const r=document.createElement('div');r.className='rec';r.textContent='● REC 15s';ov.appendChild(r);let t=15;
        camTimer=setInterval(()=>{t--;r.textContent='● REC '+t+'s';if(t<=0){clearInterval(camTimer);camTimer=null;if(camRec&&camRec.state!=='inactive')camRec.stop();}},1000);
      } else { if(camTimer){clearInterval(camTimer);camTimer=null;} if(camRec&&camRec.state!=='inactive')camRec.stop(); }
    };
  }
}

/* ---------- GALERÍA (fotos/videos guardados) ---------- */
function pickFromGallery(){
  const inp=document.createElement('input');
  inp.type='file';inp.accept='image/*,video/*';inp.multiple=true;
  inp.onchange=async()=>{
    for(const file of inp.files){
      const isVideo=file.type.startsWith('video');
      if(isVideo){
        const dur=await videoDuration(file).catch(()=>0);
        if(dur>VIDEO_MAX){
          toast('El video dura '+Math.round(dur)+'s (máx '+VIDEO_MAX+'s). Puedes recortarlo.',3200);
          openTrimmer(file);   // ofrece recorte tipo Movie Maker
          continue;
        }
        addMedia({type:'video',blob:file,url:URL.createObjectURL(file)});
      } else {
        addMedia({type:'photo',blob:file,url:URL.createObjectURL(file)});
      }
    }
  };
  inp.click();
}
const VIDEO_MAX=15;
function videoDuration(fileOrBlob){return new Promise((res,rej)=>{const v=document.createElement('video');v.preload='metadata';v.onloadedmetadata=()=>{res(v.duration);URL.revokeObjectURL(v.src);};v.onerror=rej;v.src=URL.createObjectURL(fileOrBlob);});}

/* ---------- RECORTE DE VIDEO (tipo Movie Maker) ---------- */
async function openTrimmer(file){
  const url=URL.createObjectURL(file);
  const total=await videoDuration(file).catch(()=>0);
  if(!total){toast('No se pudo leer el video.');return;}
  let a=0,b=Math.min(VIDEO_MAX,total);
  const ov=document.createElement('div');ov.className='trim-bg';
  ov.innerHTML=`<div class="trim-top"><b>Recortar video</b><button class="tx">✕</button></div>
    <div class="trim-video"><video id="tv" src="${url}" playsinline></video></div>
    <div class="trim-ctrl">
      <div class="trim-info">Selección: <b id="tsel">0.0s – ${b.toFixed(1)}s</b> · máx ${VIDEO_MAX}s</div>
      <div class="trim-track" id="ttrack"><div class="trim-sel" id="tselbar"></div><div class="trim-handle start" id="th0">‹</div><div class="trim-handle end" id="th1">›</div></div>
      <div class="trim-btns"><button class="btn ghost" id="tprev" style="flex:1">▶ Previsualizar</button><button class="btn finish" id="tok" style="flex:1">Usar recorte</button></div>
    </div>`;
  overlays.appendChild(ov);
  const v=$('#tv',ov),track=$('#ttrack',ov),selbar=$('#tselbar',ov),h0=$('#th0',ov),h1=$('#th1',ov),sel=$('#tsel',ov);
  const W=()=>track.clientWidth;
  const draw=()=>{const w=W();const x0=a/total*w,x1=b/total*w;selbar.style.left=x0+'px';selbar.style.width=(x1-x0)+'px';h0.style.left=(x0-11)+'px';h1.style.left=(x1-11)+'px';sel.textContent=`${a.toFixed(1)}s – ${b.toFixed(1)}s`;};
  setTimeout(draw,60);
  const clamp=(val)=>Math.max(0,Math.min(total,val));
  const drag=(handle,isStart)=>{
    const move=(clientX)=>{const rect=track.getBoundingClientRect();let t=clamp((clientX-rect.left)/W()*total);
      if(isStart){a=Math.min(t,b-0.3);if(b-a>VIDEO_MAX)b=a+VIDEO_MAX;}else{b=Math.max(t,a+0.3);if(b-a>VIDEO_MAX)a=b-VIDEO_MAX;}
      a=clamp(a);b=clamp(b);draw();if(v){v.currentTime=isStart?a:b;}};
    const mm=e=>{move(e.touches?e.touches[0].clientX:e.clientX);e.preventDefault();};
    const up=()=>{document.removeEventListener('mousemove',mm);document.removeEventListener('touchmove',mm);document.removeEventListener('mouseup',up);document.removeEventListener('touchend',up);};
    handle.addEventListener('mousedown',e=>{document.addEventListener('mousemove',mm);document.addEventListener('mouseup',up);e.preventDefault();});
    handle.addEventListener('touchstart',e=>{document.addEventListener('touchmove',mm,{passive:false});document.addEventListener('touchend',up);e.preventDefault();},{passive:false});
  };
  drag(h0,true);drag(h1,false);
  const close=()=>{URL.revokeObjectURL(url);ov.remove();};
  $('.tx',ov).onclick=close;
  $('#tprev',ov).onclick=()=>{v.currentTime=a;v.play();const stop=()=>{if(v.currentTime>=b){v.pause();v.removeEventListener('timeupdate',stop);}};v.addEventListener('timeupdate',stop);};
  $('#tok',ov).onclick=async()=>{
    $('#tok',ov).innerHTML='<span class="spinner"></span>';
    try{
      const clip=await trimVideo(file,a,b);
      addMedia({type:'video',blob:clip,url:URL.createObjectURL(clip)});
      close();
    }catch(e){toast('No se pudo recortar en este equipo. Intenta grabar un video corto.',3600);close();}
  };
}
// Recorta reproduciendo el segmento y grabándolo con MediaRecorder desde un canvas + audio
async function trimVideo(file,start,end){
  return new Promise(async (resolve,reject)=>{
    try{
      const url=URL.createObjectURL(file);
      const v=document.createElement('video');v.src=url;v.muted=false;v.playsInline=true;
      await new Promise((r,j)=>{v.onloadedmetadata=r;v.onerror=j;});
      const canvas=document.createElement('canvas');canvas.width=v.videoWidth||640;canvas.height=v.videoHeight||480;
      const ctx=canvas.getContext('2d');
      const cstream=canvas.captureStream(25);
      const rec=new MediaRecorder(cstream,{mimeType:'video/webm'});
      const chunks=[];rec.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
      rec.onstop=()=>{URL.revokeObjectURL(url);resolve(new Blob(chunks,{type:'video/webm'}));};
      v.currentTime=start;
      await new Promise(r=>{v.onseeked=r;});
      rec.start();v.play();
      const draw=()=>{if(v.currentTime>=end||v.ended){rec.stop();v.pause();return;}ctx.drawImage(v,0,0,canvas.width,canvas.height);requestAnimationFrame(draw);};
      draw();
    }catch(e){reject(e);}
  });
}

function addMedia(m){
  m.upState='uploading';m.driveName=null;m.cancelled=false;
  State.media.push(m);renderThumbs();refreshFinish();
  uploadOne(m);
}
async function uploadOne(m){
  const rbd=State.est?State.est[COL.RBD]:'SN';
  const base=(m.type==='video'?'video':'foto')+'_'+rbd+'_'+stamp()+'_'+Math.random().toString(36).slice(2,6);
  m.driveName=base+(m.type==='video'?'.webm':'.jpg');
  try{
    const b64=await blobToB64(m.blob);
    if(m.cancelled){return;}
    // CORS real: leemos la respuesta para CONFIRMAR que subió
    const resp=await postJSON({accion:'subirArchivo',encargado:CFG.encargado,fileName:m.driveName,mime:m.type==='video'?'video/webm':'image/jpeg',data:b64,tipo:m.type});
    if(m.cancelled){ sendAction({accion:'borrarArchivo',encargado:CFG.encargado,fileName:m.driveName}); return; }
    if(resp&&resp.ok){ m.upState='done'; m.driveUrl=resp.url||''; }
    else { m.upState='error'; }
  }catch(e){ m.upState='error'; }
  renderThumbs();refreshFinish();
}
function blobToB64(blob){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result.split(',')[1]);r.onerror=rej;r.readAsDataURL(blob);});}
// POST que SÍ lee la respuesta (CORS). Apps Script devuelve JSON con cabeceras permisivas.
async function postJSON(payload){
  const res=await fetch(CFG.sheetUrl,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(payload)});
  return await res.json();
}

/* ============================================================ FINALIZAR */
async function finishCase(){
  // Bloqueo real: no cerrar si hay subidas pendientes o con error
  const active=State.media.filter(m=>!m.cancelled);
  if(active.some(m=>m.upState==='uploading')){ toast('Espera a que terminen de subir los verificadores.',2600); return; }
  if(active.some(m=>m.upState==='error')){ toast('Hay verificadores con error. Elimínalos o reintenta antes de finalizar.',3200); return; }
  btnNext.disabled=true;btnNext.innerHTML='<span class="spinner"></span> Finalizando...';
  if(!State.gps){try{State.gps=await new Promise(r=>{if(!navigator.geolocation){r(null);return;}navigator.geolocation.getCurrentPosition(p=>r({lat:p.coords.latitude,lon:p.coords.longitude,acc:p.coords.accuracy}),()=>r(null),{timeout:6000});});}catch{State.gps=null;}}
  const now=new Date();const est=State.est;const rbd=est[COL.RBD];const id=nextReportId();
  const verificadores=active.filter(m=>m.upState==='done').map(m=>(m.type==='video'?'video':'foto')+': '+m.driveName);
  const payload={accion:'caso',encargado:CFG.encargado,reporteId:id,fecha:now.toLocaleString('es-CL'),timestamp:now.toISOString(),
    rbd,establecimiento:est[COL.NOM],direccion:est[COL.DIR],comuna:est[COL.COM],supervisor:est[COL.SUP],institucion:est[COL.INST],tecnico:est[COL.TEC],
    categoria:State.cat,descripcion:State.desc,gps:State.gps?`${State.gps.lat.toFixed(6)}, ${State.gps.lon.toFixed(6)}`:'',gps_acc:State.gps?Math.round(State.gps.acc):'',
    verificadores:verificadores.join('\n')};
  const reps=loadReports();
  reps.push({id,encargado:CFG.encargado,rbd,nom:est[COL.NOM],cat:State.cat,desc:State.desc,fecha:payload.fecha,ts:Date.now(),enviado:false,visado:'',derivadoA:'',media:active.filter(m=>m.upState==='done').map(m=>({type:m.type,name:m.driveName,url:m.driveUrl||''}))});
  saveReports(reps);
  let ok=false;
  try{ const r=await postJSON(payload); ok=!!(r&&r.ok); }catch(e){ ok=false; }
  if(ok){const rr=loadReports();const f=rr.find(x=>x.id===id&&x.encargado===CFG.encargado);if(f)f.enviado=true;saveReports(rr);}
  stopGPS();renderDone(id,ok);
}
function renderDone(id,ok){
  showNav(false);$('#btnHome').classList.add('hidden');$('#gpsChip').classList.add('hidden');
  content.innerHTML=`<div class="screen"><div style="flex:1;display:flex;flex-direction:column;justify-content:center">
    <div class="hero"><div class="mark">${LOGO_SVG}</div><h1>Caso registrado</h1><p>Reporte <b>${id}</b></p></div>
    <div class="card" style="text-align:center;margin-top:10px">
      <p>${ok?'El caso fue enviado al Sheet de <b>'+CFG.encargado+'</b>.':'Quedó guardado como <b>pendiente</b> en Reportes generados; podrás reintentar.'}</p>
      <p class="note">${State.est[COL.NOM]} (RBD ${State.est[COL.RBD]})</p>
      <div style="display:flex;flex-direction:column;gap:10px;margin-top:16px">
        <button class="btn accent" id="again">Agregar otro caso</button>
        <button class="btn ghost" id="toHome" style="width:100%">Volver al inicio</button>
      </div>
    </div></div></div>`;
  $('#again').onclick=()=>startCase(false);$('#toHome').onclick=renderHome;
}

/* ARRANQUE */
renderHome();
