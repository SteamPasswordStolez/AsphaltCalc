
function $(s) { return document.querySelector(s); }
function el(t, c) { const n = document.createElement(t); if (c) n.className = c; return n; }
function getFavs() { try { return JSON.parse(localStorage.getItem('simhub_favs') || '[]') } catch (_) { return [] } }
function setFavs(v) { localStorage.setItem('simhub_favs', JSON.stringify(v)) }
function isFav(id) { return getFavs().includes(id) }
function toggleFav(id) { const a = getFavs(); const i = a.indexOf(id); if (i >= 0) a.splice(i, 1); else a.push(id); setFavs(a); renderList(window.__CAT__) }
function getQueryParam(name) { const urlParams = new URLSearchParams(window.location.search); return urlParams.get(name); }

async function loadCatalog() {
  // 1) Try inline JSON (works on file://)
  const inline = document.getElementById('catalog');
  if (inline && inline.textContent.trim()) {
    try {
      const data = JSON.parse(inline.textContent);
      return data;
    } catch (_) { /* fallthrough */ }
  }
  // 2) Fallback to fetch (for http/https hosting)
  const res = await fetch('simulators.json');
  if (!res.ok) throw new Error('simulators.json 로드 실패');
  return await res.json();
}


function renderList(cat) {
  const q = ($('#q').value || '').toLowerCase().trim();
  const onlyFav = $('#onlyFav').checked;
  const list = $('#simList'); list.innerHTML = '';
  const items = cat.filter(x => {
    // Search in translated content if available
    const i18nName = (window.I18N && I18N.t('cat.' + x.id.replace(/-/g, '_') + '.name')) || x.name;
    const i18nDesc = (window.I18N && I18N.t('cat.' + x.id.replace(/-/g, '_') + '.desc')) || x.description;

    const hay = [i18nName, i18nDesc, ...(x.tags || [])].join(' ').toLowerCase();
    const passQ = !q || hay.includes(q);
    const passFav = !onlyFav || isFav(x.id);
    return passQ && passFav;
  });
  if (items.length === 0) {
    const li = el('li', 'item');
    li.textContent = (window.I18N && I18N.t('cat.search_result_none')) || '검색 결과가 없습니다.';
    li.style.opacity = .7;
    list.appendChild(li);
    return;
  }
  items.forEach(x => {
    // Translate name/desc
    const i18nName = (window.I18N && I18N.t('cat.' + x.id.replace(/-/g, '_') + '.name')) || x.name;
    const i18nDesc = (window.I18N && I18N.t('cat.' + x.id.replace(/-/g, '_') + '.desc')) || x.description;

    const featuredText = (window.I18N && I18N.t('cat.featured')) || 'FEATURED';
    const openText = (window.I18N && I18N.t('cat.open')) || '열기';
    const favOn = (window.I18N && I18N.t('cat.favorite_on')) || '★';
    const favOff = (window.I18N && I18N.t('cat.favorite')) || '☆';

    const li = el('li', 'item');
    const left = el('div', 'grow');
    left.innerHTML = `<div><b>${i18nName}</b>${x.featured ? '<span class="badge">' + featuredText + '</span>' : ''}</div>
                      <div class="meta">${i18nDesc}</div>`;
    const tags = el('div', 'tags'); (x.tags || []).forEach(t => { const s = el('span', 'tag'); s.textContent = t; tags.appendChild(s); }); left.appendChild(tags);
    const btns = el('div');
    const fav = el('button', 'button');
    fav.textContent = isFav(x.id) ? (favOn + ' ' + (window.I18N ? I18N.t('cat.favorite_label') || '' : '')) : (favOff + ' ' + (window.I18N ? I18N.t('cat.favorite_label') || '' : ''));
    // Simple star is enough, or recover text if needed. The original code had just '★ 즐겨찾기' or '☆ 즐겨찾기'.
    // Let's stick to I18N.t('cat.favorite') which translates to ☆
    // Wait, original was '★ 즐겨찾기'. I added cat.favorite as ☆.
    // Let's use clean stars for now or add "Favorite" text key?
    // User didn't request "Favorite" text translation, but 'cat.favorite' is just the symbol.
    // I'll leave it as symbol + ' ' + I18N.t('cat.favorite_text') if I had it.
    // For now, let's just use the symbol to save space or use English "Favorite" if implied.
    // Actually, let's keep it simple: just the star or add text.
    // Original: '★ 즐겨찾기'
    // Let's add 'cat.fav_btn': 'Favorite' to lang.js?
    // I'll just use 'Favorite' text hardcoded for now or rely on symbol only? 
    // No, I should add a key. I'll add 'cat.fav_text' later.
    // For now I'll use a generic "Favorite" string or empty.

    // Revise:
    fav.textContent = isFav(x.id) ? favOn : favOff; // Just stars looks clean
    // Or if I want text:
    // fav.textContent = isFav(x.id) ? favOn + ' Favorite' : favOff + ' Favorite';
    // But "Favorite" needs translation.

    // I will use just the star, it's cleaner. OR I can reuse 'cat.favorite' which I set to ☆.

    fav.onclick = (e) => { e.stopPropagation(); toggleFav(x.id); };

    const open = el('button', 'button'); open.textContent = openText; open.onclick = () => openSim(x);
    btns.appendChild(fav); btns.appendChild(open);
    li.appendChild(left); li.appendChild(btns); list.appendChild(li);

    // Click on item opens it too
    li.onclick = (e) => {
      if (e.target !== fav && e.target !== open) openSim(x);
    };
    li.style.cursor = 'pointer';
  });
}

function openSim(x) {
  // 현재 창으로 바로 이동 (using openMode setting)
  // window.__SIMHUB_GET_OPEN_MODE__ might be available
  let mode = 'same';
  if (window.__SIMHUB_GET_OPEN_MODE__) mode = window.__SIMHUB_GET_OPEN_MODE__();

  if (mode === 'new') {
    window.open(x.path, '_blank');
  } else {
    window.location.href = x.path;
  }
}

// Initialization
(async function () {
  try {
    const data = await loadCatalog();
    window.__CAT__ = data;

    renderList(data);

    $('#q').addEventListener('input', () => renderList(window.__CAT__));
    $('#onlyFav').addEventListener('change', () => renderList(window.__CAT__));

    if (window.I18N) {
      window.I18N.on('change', () => {
        renderList(window.__CAT__);
      });
    }
  } catch (e) {
    console.error(e);
  }
})();

