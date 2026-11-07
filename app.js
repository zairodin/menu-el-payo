/* ========== Desayunos El Payo · menú digital ==========
   Lee el menú de una hoja de Google (o de menu-respaldo.js), arma pedidos
   personalizados y los manda por WhatsApp. No hace falta editar este archivo. */
(() => {
  'use strict';

  const CFG = window.PAYO_CONFIG || {};
  const RESPALDO = window.PAYO_RESPALDO || { platillos: [], ajustes: [] };
  const TABS = Object.assign({ platillos: 'Platillos', ajustes: 'Ajustes', opiniones: 'Opiniones' }, CFG.pestanas);
  const NUMERO_RESPALDO = '5537876816';

  // ---------- utilidades ----------
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  const esSi = (v) => /^(si|s|x|yes|1|true|verdadero)$/.test(norm(v));
  const money = (n) => '$' + n.toLocaleString('es-MX', { maximumFractionDigits: 2 });
  const store = {
    get(k, d) { try { const v = localStorage.getItem('payo:' + k); return v ? JSON.parse(v) : d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem('payo:' + k, JSON.stringify(v)); } catch { /* sin almacenamiento */ } },
  };
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
  }

  // ---------- lectura de la hoja de Google ----------
  function parseCSV(text) {
    const rows = [];
    let row = [], f = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) {
        if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c;
      } else if (c === '"') q = true;
      else if (c === ',') { row.push(f); f = ''; }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++;
        row.push(f); rows.push(row); row = []; f = '';
      } else f += c;
    }
    if (f !== '' || row.length) { row.push(f); rows.push(row); }
    return rows;
  }

  function aObjetos(rows) {
    const [head, ...rest] = rows;
    if (!head) return [];
    return rest
      .filter((r) => r.some((c) => c.trim()))
      .map((r) => Object.fromEntries(head.map((h, i) => [h.trim(), r[i] ?? ''])));
  }

  async function leerPestana(nombre) {
    const url = `https://docs.google.com/spreadsheets/d/${encodeURIComponent(CFG.hojaDeGoogle.trim())}/gviz/tq?tqx=out:csv&headers=1&sheet=${encodeURIComponent(nombre)}`;
    const r = await fetch(url, { cache: 'no-store' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const t = await r.text();
    if (/^\s*</.test(t)) throw new Error('La hoja no es pública');
    return aObjetos(parseCSV(t));
  }

  // Busca una columna aunque Payo le cambie un poco el nombre (acentos, mayúsculas, paréntesis).
  function campo(obj, claves, modo = 'prefijo') {
    const keys = Object.keys(obj).map((k) => [k, norm(k)]);
    for (const c of claves) { const hit = keys.find(([, n]) => n === c); if (hit) return String(obj[hit[0]] ?? '').trim(); }
    for (const c of claves) {
      const hit = keys.find(([, n]) => (modo === 'contiene' ? n.includes(c) : n.startsWith(c)));
      if (hit) return String(obj[hit[0]] ?? '').trim();
    }
    return '';
  }

  // ---------- modelo de datos ----------
  const lista = (s) => String(s || '').split(/\s*[,;\n]\s*/).map((x) => x.trim()).filter(Boolean);
  const precioDe = (s) => { const m = String(s || '').replace(/,/g, '').match(/\d+(\.\d+)?/); return m ? parseFloat(m[0]) : null; };

  function opcion(s) {
    const m = s.match(/^(.*?)[\s(:-]*\+?\s*\$\s*(\d+(?:\.\d+)?)\s*\)?$/);
    return m && m[1] ? { nombre: m[1].trim(), precio: parseFloat(m[2]) } : { nombre: s, precio: 0 };
  }

  function fotoUrl(s) {
    s = s.trim();
    if (/drive\.google\.com/.test(s)) {
      const m = s.match(/\/d\/([\w-]{15,})/) || s.match(/[?&]id=([\w-]{15,})/);
      if (m) return `https://drive.google.com/thumbnail?id=${m[1]}&sz=w1200`;
    }
    if (/^(https?:)?\/\//.test(s) || s.startsWith('data:')) return s;
    return s.includes('/') ? s : 'fotos/' + s;
  }

  const EMOJIS = [
    [/chilaquil/, '🌶️'], [/torta|sandw|cuern|baguet/, '🥪'], [/ensalad/, '🥗'],
    [/dulce|hot_?cake|franc|postre|ligero|waffle/, '🥞'], [/cereal|yogur|fruta|avena/, '🥣'],
    [/bebid|cafe|jugo|licuad|agua|refresc/, '☕'], [/tamal/, '🫔'], [/huevo/, '🍳'],
    [/antojit|especial|taco|mollete|sincron|quesad|enchil/, '🌮'], [/combo|paquete|promo/, '🎁'],
  ];
  const ACENTOS = ['#e3262e', '#ffc83d', '#5a3ea6', '#1faf5a', '#ff7a1a', '#2b8be6', '#e0457b'];
  const emojiDe = (txt) => (EMOJIS.find(([re]) => re.test(norm(txt))) || [, '🍽️'])[1];

  function armarMenu(filas) {
    const categorias = [];
    const platillos = [];
    filas.forEach((f, i) => {
      const nombre = campo(f, ['platillo', 'nombre']);
      if (!nombre) return;
      const disp = norm(campo(f, ['disponible']));
      if (disp.startsWith('ocult')) return;
      const catNombre = campo(f, ['categoria']) || 'Menú';
      let cat = categorias.find((c) => c.nombre === catNombre);
      if (!cat) {
        cat = { id: 'cat-' + (norm(catNombre) || categorias.length), nombre: catNombre, emoji: emojiDe(catNombre), color: ACENTOS[categorias.length % ACENTOS.length], platillos: [] };
        categorias.push(cat);
      }
      const grupos = [];
      const o1 = lista(campo(f, ['opciones'])).map(opcion);
      if (o1.length) {
        const max = Math.max(1, Math.min(parseInt(campo(f, ['cuantas', 'cuantos', 'elegir']), 10) || 1, o1.length));
        grupos.push({ id: 'g1', titulo: campo(f, ['titulo_opciones']) || 'Elige', opciones: o1, max, min: 1 });
      }
      const o2 = lista(campo(f, ['opciones_2'])).map(opcion);
      if (o2.length) grupos.push({ id: 'g2', titulo: campo(f, ['titulo_opciones_2']) || 'Elige', opciones: o2, max: 1, min: 1 });
      const ex = lista(campo(f, ['extras', 'extra'])).map(opcion);
      if (ex.length) grupos.push({ id: 'ex', titulo: 'Extras', opciones: ex, max: ex.length, min: 0 });

      const p = {
        id: norm(catNombre + '-' + nombre) + '-' + i,
        nombre, cat,
        descripcion: campo(f, ['descripcion']),
        precio: precioDe(campo(f, ['precio'])),
        fotos: lista(campo(f, ['fotos', 'foto'])).map(fotoUrl),
        grupos,
        agotado: disp === 'no' || disp.startsWith('agotad'),
        destacado: esSi(campo(f, ['destacado'])),
      };
      cat.platillos.push(p);
      platillos.push(p);
    });
    return { categorias, platillos };
  }

  function armarAjustes(filas) {
    const a = filas.map((f) => ({ k: norm(campo(f, ['ajuste', 'dato', 'campo'])), v: campo(f, ['valor']) })).filter((x) => x.k);
    return (...claves) => (a.find((x) => claves.some((c) => x.k.includes(c))) || {}).v || '';
  }

  // ---------- estado ----------
  let MENU = { categorias: [], platillos: [] };
  let AJ = armarAjustes(RESPALDO.ajustes);
  let carrito = store.get('carrito', []);

  const waNumero = () => { let d = (AJ('whatsapp', 'telefono') || NUMERO_RESPALDO).replace(/\D/g, ''); if (d.length === 10) d = '52' + d; return d; };
  const waLink = (texto) => `https://wa.me/${waNumero()}?text=${encodeURIComponent(texto)}`;
  const nombreNegocio = () => AJ('nombre') || 'Desayunos "El Payo"';
  const conComillas = (s) => s.replace(/"([^"]*)"/g, '“$1”');
  const hayEntregas = () => { const v = AJ('entrega'); return !v || esSi(v); };

  // ---------- imágenes ----------
  const imgTag = (src, alt, emoji, carga = 'lazy') =>
    `<img src="${esc(src)}" alt="${esc(alt)}" loading="${carga}" decoding="async" data-emoji="${emoji}">`;
  const relleno = (emoji, cls = '') => `<div class="ph ${cls}">${emoji}</div>`;
  const fotoO = (p, i = 0, cls = '') => (p.fotos[i] ? imgTag(p.fotos[i], p.nombre, p.cat.emoji) : relleno(p.cat.emoji, cls));

  document.addEventListener('error', (e) => {
    const t = e.target;
    if (!(t instanceof HTMLImageElement)) return;
    const drive = t.src.match(/drive\.google\.com\/thumbnail\?id=([\w-]+)/);
    if (drive && !t.dataset.retry) { t.dataset.retry = 1; t.src = `https://lh3.googleusercontent.com/d/${drive[1]}=w1200`; return; }
    const g = t.closest('.g-item');
    if (g) { g.remove(); return; }
    if (t.classList.contains('slide-bg')) { t.remove(); return; }
    const ph = document.createElement('div');
    ph.className = 'ph';
    ph.textContent = t.dataset.emoji || '🍽️';
    t.replaceWith(ph);
  }, true);

  // ---------- pintar la página ----------
  function precioHTML(p) {
    return p.precio != null ? `<span class="price">${money(p.precio)}</span>` : '<span class="price-q">A tu gusto</span>';
  }

  function chipsResumen(p) {
    const g = p.grupos[0];
    if (!g) return '';
    const vis = g.opciones.slice(0, 4).map((o) => `<span class="mini-chip">${esc(o.nombre)}</span>`).join('');
    const mas = g.opciones.length > 4 ? `<span class="mini-chip">+${g.opciones.length - 4}</span>` : '';
    return `<div class="mini-chips">${vis}${mas}</div>`;
  }

  function tarjeta(p, grande) {
    return `
      <button type="button" class="dish reveal ${grande ? 'dish-big' : ''} ${p.agotado ? 'agotado' : ''}" data-id="${p.id}" style="--accent:${p.cat.color}"
        data-buscar="${esc(norm([p.nombre, p.descripcion, p.cat.nombre, ...p.grupos.flatMap((g) => g.opciones.map((o) => o.nombre))].join(' ')))}">
        <div class="dish-photo">
          ${fotoO(p, 0, grande ? 'ph-lg' : '')}
          ${p.fotos.length > 1 ? `<span class="photo-count">📷 ${p.fotos.length}</span>` : ''}
          ${p.agotado ? '<span class="badge-agotado">Hoy no hay</span>' : ''}
        </div>
        <div class="dish-body">
          <h4 class="dish-name">${esc(p.nombre)}</h4>
          ${p.descripcion ? `<p class="dish-desc">${esc(p.descripcion)}</p>` : ''}
          ${chipsResumen(p)}
          <div class="dish-foot">${precioHTML(p)}<span class="add-pill" aria-hidden="true">+</span></div>
        </div>
      </button>`;
  }

  function pintarMenu() {
    const { categorias, platillos } = MENU;

    // portada
    const [primera, ...resto] = conComillas(nombreNegocio()).split(/\s+/);
    if (resto.length) { $('.hero-kicker').textContent = primera; $('#nombre-negocio').textContent = resto.join(' '); }
    else { $('.hero-kicker').textContent = ''; $('#nombre-negocio').textContent = primera; }
    $('#frase').textContent = AJ('frase', 'eslogan') || 'Hecho al momento y a tu gusto';
    $('#footer-nombre').textContent = conComillas(nombreNegocio());
    document.title = nombreNegocio().replace(/"/g, '') + ' · Menú';

    const conFoto = platillos.filter((p) => p.fotos.length);
    const portada = [...conFoto.filter((p) => p.destacado), ...conFoto.filter((p) => !p.destacado)].slice(0, 3);
    $('#hero-fotos').innerHTML = portada.map((p) => `<div class="polaroid">${imgTag(p.fotos[0], p.nombre, p.cat.emoji, 'eager')}<span>${esc(p.nombre)}</span></div>`).join('');

    const nombres = platillos.filter((p) => !p.agotado).map((p) => `<span>${esc(p.nombre)}</span>`).join('');
    $('#marquee').innerHTML = nombres + nombres;

    const aviso = AJ('aviso');
    $('#aviso').hidden = !aviso;
    $('#aviso').textContent = aviso;

    // categorías
    $('#cats-lista').innerHTML = categorias.map((c) => `<a href="#${c.id}" class="cat-chip" data-cat="${c.id}">${c.emoji} ${esc(c.nombre)}</a>`).join('');

    // favoritos
    const favs = platillos.filter((p) => p.destacado && !p.agotado);
    $('#favoritos').hidden = !favs.length;
    $('#favs-lista').innerHTML = favs.map((p) => `
      <button type="button" class="fav" data-id="${p.id}" style="--accent:${p.cat.color}">
        ${fotoO(p, 0, 'ph-lg')}
        <span class="sticker">⭐ Favorito</span>
        <span class="fav-info"><span class="fav-name">${esc(p.nombre)}</span><span class="fav-cta">${p.precio != null ? money(p.precio) + ' · ' : ''}Ármalo a tu gusto →</span></span>
      </button>`).join('');

    // secciones del menú
    $('#menu').innerHTML = categorias.map((c) => `
      <section class="cat" id="${c.id}" style="--accent:${c.color}">
        <div class="cat-head">
          <span class="cat-emoji" aria-hidden="true">${c.emoji}</span>
          <div><h3 class="cat-name">${esc(c.nombre)}</h3><p class="cat-count">${c.platillos.length} ${c.platillos.length === 1 ? 'opción' : 'opciones'}</p></div>
        </div>
        <div class="dishes">${c.platillos.map((p, i) => tarjeta(p, i === 0 && c.platillos.length > 1)).join('')}</div>
      </section>`).join('');

    // galería: se alternan platillos para que no salgan seguidas las del mismo
    const fotos = [];
    const maxF = Math.max(0, ...platillos.map((p) => p.fotos.length));
    for (let i = 0; i < maxF; i++) platillos.forEach((p) => { if (p.fotos[i]) fotos.push([p, i]); });
    $('#galeria').hidden = !fotos.length;
    $('#galeria-lista').innerHTML = fotos.map(([p, i], n) =>
      `<button type="button" class="g-item reveal" data-foto="${n}">${imgTag(p.fotos[i], p.nombre, p.cat.emoji)}<span>${esc(p.nombre)}</span></button>`).join('');
    GALERIA = fotos;

    pintarInfo();
    $('#cartbar-wa').href = waLink(`¡Hola Payo! 👋 Vi tu menú y quiero hacer un pedido:`);
    $('#car-entrega-campo').hidden = !hayEntregas();
    observarReveal();
    observarCategorias();
    pintarCarritoBar();
  }

  function pintarInfo() {
    const tarjetas = [];
    const add = (ico, titulo, texto, href) => {
      if (!texto) return;
      const tag = href ? `a href="${esc(href)}" target="_blank" rel="noopener"` : 'div';
      tarjetas.push(`<${tag} class="info-card"><span class="info-ico">${ico}</span><div><h3>${titulo}</h3><p>${esc(texto)}</p></div></${href ? 'a' : 'div'}>`);
    };
    const tel = waNumero().replace(/^52/, '');
    add('📱', 'Pedidos', tel.replace(/(\d{2})(\d{4})(\d{4})/, '$1 $2 $3'), waLink('¡Hola Payo! 👋'));
    add('🕘', 'Horario', AJ('horario'));
    const mapa = AJ('mapa', 'maps');
    add('📍', 'Dónde estamos', AJ('ubicacion', 'direccion') || (mapa ? 'Ver en el mapa' : ''), mapa);
    add('💳', 'Formas de pago', AJ('pago') || 'Efectivo, transferencia y tarjeta');
    const ig = AJ('instagram').replace(/^@/, '');
    if (ig) add('📸', 'Instagram', '@' + ig.replace(/^https?:\/\/(www\.)?instagram\.com\//, '').replace(/\/.*$/, ''), /^http/.test(ig) ? ig : `https://instagram.com/${ig}`);
    const fb = AJ('facebook');
    if (fb) add('👍', 'Facebook', /^http/.test(fb) ? 'Síguenos' : fb, /^http/.test(fb) ? fb : `https://facebook.com/search/top?q=${encodeURIComponent(fb)}`);
    const tk = AJ('tiktok').replace(/^@/, '');
    if (tk) add('🎵', 'TikTok', '@' + tk, `https://tiktok.com/@${tk}`);
    $('#info-lista').innerHTML = tarjetas.join('');
  }

  // animación al aparecer
  let revealObs;
  function observarReveal() {
    const els = $$('.reveal:not(.is-in)');
    if (reduceMotion || !('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('is-in')); return; }
    revealObs ||= new IntersectionObserver((ents) => ents.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('is-in'); revealObs.unobserve(en.target); }
    }), { rootMargin: '0px 0px -8% 0px' });
    els.forEach((e) => revealObs.observe(e));
  }

  // la categoría visible se marca en la barra
  let catObs;
  function observarCategorias() {
    catObs?.disconnect();
    if (!('IntersectionObserver' in window)) return;
    catObs = new IntersectionObserver((ents) => ents.forEach((en) => { if (en.isIntersecting) marcarCat(en.target.id); }), { rootMargin: '-40% 0px -55% 0px' });
    $$('.cat').forEach((s) => catObs.observe(s));
  }
  function marcarCat(id) {
    $$('.cat-chip').forEach((c) => c.classList.toggle('is-on', c.dataset.cat === id));
    const chip = $(`.cat-chip[data-cat="${id}"]`);
    const cont = $('#cats-lista');
    if (chip) cont.scrollTo({ left: chip.offsetLeft - 16, behavior: reduceMotion ? 'auto' : 'smooth' });
  }

  // ---------- capas (hojas, visor) con botón "atrás" del celular ----------
  const capas = [];
  let antesDeAbrir = null;
  function mostrar(el) {
    el.hidden = false;
    el.style.zIndex = el.classList.contains('lightbox') ? 60 : 50 + capas.length;
    if (!el.classList.contains('lightbox')) $('#overlay').hidden = false;
    document.body.classList.add('no-scroll');
    requestAnimationFrame(() => $('[data-cerrar]', el)?.focus({ preventScroll: true }));
  }
  function ocultar(el) {
    el.hidden = true;
    if (!capas.some((c) => !c.classList.contains('lightbox'))) $('#overlay').hidden = true;
    if (!capas.length) { document.body.classList.remove('no-scroll'); antesDeAbrir?.focus?.({ preventScroll: true }); }
  }
  function abrir(el) {
    if (capas.includes(el)) return;
    if (!capas.length) antesDeAbrir = document.activeElement;
    capas.push(el);
    mostrar(el);
    history.pushState({ capa: capas.length }, '');
  }
  function reemplazar(el) { // cambia la capa de arriba sin tocar el historial
    const top = capas.pop();
    if (top) top.hidden = true;
    capas.push(el);
    mostrar(el);
  }
  function cerrar() { if (capas.length) history.back(); }
  window.addEventListener('popstate', () => { const el = capas.pop(); if (el) ocultar(el); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && capas.length) cerrar(); });
  $('#overlay').addEventListener('click', cerrar);
  document.addEventListener('click', (e) => { if (e.target.closest('[data-cerrar]')) cerrar(); });

  // ---------- hoja de platillo ----------
  let actual = null; // { p, sel: {gid: [nombres]}, qty, editar }

  function abrirPlatillo(p, { preset, editar, reemplazo } = {}) {
    actual = { p, sel: {}, qty: 1, editar: editar ?? null, nota: '' };
    p.grupos.forEach((g) => { actual.sel[g.id] = []; });
    if (preset) {
      Object.entries(preset.sel || {}).forEach(([gid, arr]) => {
        const g = p.grupos.find((x) => x.id === gid);
        if (g) actual.sel[gid] = arr.filter((n) => g.opciones.some((o) => o.nombre === n)).slice(0, g.max);
      });
      actual.qty = preset.qty || 1;
      actual.nota = preset.nota || '';
    } else {
      p.grupos.forEach((g) => { if (g.min && g.max === 1 && g.opciones.length === 1) actual.sel[g.id] = [g.opciones[0].nombre]; });
    }
    pintarPlatillo();
    const el = $('#sheet-platillo');
    reemplazo ? reemplazar(el) : abrir(el);
    $('#pl-scroll').scrollTop = 0;
    $('#pl-body').scrollTop = 0;
  }

  function reqTexto(g) {
    if (!g.min) return 'Opcional';
    return g.max === 1 ? 'Elige 1' : `Elige hasta ${g.max}`;
  }

  function pintarPlatillo() {
    const { p } = actual;
    const n = p.fotos.length;
    const fotos = n
      ? p.fotos.map((f, i) => `<div class="slide" data-i="${i}"><img class="slide-bg" src="${esc(f)}" alt="" aria-hidden="true" draggable="false" loading="${i ? 'lazy' : 'eager'}"><img class="slide-img" src="${esc(f)}" alt="${esc(p.nombre)}" data-emoji="${p.cat.emoji}" draggable="false" loading="${i ? 'lazy' : 'eager'}"></div>`).join('')
      : `<div class="slide">${relleno(p.cat.emoji, 'ph-lg')}</div>`;
    const media = $('#pl-media');
    media.style.setProperty('--accent', p.cat.color);
    media.innerHTML = `
      <div class="pl-gal-track" id="pl-track">${fotos}</div>
      ${n > 1 ? `
        <button type="button" class="pl-nav pl-prev" data-ir="-1" aria-label="Foto anterior" disabled>‹</button>
        <button type="button" class="pl-nav pl-next" data-ir="1" aria-label="Foto siguiente">›</button>
        <div class="pl-dots">${p.fotos.map((_, i) => `<button type="button" data-foto="${i}" class="${i ? '' : 'is-on'}" aria-label="Foto ${i + 1} de ${n}"><i></i></button>`).join('')}</div>` : ''}
      ${n ? '<button type="button" class="pl-zoom" data-zoom>⤢ Ver grande</button>' : ''}`;
    $('#pl-body').innerHTML = `
      <div class="pl-head">
        <h2 id="pl-nombre">${esc(p.nombre)}</h2>
        ${p.descripcion ? `<p>${esc(p.descripcion)}</p>` : ''}
        ${p.precio != null ? `<span class="price">${money(p.precio)}</span>` : ''}
        ${p.agotado ? '<p><strong>😢 Hoy no hay, pero pregúntale a Payo por WhatsApp.</strong></p>' : ''}
      </div>
      ${p.grupos.map((g) => `
        <div class="grupo" data-g="${g.id}">
          <div class="grupo-head"><h3>${esc(g.titulo)}</h3><span class="grupo-req">${reqTexto(g)}</span></div>
          <div class="chips">${g.opciones.map((o) => `<button type="button" class="chip" data-op="${esc(o.nombre)}" aria-pressed="false">${esc(o.nombre)}${o.precio ? `<small>+${money(o.precio)}</small>` : ''}</button>`).join('')}</div>
        </div>`).join('')}
      <div class="grupo">
        <label class="field">
          <span>¿Cómo lo quieres? <small>(opcional)</small></span>
          <textarea id="pl-nota" rows="2" maxlength="160" placeholder="Ej. sin cebolla, salsa aparte, bien doradito…">${esc(actual.nota)}</textarea>
        </label>
      </div>`;

    $('#pl-nota').addEventListener('input', (e) => { actual.nota = e.target.value; });
    refrescarPlatillo();
  }

  function precioUnidad(p, sel) {
    if (p.precio == null) return null;
    let t = p.precio;
    p.grupos.forEach((g) => (sel[g.id] || []).forEach((n) => { t += g.opciones.find((o) => o.nombre === n)?.precio || 0; }));
    return t;
  }

  function refrescarPlatillo() {
    const { p, sel, qty } = actual;
    p.grupos.forEach((g) => {
      const box = $(`.grupo[data-g="${g.id}"]`);
      $$('.chip', box).forEach((c) => { const on = sel[g.id].includes(c.dataset.op); c.classList.toggle('is-on', on); c.setAttribute('aria-pressed', on); });
      const req = $('.grupo-req', box);
      req.classList.remove('is-falta');
      req.classList.toggle('is-ok', g.min > 0 && sel[g.id].length >= g.min);
    });
    $('#pl-qty').textContent = qty;
    const u = precioUnidad(p, sel);
    const btn = $('#pl-agregar');
    btn.disabled = p.agotado;
    btn.textContent = `${actual.editar != null ? 'Guardar' : 'Agregar'}${u != null ? ' · ' + money(u * qty) : ' al pedido'}`;
  }

  // ---------- carrusel de fotos del platillo ----------
  const fotoActual = () => { const t = $('#pl-track'); return t ? Math.round(t.scrollLeft / (t.clientWidth || 1)) : 0; };
  function irAFoto(i) {
    const t = $('#pl-track');
    const n = $$('.slide', t).length;
    i = Math.max(0, Math.min(n - 1, i));
    t.scrollTo({ left: i * t.clientWidth, behavior: reduceMotion ? 'auto' : 'smooth' });
  }
  function marcarFoto() {
    const i = fotoActual();
    const n = $$('#pl-track .slide').length;
    $$('.pl-dots button').forEach((d, k) => d.classList.toggle('is-on', k === i));
    const prev = $('.pl-prev'), next = $('.pl-next');
    if (prev) prev.disabled = i <= 0;
    if (next) next.disabled = i >= n - 1;
  }
  const media = $('#pl-media');
  media.addEventListener('scroll', marcarFoto, { capture: true, passive: true });
  media.addEventListener('click', (e) => {
    if (arrastre?.movio) return;
    const ir = e.target.closest('[data-ir]');
    if (ir) return irAFoto(fotoActual() + +ir.dataset.ir);
    const dot = e.target.closest('[data-foto]');
    if (dot) return irAFoto(+dot.dataset.foto);
    if (e.target.closest('[data-zoom], .slide-img')) {
      const { p } = actual;
      if (!p.fotos.length) return;
      verFoto(fotoActual(), p.fotos.map((_, k) => [p, k]), true);
      abrir($('#lightbox'));
    }
  });
  // arrastrar con el mouse en computadora (en el celular se desliza con el dedo)
  let arrastre = null;
  media.addEventListener('pointerdown', (e) => {
    const t = e.target.closest('#pl-track');
    if (!t || e.pointerType !== 'mouse' || e.button !== 0) return;
    arrastre = { t, x: e.clientX, inicio: t.scrollLeft, i: fotoActual(), movio: false };
  });
  window.addEventListener('pointermove', (e) => {
    if (!arrastre) return;
    const dx = e.clientX - arrastre.x;
    if (!arrastre.movio && Math.abs(dx) > 5) { arrastre.movio = true; arrastre.t.classList.add('dragging'); }
    if (arrastre.movio) arrastre.t.scrollLeft = arrastre.inicio - dx;
  });
  window.addEventListener('pointerup', (e) => {
    if (!arrastre) return;
    const { t, x, i, movio } = arrastre;
    if (movio) {
      const dx = e.clientX - x;
      t.classList.remove('dragging');
      irAFoto(i + (dx < -50 ? 1 : dx > 50 ? -1 : 0));
      setTimeout(() => { arrastre = null; }, 0); // evita que el arrastre cuente como clic
    } else arrastre = null;
  });
  document.addEventListener('keydown', (e) => {
    if (capas[capas.length - 1] !== $('#sheet-platillo') || e.target.matches('textarea, input')) return;
    if (e.key === 'ArrowRight') irAFoto(fotoActual() + 1);
    if (e.key === 'ArrowLeft') irAFoto(fotoActual() - 1);
  });

  $('#pl-body').addEventListener('click', (e) => {
    const chip = e.target.closest('.chip[data-op]');
    if (!chip) return;
    const gid = chip.closest('.grupo').dataset.g;
    const g = actual.p.grupos.find((x) => x.id === gid);
    const arr = actual.sel[gid];
    const n = chip.dataset.op;
    if (arr.includes(n)) {
      if (!(g.max === 1 && g.min)) arr.splice(arr.indexOf(n), 1);
    } else if (g.max === 1) {
      arr.splice(0, arr.length, n);
    } else if (arr.length >= g.max) {
      toast(`Puedes elegir hasta ${g.max}. Quita uno primero 😉`);
      const req = $(`.grupo[data-g="${gid}"] .grupo-req`);
      req.classList.remove('is-falta'); void req.offsetWidth; req.classList.add('is-falta');
      return;
    } else arr.push(n);
    refrescarPlatillo();
  });

  $('#pl-menos').addEventListener('click', () => { actual.qty = Math.max(1, actual.qty - 1); refrescarPlatillo(); });
  $('#pl-mas').addEventListener('click', () => { actual.qty = Math.min(50, actual.qty + 1); refrescarPlatillo(); });

  $('#pl-agregar').addEventListener('click', () => {
    const { p, sel, qty, nota, editar } = actual;
    const falta = p.grupos.find((g) => sel[g.id].length < g.min);
    if (falta) {
      const box = $(`.grupo[data-g="${falta.id}"]`);
      box.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
      const req = $('.grupo-req', box);
      req.classList.remove('is-falta'); void req.offsetWidth; req.classList.add('is-falta');
      toast(`Falta: ${falta.titulo}`);
      return;
    }
    const item = {
      key: editar ?? Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      id: p.id, nombre: p.nombre, foto: p.fotos[0] || '', emoji: p.cat.emoji, color: p.cat.color,
      qty, nota: nota.trim(),
      sel: JSON.parse(JSON.stringify(sel)),
      detalle: p.grupos.filter((g) => sel[g.id].length).map((g) => ({ t: g.titulo, v: sel[g.id].join(', ') })),
      unidad: precioUnidad(p, sel),
    };
    const i = carrito.findIndex((x) => x.key === item.key);
    if (i >= 0) carrito[i] = item; else carrito.push(item);
    guardarCarrito();
    cerrar();
    if (editar != null) pintarCarrito();
    toast(`${editar != null ? 'Listo' : 'Agregado'}: ${qty}× ${p.nombre} 🙌`);
    const bar = $('#cartbar');
    bar.classList.remove('bump'); void bar.offsetWidth; bar.classList.add('bump');
  });

  // abrir platillos desde tarjetas
  document.addEventListener('click', (e) => {
    const b = e.target.closest('.dish[data-id], .fav[data-id]');
    if (!b) return;
    const p = MENU.platillos.find((x) => x.id === b.dataset.id);
    if (p) abrirPlatillo(p);
  });

  // ---------- carrito ----------
  function guardarCarrito() { store.set('carrito', carrito); pintarCarritoBar(); }

  function totalCarrito() {
    const conocido = carrito.every((x) => x.unidad != null);
    return conocido ? carrito.reduce((s, x) => s + x.unidad * x.qty, 0) : null;
  }

  function pintarCarritoBar() {
    const n = carrito.reduce((s, x) => s + x.qty, 0);
    const bar = $('#cartbar');
    bar.classList.toggle('has-items', n > 0);
    $('#cartbar-cart').hidden = !n;
    $('#cartbar-count').textContent = n;
    const t = totalCarrito();
    $('#cartbar-total').textContent = t != null && t > 0 ? money(t) : '';
  }

  function pintarCarrito() {
    const ul = $('#car-items');
    if (!carrito.length) {
      ul.innerHTML = '<li class="car-vacio">Tu pedido está vacío.<br>¡Elige algo rico del menú! 🍳</li>';
    } else {
      ul.innerHTML = carrito.map((x) => `
        <li class="car-item" data-key="${x.key}">
          <div class="car-thumb" style="--accent:${x.color}">${x.foto ? imgTag(x.foto, x.nombre, x.emoji) : relleno(x.emoji)}</div>
          <div class="car-info">
            <strong>${esc(x.nombre)}</strong>
            ${x.detalle.map((d) => `<small>${esc(d.t)}: ${esc(d.v)}</small>`).join('')}
            ${x.nota ? `<small>📝 ${esc(x.nota)}</small>` : ''}
            <div class="car-acc">${MENU.platillos.some((p) => p.id === x.id) ? '<button type="button" data-acc="editar">Cambiar</button>' : ''}<button type="button" data-acc="quitar">Quitar</button></div>
          </div>
          <div class="car-side">
            ${x.unidad != null ? `<strong>${money(x.unidad * x.qty)}</strong>` : ''}
            <div class="qty qty-sm"><button type="button" data-acc="menos" aria-label="Uno menos">−</button><output>${x.qty}</output><button type="button" data-acc="mas" aria-label="Uno más">+</button></div>
          </div>
        </li>`).join('') + '<li><button type="button" class="link-btn" data-acc="vaciar">Vaciar pedido</button></li>';
    }
    const t = totalCarrito();
    $('#car-total').innerHTML = !carrito.length ? '' : t != null && t > 0
      ? `<span>Total</span><span>${money(t)}</span>`
      : '<small>💬 Payo te confirma el total por WhatsApp</small>';
    $('#car-enviar').disabled = !carrito.length;
  }

  $('#car-items').addEventListener('click', (e) => {
    const b = e.target.closest('[data-acc]');
    if (!b) return;
    if (b.dataset.acc === 'vaciar') {
      if (confirm('¿Vaciar todo tu pedido?')) { carrito = []; guardarCarrito(); pintarCarrito(); }
      return;
    }
    const key = b.closest('[data-key]').dataset.key;
    const x = carrito.find((i) => i.key === key);
    if (!x) return;
    if (b.dataset.acc === 'mas') x.qty = Math.min(50, x.qty + 1);
    if (b.dataset.acc === 'menos') x.qty -= 1;
    if (b.dataset.acc === 'quitar') x.qty = 0;
    if (b.dataset.acc === 'editar') {
      const p = MENU.platillos.find((i) => i.id === x.id);
      if (p) abrirPlatillo(p, { preset: x, editar: x.key });
      return;
    }
    carrito = carrito.filter((i) => i.qty > 0);
    guardarCarrito();
    pintarCarrito();
  });

  const datosCliente = store.get('cliente', {});
  $('#car-nombre').value = datosCliente.nombre || '';
  $('#car-dir').value = datosCliente.dir || '';

  function chipsUnaOpcion(contId, onChange) {
    const cont = $(contId);
    cont.addEventListener('click', (e) => {
      const c = e.target.closest('.chip');
      if (!c) return;
      $$('.chip', cont).forEach((x) => x.classList.toggle('is-on', x === c));
      onChange(c.dataset.v);
    });
  }
  const valorChip = (id) => $(`${id} .chip.is-on`)?.dataset.v;
  chipsUnaOpcion('#car-entrega', (v) => { $('#car-dir-campo').hidden = v !== 'llevar'; });
  chipsUnaOpcion('#car-hora', (v) => { const i = $('#car-hora-input'); i.hidden = v !== 'hora'; if (v === 'hora') i.focus(); });

  $('#cartbar-cart').addEventListener('click', () => { pintarCarrito(); abrir($('#sheet-carrito')); });

  function mensajePedido() {
    const L = [`¡Hola Payo! 👋 Quiero hacer un pedido:`, ''];
    carrito.forEach((x) => {
      L.push(`*${x.qty}× ${x.nombre}*${x.unidad != null ? ' — ' + money(x.unidad * x.qty) : ''}`);
      x.detalle.forEach((d) => L.push(`   • ${d.t}: ${d.v}`));
      if (x.nota) L.push(`   📝 ${x.nota}`);
    });
    L.push('');
    const t = totalCarrito();
    L.push(t != null && t > 0 ? `💰 *Total: ${money(t)}*` : '💰 ¿Me confirmas el total, porfa?');
    const nombre = $('#car-nombre').value.trim();
    if (nombre) L.push(`👤 A nombre de: ${nombre}`);
    if (hayEntregas() && valorChip('#car-entrega') === 'llevar') {
      const dir = $('#car-dir').value.trim();
      L.push(`🛵 Me lo llevas${dir ? ' a: ' + dir : ''}`);
    } else L.push('🏃 Paso a recogerlo');
    const hora = $('#car-hora-input').value;
    L.push(valorChip('#car-hora') === 'hora' && hora ? `🕘 Para las ${hora}` : '🕘 Lo antes posible');
    const nota = $('#car-nota').value.trim();
    if (nota) L.push(`📝 ${nota}`);
    L.push('', '_Pedido hecho desde el menú digital_');
    return L.join('\n');
  }

  $('#car-enviar').addEventListener('click', () => {
    if (!carrito.length) return;
    if (hayEntregas() && valorChip('#car-entrega') === 'llevar' && !$('#car-dir').value.trim()) {
      $('#car-dir').focus();
      toast('Dinos a dónde te lo llevamos 🛵');
      return;
    }
    store.set('cliente', { nombre: $('#car-nombre').value.trim(), dir: $('#car-dir').value.trim() });
    window.open(waLink(mensajePedido()), '_blank', 'noopener');
    toast('¡Listo! Termina de enviarlo en WhatsApp 📲');
  });

  // ---------- ruleta: "¿qué pido?" ----------
  let ruleta = null;
  function elegirAlAzar() {
    const disponibles = MENU.platillos.filter((p) => !p.agotado);
    const p = disponibles[Math.floor(Math.random() * disponibles.length)];
    const sel = {};
    p.grupos.forEach((g) => {
      const ops = [...g.opciones].sort(() => Math.random() - 0.5);
      sel[g.id] = g.min ? ops.slice(0, 1).map((o) => o.nombre) : [];
    });
    return { p, sel };
  }
  function girar() {
    if (!MENU.platillos.some((p) => !p.agotado)) return;
    const foto = $('#ru-foto'), nom = $('#ru-nombre'), det = $('#ru-detalle'), quiero = $('#ru-quiero');
    quiero.disabled = true;
    det.textContent = '';
    foto.classList.add('spin');
    nom.classList.remove('ruleta-done');
    let paso = 0;
    const pasos = reduceMotion ? 1 : 16;
    const tick = () => {
      ruleta = elegirAlAzar();
      const { p } = ruleta;
      foto.style.setProperty('--accent', p.cat.color);
      foto.innerHTML = p.fotos[0] ? imgTag(p.fotos[0], p.nombre, p.cat.emoji, 'eager') : relleno(p.cat.emoji, 'ph-lg');
      nom.textContent = p.nombre;
      if (++paso < pasos) setTimeout(tick, 50 + paso * paso * 1.6);
      else {
        foto.classList.remove('spin');
        nom.classList.add('ruleta-done');
        det.textContent = p.grupos.filter((g) => ruleta.sel[g.id].length).map((g) => ruleta.sel[g.id].join(', ')).join(' · ') || p.descripcion;
        quiero.disabled = false;
      }
    };
    tick();
  }
  document.addEventListener('click', (e) => {
    if (!e.target.closest('[data-ruleta]')) return;
    abrir($('#sheet-ruleta'));
    girar();
  });
  $('#ru-otra').addEventListener('click', girar);
  $('#ru-quiero').addEventListener('click', () => { if (ruleta) abrirPlatillo(ruleta.p, { preset: { sel: ruleta.sel }, reemplazo: true }); });

  // ---------- galería / visor ----------
  let GALERIA = [], lbLista = [], lbIndex = 0, lbDesdePlatillo = false;
  function verFoto(i, listaNueva, desdePlatillo) {
    if (listaNueva) { lbLista = listaNueva; lbDesdePlatillo = !!desdePlatillo; }
    lbIndex = (i + lbLista.length) % lbLista.length;
    const [p, n] = lbLista[lbIndex];
    const img = $('#lb-img');
    img.src = p.fotos[n];
    img.alt = p.nombre;
    $('#lb-nombre').textContent = lbLista.length > 1 && lbDesdePlatillo ? `${p.nombre} · ${lbIndex + 1}/${lbLista.length}` : p.nombre;
    $('#lb-pedir').hidden = p.agotado || lbDesdePlatillo;
    $('#lb-prev').hidden = $('#lb-next').hidden = lbLista.length < 2;
  }
  $('#galeria-lista').addEventListener('click', (e) => {
    const b = e.target.closest('.g-item');
    if (!b) return;
    verFoto(+b.dataset.foto, GALERIA);
    abrir($('#lightbox'));
  });
  $('#lb-prev').addEventListener('click', () => verFoto(lbIndex - 1));
  $('#lb-next').addEventListener('click', () => verFoto(lbIndex + 1));
  $('#lb-pedir').addEventListener('click', () => abrirPlatillo(lbLista[lbIndex][0], { reemplazo: true }));
  let toqueX = null;
  $('#lightbox').addEventListener('touchstart', (e) => { toqueX = e.touches[0].clientX; }, { passive: true });
  $('#lightbox').addEventListener('touchend', (e) => {
    if (toqueX == null) return;
    const dx = e.changedTouches[0].clientX - toqueX;
    if (Math.abs(dx) > 50) verFoto(lbIndex + (dx < 0 ? 1 : -1));
    toqueX = null;
  });
  document.addEventListener('keydown', (e) => {
    if ($('#lightbox').hidden) return;
    if (e.key === 'ArrowRight') verFoto(lbIndex + 1);
    if (e.key === 'ArrowLeft') verFoto(lbIndex - 1);
  });

  // ---------- búsqueda ----------
  const inputBuscar = $('#buscar');
  $('#btn-buscar').addEventListener('click', () => { $('#search-box').hidden = false; inputBuscar.focus(); });
  $('#cerrar-buscar').addEventListener('click', () => { inputBuscar.value = ''; filtrar(''); $('#search-box').hidden = true; });
  inputBuscar.addEventListener('input', () => filtrar(inputBuscar.value));
  inputBuscar.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); inputBuscar.blur(); } });
  function filtrar(q) {
    const t = norm(q).split('_').filter(Boolean);
    let total = 0;
    $$('.cat').forEach((sec) => {
      let n = 0;
      $$('.dish', sec).forEach((d) => {
        const ok = t.every((w) => d.dataset.buscar.includes(w));
        d.hidden = !ok;
        if (ok) { n++; d.classList.add('is-in'); }
      });
      sec.hidden = !n;
      total += n;
    });
    $('#favoritos').hidden = !!t.length || !$('#favs-lista').children.length;
    $('#sin-resultados').hidden = total > 0;
    if (t.length) $('#menu').scrollIntoView({ behavior: 'auto', block: 'start' });
  }

  // ---------- opiniones ----------
  function formulario() {
    const s = (CFG.formularioOpiniones || '').trim();
    if (!s) return null;
    try {
      const u = new URL(s);
      const m = u.pathname.match(/\/forms\/d\/e\/([^/]+)\//);
      if (!m) return null;
      const f = { action: `https://docs.google.com/forms/d/e/${m[1]}/formResponse` };
      for (const [k, v] of u.searchParams) {
        if (!k.startsWith('entry.')) continue;
        const n = norm(v);
        if (/^[1-5]$/.test(v.trim())) f.calif = k;
        else if (n.startsWith('nombre')) f.nombre = k;
        else f.comentario = k;
      }
      return f.calif ? f : null;
    } catch { return null; }
  }
  const FORM = formulario();

  let OPINIONES = [];
  const misOpiniones = () => store.get('mis-opiniones', []);

  function leerOpiniones(filas) {
    return filas.map((f) => ({
      calif: parseInt(campo(f, ['calificacion', 'calif', 'estrellas', 'puntuacion', 'rating'], 'contiene'), 10),
      nombre: campo(f, ['nombre'], 'contiene'),
      comentario: campo(f, ['comentario', 'opinion', 'mensaje'], 'contiene'),
      fecha: campo(f, ['marca_temporal', 'fecha', 'timestamp'], 'contiene').split(/\s+/)[0],
      oculta: esSi(campo(f, ['ocultar'], 'contiene')),
    })).filter((o) => o.calif >= 1 && o.calif <= 5 && !o.oculta).reverse();
  }

  const estrellas = (n) => '★'.repeat(Math.round(n)) + '☆'.repeat(5 - Math.round(n));
  const colorDe = (s) => ACENTOS[[...s].reduce((a, c) => a + c.charCodeAt(0), 0) % ACENTOS.length];

  function pintarOpiniones() {
    const propias = misOpiniones().filter((m) => !OPINIONES.some((o) => o.comentario === m.comentario && o.calif === m.calif));
    const todas = [...propias, ...OPINIONES];
    const res = $('#op-resumen');
    if (!todas.length) {
      res.innerHTML = '';
      $('#op-lista').innerHTML = '<div class="op-vacio">Aún no hay opiniones.<br>¡Sé el primero en contarnos qué tal! ⭐</div>';
      return;
    }
    const prom = todas.reduce((s, o) => s + o.calif, 0) / todas.length;
    const cuenta = [5, 4, 3, 2, 1].map((n) => [n, todas.filter((o) => o.calif === n).length]);
    res.innerHTML = `
      <div><div class="op-score">${prom.toFixed(1)}</div><div class="op-stars" aria-label="${prom.toFixed(1)} de 5">${estrellas(prom)}</div><div class="op-total">${todas.length} ${todas.length === 1 ? 'opinión' : 'opiniones'}</div></div>
      <div class="op-bars">${cuenta.map(([n, c]) => `<div class="op-bar"><span>${n}</span><i><b style="width:${(c / todas.length) * 100}%"></b></i><span>${c}</span></div>`).join('')}</div>`;
    $('#op-lista').innerHTML = todas.slice(0, 40).map((o) => {
      const nombre = o.nombre || 'Cliente';
      return `<article class="op-card">
        <div class="op-stars" aria-label="${o.calif} de 5">${estrellas(o.calif)}</div>
        ${o.comentario ? `<p>“${esc(o.comentario)}”</p>` : '<p></p>'}
        <div class="op-quien"><span class="op-avatar" style="background:${colorDe(nombre)}">${esc(nombre[0].toUpperCase())}</span>
          <span>${esc(nombre)}<br><span class="op-fecha">${o.pendiente ? 'Enviada por ti' : esc(o.fecha)}</span></span></div>
      </article>`;
    }).join('');
  }

  let calificacion = 0;
  const ETIQUETAS = ['', 'Nada bien 😕', 'Puede mejorar 😐', 'Bien 🙂', '¡Muy rico! 😋', '¡Lo mejor! 🤩'];
  $('#stars-input').addEventListener('click', (e) => {
    const b = e.target.closest('[data-v]');
    if (!b) return;
    calificacion = +b.dataset.v;
    $$('#stars-input [data-v]').forEach((s) => { const on = +s.dataset.v <= calificacion; s.classList.toggle('is-on', on); s.setAttribute('aria-checked', +s.dataset.v === calificacion); });
    $('#stars-label').textContent = ETIQUETAS[calificacion];
  });

  $('#op-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const nota = $('#op-nota');
    if ($('#op-web').value) return; // trampa para robots
    if (!calificacion) { nota.textContent = 'Elige de 1 a 5 estrellas ⭐'; return; }
    const nombre = $('#op-nombre').value.trim();
    const comentario = $('#op-comentario').value.trim();
    const ultima = store.get('ultima-opinion', 0);
    if (Date.now() - ultima < 12 * 3600e3) { nota.textContent = 'Ya recibimos tu opinión de hoy, ¡gracias! 💛'; return; }

    if (!FORM) {
      const txt = `Hola Payo, te dejo mi opinión del servicio:\n${'⭐'.repeat(calificacion)} (${calificacion}/5)\n${comentario}${nombre ? '\n— ' + nombre : ''}`;
      window.open(waLink(txt), '_blank', 'noopener');
      nota.textContent = '¡Gracias! Se abrió WhatsApp para enviársela a Payo.';
      return;
    }
    const btn = $('button[type="submit"]', e.target);
    btn.disabled = true;
    nota.textContent = 'Enviando…';
    try {
      const body = new URLSearchParams();
      body.append(FORM.calif, calificacion);
      if (FORM.nombre) body.append(FORM.nombre, nombre);
      if (FORM.comentario) body.append(FORM.comentario, comentario);
      await fetch(FORM.action, { method: 'POST', mode: 'no-cors', body });
      store.set('ultima-opinion', Date.now());
      store.set('mis-opiniones', [{ calif: calificacion, nombre, comentario, pendiente: true }, ...misOpiniones()].slice(0, 5));
      e.target.reset();
      calificacion = 0;
      $$('#stars-input [data-v]').forEach((s) => s.classList.remove('is-on'));
      $('#stars-label').textContent = 'Toca las estrellas';
      nota.textContent = '¡Gracias por tu opinión! 💛';
      pintarOpiniones();
    } catch {
      nota.textContent = 'No se pudo enviar. Revisa tu internet e intenta otra vez.';
    } finally {
      btn.disabled = false;
    }
  });

  // ---------- arranque ----------
  function usar(datos) {
    AJ = armarAjustes(datos.ajustes || []);
    MENU = armarMenu(datos.platillos || []);
    pintarMenu();
  }

  const conHoja = !!(CFG.hojaDeGoogle || '').trim();
  const cache = conHoja ? store.get('menu-cache', null) : null;
  usar(cache && cache.platillos?.length ? cache : RESPALDO);
  if (conHoja) OPINIONES = store.get('opiniones-cache', []);
  pintarOpiniones();

  if (conHoja) {
    Promise.allSettled([leerPestana(TABS.platillos), leerPestana(TABS.ajustes)]).then(([pl, aj]) => {
      // Si una pestaña no existe, Google devuelve la primera; por eso se revisan las columnas.
      const platillos = pl.status === 'fulfilled' && pl.value.some((f) => campo(f, ['platillo', 'nombre'])) ? pl.value : null;
      const ajustes = aj.status === 'fulfilled' && aj.value.some((f) => campo(f, ['valor'])) ? aj.value : (cache?.ajustes || RESPALDO.ajustes);
      if (!platillos) { console.warn('No se pudo leer la hoja de Google; se usa el menú guardado.', pl.reason || ''); return; }
      const nuevo = { platillos, ajustes };
      if (JSON.stringify(nuevo) !== JSON.stringify(cache)) { store.set('menu-cache', nuevo); usar(nuevo); }
    });
    leerPestana(TABS.opiniones).then((filas) => {
      OPINIONES = leerOpiniones(filas);
      store.set('opiniones-cache', OPINIONES);
      pintarOpiniones();
    }).catch(() => { /* sin pestaña de opiniones todavía */ });
  }
})();
