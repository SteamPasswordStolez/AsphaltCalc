
function $(s){ return document.querySelector(s); }
function el(t,c){ const n=document.createElement(t); if(c) n.className=c; return n; }
function getFavs(){ try{return JSON.parse(localStorage.getItem('simhub_favs')||'[]')}catch(_){return[]} }
function setFavs(v){ localStorage.setItem('simhub_favs', JSON.stringify(v)) }
function isFav(id){ return getFavs().includes(id) }
function toggleFav(id){ const a=getFavs(); const i=a.indexOf(id); if(i>=0) a.splice(i,1); else a.push(id); setFavs(a); renderList(window.__CAT__) }

async function loadCatalog(){
  // 1) Try inline JSON (works on file://)
  const inline = document.getElementById('catalog');
  if(inline && inline.textContent.trim()){
    try{
      const data = JSON.parse(inline.textContent);
      return data;
    }catch(_){ /* fallthrough */ }
  }
  // 2) Fallback to fetch (for http/https hosting)
  const res = await fetch('simulators.json');
  if(!res.ok) throw new Error('simulators.json 로드 실패');
  return await res.json();
}

function renderList(cat){
  const q = ($('#q').value||'').toLowerCase().trim();
  const onlyFav = $('#onlyFav').checked;
  const list = $('#simList'); list.innerHTML='';
  const items = cat.filter(x=>{
    const hay = [x.name, x.description, ...(x.tags||[])].join(' ').toLowerCase();
    const passQ = !q || hay.includes(q);
    const passFav = !onlyFav || isFav(x.id);
    return passQ && passFav;
  });
  if(items.length===0){
    const li=el('li','item'); li.textContent='검색 결과가 없습니다.'; li.style.opacity=.7; list.appendChild(li);
    $('#openNew').disabled = true; $('#viewer').src='';
    return;
  }
  items.forEach(x=>{
    const li=el('li','item');
    const left=el('div','grow');
    left.innerHTML = `<div><b>${x.name}</b>${x.featured?'<span class="badge">FEATURED</span>':''}</div>
                      <div class="meta">${x.description}</div>`;
    const tags=el('div','tags'); (x.tags||[]).forEach(t=>{ const s=el('span','tag'); s.textContent=t; tags.appendChild(s); }); left.appendChild(tags);
    const btns=el('div');
    const fav=el('button','button'); fav.textContent = isFav(x.id)?'★ 즐겨찾기':'☆ 즐겨찾기'; fav.onclick=()=>toggleFav(x.id);
    const open=el('button','button'); open.textContent='열기'; open.onclick=()=>openSim(x);
    btns.appendChild(fav); btns.appendChild(open);
    li.appendChild(left); li.appendChild(btns); list.appendChild(li);
  });
}

function openSim(x){
  // 현재 창으로 바로 이동
  window.location.href = x.path;
  return;

  const ifr = $('#viewer'); ifr.src = x.path;
  
  
  sessionStorage.setItem('simhub_last', JSON.stringify(x));
}

