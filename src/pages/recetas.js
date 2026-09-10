import { supabase } from '../supabase.js';

export function renderRecetasView(usuarioActual, abrirFormularioInicial = false) {
  const container = document.createElement('div');
  container.className = 'recetas-page-container';

  const searchSVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`;
  const editSVG = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`;
  const trashSVG = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;

  let recetas = [];
  let busqueda = '';
  let imagenBase64 = null;
  let recetaEditandoId = null;

  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
      <div>
        <h1 style="margin: 0; font-size: 26px; font-weight: 800; color: var(--text-main);">Mis Recetas</h1>
        <p style="margin: 4px 0 0 0; font-size: 14px; color: var(--text-muted);">Gestiona tus platos y preparaciones favoritas</p>
      </div>

      <button id="btnNuevaReceta" style="width: auto; padding: 10px 18px; margin: 0; border-radius: 12px; font-weight: 700; font-size: 14px; display: flex; align-items: center; gap: 6px;">
        <span>+</span> Añadir receta
      </button>
    </div>

    <div style="position: relative; width: 100%; margin-bottom: 24px;">
      <div style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); display: flex; align-items: center; pointer-events: none;">
        ${searchSVG}
      </div>
      <input type="text" id="inputBuscar" placeholder="Buscar por nombre o ingrediente..." style="padding-left: 42px; margin-top: 0; height: 46px; border-radius: 14px;" />
    </div>

    <!-- FORMULARIO CREAR Y EDITAR -->
    <div id="modalFormReceta" class="card hidden" style="margin-bottom: 28px; border: 2px solid var(--primary-light);">
      <h3 id="formTitle" style="margin-top: 0; margin-bottom: 16px; font-weight: 800; color: var(--primary);">Crear Nueva Receta</h3>
      
      <form id="formReceta" style="display: flex; flex-direction: column; gap: 12px;">
        <div>
          <label style="font-size: 12px; font-weight: 700; color: var(--text-muted);">Nombre de la receta *</label>
          <input type="text" id="recetaNombre" placeholder="Ej: Pollo al curry con arroz" required />
        </div>

        <!-- SELECCIÓN DE MOMENTO DEL DÍA -->
        <div>
          <label style="font-size: 12px; font-weight: 700; color: var(--text-muted);">¿Para qué momento del día es apta?</label>
          <div style="display: flex; gap: 12px; margin-top: 6px; flex-wrap: wrap;">
            <label style="font-size: 13px; font-weight: 600;"><input type="checkbox" class="chk-cat" value="Desayuno" style="width:auto; margin:0 4px 0 0;"> Desayuno</label>
            <label style="font-size: 13px; font-weight: 600;"><input type="checkbox" class="chk-cat" value="Comida" style="width:auto; margin:0 4px 0 0;" checked> Comida</label>
            <label style="font-size: 13px; font-weight: 600;"><input type="checkbox" class="chk-cat" value="Merienda" style="width:auto; margin:0 4px 0 0;"> Merienda</label>
            <label style="font-size: 13px; font-weight: 600;"><input type="checkbox" class="chk-cat" value="Cena" style="width:auto; margin:0 4px 0 0;" checked> Cena</label>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <label style="font-size: 12px; font-weight: 700; color: var(--text-muted);">Tiempo (min)</label>
            <input type="number" id="recetaTiempo" placeholder="25" min="1" />
          </div>
          <div>
            <label style="font-size: 12px; font-weight: 700; color: var(--text-muted);">Imagen (Archivo local)</label>
            <input type="file" id="recetaFile" accept="image/*" style="padding: 8px; font-size: 12px;" />
          </div>
        </div>

        <div>
          <label style="font-size: 12px; font-weight: 700; color: var(--text-muted);">O pegar enlace URL de imagen (Opcional)</label>
          <input type="url" id="recetaImagenUrl" placeholder="https://..." />
        </div>

        <div id="previewContainer" class="hidden" style="text-align: center; margin-top: 4px;">
          <img id="imgPreview" src="" alt="Vista previa" style="max-height: 120px; border-radius: 12px; border: 1px solid var(--border);" />
        </div>

        <div>
          <label style="font-size: 12px; font-weight: 700; color: var(--text-muted);">Ingredientes</label>
          <textarea id="recetaIngredientes" rows="3" placeholder="2 pechugas de pollo&#10;1 vaso de arroz"></textarea>
        </div>

        <div>
          <label style="font-size: 12px; font-weight: 700; color: var(--text-muted);">Pasos de preparación</label>
          <textarea id="recetaPasos" rows="3" placeholder="1. Cortar el pollo...&#10;2. Cocinar a fuego lento..."></textarea>
        </div>

        <p id="formErrorMsg" style="color: var(--danger); font-size: 13px; font-weight: 600; margin: 0; display: none;"></p>

        <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 8px;">
          <button type="button" id="btnCancelarForm" class="btn-outline" style="width: auto; margin:0; padding: 10px 18px;">Cancelar</button>
          <button type="submit" id="btnSubmitReceta" style="width: auto; margin:0; padding: 10px 22px;">Guardar Receta</button>
        </div>
      </form>
    </div>

    <div id="gridRecetas" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 20px;"></div>

    <div id="modalDetalleReceta" class="sidebar-overlay">
      <div class="card modal-dialog-content" style="max-width: 520px; width: 92%; margin: 40px auto; max-height: 85vh; overflow-y: auto; padding: 24px; position: relative;">
        <button id="btnCloseDetalle" style="position: absolute; top: 16px; right: 16px; width: 32px; height: 32px; background: var(--input-bg); border: 1px solid var(--border); border-radius: 50%; font-size: 16px; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; justify-content: center; margin: 0; padding: 0; z-index: 10;">✕</button>
        <div id="contenidoDetalle"></div>
      </div>
    </div>
  `;

  const modalForm = container.querySelector('#modalFormReceta');
  const formTitle = container.querySelector('#formTitle');
  const btnNueva = container.querySelector('#btnNuevaReceta');
  const btnCancelar = container.querySelector('#btnCancelarForm');
  const formReceta = container.querySelector('#formReceta');
  const btnSubmit = container.querySelector('#btnSubmitReceta');
  const formErrorMsg = container.querySelector('#formErrorMsg');
  const inputBuscar = container.querySelector('#inputBuscar');
  const grid = container.querySelector('#gridRecetas');

  const inputFile = container.querySelector('#recetaFile');
  const inputUrl = container.querySelector('#recetaImagenUrl');
  const previewContainer = container.querySelector('#previewContainer');
  const imgPreview = container.querySelector('#imgPreview');

  const modalDetalle = container.querySelector('#modalDetalleReceta');
  const contenidoDetalle = container.querySelector('#contenidoDetalle');
  const btnCloseDetalle = container.querySelector('#btnCloseDetalle');

  if (abrirFormularioInicial) modalForm.classList.remove('hidden');

  inputFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        imagenBase64 = event.target.result;
        imgPreview.src = imagenBase64;
        previewContainer.classList.remove('hidden');
        inputUrl.value = '';
      };
      reader.readAsDataURL(file);
    }
  });

  inputUrl.addEventListener('input', (e) => {
    if (e.target.value.trim()) {
      imagenBase64 = null;
      inputFile.value = '';
      imgPreview.src = e.target.value.trim();
      previewContainer.classList.remove('hidden');
    } else if (!imagenBase64) previewContainer.classList.add('hidden');
  });

  function resetFormulario() {
    formReceta.reset();
    recetaEditandoId = null;
    imagenBase64 = null;
    formTitle.innerText = "Crear Nueva Receta";
    btnSubmit.innerText = "Guardar Receta";
    previewContainer.classList.add('hidden');
    formErrorMsg.style.display = 'none';
  }

  btnNueva.addEventListener('click', () => { resetFormulario(); modalForm.classList.toggle('hidden'); });
  btnCancelar.addEventListener('click', () => { modalForm.classList.add('hidden'); resetFormulario(); });
  modalDetalle.addEventListener('click', (e) => { if (e.target === modalDetalle) modalDetalle.classList.remove('visible'); });
  btnCloseDetalle.addEventListener('click', () => modalDetalle.classList.remove('visible'));
  inputBuscar.addEventListener('input', (e) => { busqueda = e.target.value.toLowerCase(); renderGrid(); });

  async function cargarRecetas() {
    const { data, error } = await supabase.from('recetas').select('*').eq('user_id', usuarioActual.id).order('created_at', { ascending: false });
    if (!error && data) { recetas = data; renderGrid(); }
  }

  function renderGrid() {
    const filtradas = recetas.filter(r => r.nombre.toLowerCase().includes(busqueda) || (r.ingredientes && r.ingredientes.toLowerCase().includes(busqueda)));
    grid.innerHTML = '';

    if (filtradas.length === 0) {
      grid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; color: var(--text-muted);"><div style="font-size: 40px; margin-bottom: 10px;">🍲</div><p style="margin: 0; font-size: 15px; font-weight: 600;">No se encontraron recetas.</p></div>`;
      return;
    }

    filtradas.forEach(r => {
      const card = document.createElement('div');
      card.className = 'card';
      card.style.cssText = 'padding: 16px; border-radius: 18px; display: flex; flex-direction: column; justify-content: space-between; cursor: pointer; transition: transform 0.2s;';

      const imgHtml = r.imagen_url ? `<img src="${r.imagen_url}" alt="${r.nombre}" style="width: 100%; height: 140px; object-fit: cover; border-radius: 12px; margin-bottom: 12px;" />` : `<div style="width: 100%; height: 100px; background: var(--primary-light); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 32px; margin-bottom: 12px;">👨‍🍳</div>`;

      card.innerHTML = `
        <div class="card-click-area">
          ${imgHtml}
          <h3 style="margin: 0 0 6px 0; font-size: 17px; font-weight: 800; color: var(--text-main);">${r.nombre}</h3>
          <p style="margin: 0 0 10px 0; font-size: 12px; color: var(--text-muted); font-weight: 600;">⏱️ ${r.tiempo_preparacion || 15} min • ${r.categorias || 'Comida'}</p>
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 10px;">
          <button class="btn-edit-receta btn-outline" style="width: auto; padding: 6px 12px; margin: 0; border-radius: 8px; font-size: 12px; display: inline-flex; align-items: center; gap: 5px;" data-id="${r.id}">${editSVG} Editar</button>
          <button class="btn-delete-receta btn-outline" style="width: auto; padding: 6px 12px; margin: 0; border-radius: 8px; font-size: 12px; color: var(--danger); display: inline-flex; align-items: center; gap: 5px;" data-id="${r.id}">${trashSVG} Eliminar</button>
        </div>
      `;

      card.querySelector('.card-click-area').addEventListener('click', () => abrirDetalleReceta(r));
      card.querySelector('.btn-edit-receta').addEventListener('click', (e) => { e.stopPropagation(); abrirEdicionReceta(r); });
      card.querySelector('.btn-delete-receta').addEventListener('click', async (e) => {
        e.stopPropagation();
        if (confirm(`¿Eliminar "${r.nombre}"?`)) { await supabase.from('recetas').delete().eq('id', r.id); cargarRecetas(); }
      });

      grid.appendChild(card);
    });
  }

  function abrirEdicionReceta(r) {
    resetFormulario();
    recetaEditandoId = r.id;
    formTitle.innerText = "Editar Receta";
    btnSubmit.innerText = "Actualizar Receta";

    container.querySelector('#recetaNombre').value = r.nombre || '';
    container.querySelector('#recetaTiempo').value = r.tiempo_preparacion || 15;
    container.querySelector('#recetaIngredientes').value = r.ingredientes || '';
    container.querySelector('#recetaPasos').value = r.pasos || '';

    const catsGuardadas = (r.categorias || '').split(',');
    container.querySelectorAll('.chk-cat').forEach(chk => {
      chk.checked = catsGuardadas.includes(chk.value);
    });

    if (r.imagen_url) {
      if (r.imagen_url.startsWith('data:image')) imagenBase64 = r.imagen_url;
      else inputUrl.value = r.imagen_url;
      imgPreview.src = r.imagen_url;
      previewContainer.classList.remove('hidden');
    }

    modalForm.classList.remove('hidden');
    modalForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function abrirDetalleReceta(r) {
    const imgHtml = r.imagen_url ? `<img src="${r.imagen_url}" alt="${r.nombre}" style="width: 100%; max-height: 240px; object-fit: cover; border-radius: 16px; margin-bottom: 16px;" />` : '';
    const ingredientesHtml = r.ingredientes ? r.ingredientes.split('\n').map(i => `<li style="margin-bottom: 6px;">${i}</li>`).join('') : '<p style="color: var(--text-muted); font-size: 13px;">Sin ingredientes.</p>';
    const pasosHtml = r.pasos ? r.pasos.split('\n').map(p => `<p style="margin-bottom: 8px; line-height: 1.5;">${p}</p>`).join('') : '<p style="color: var(--text-muted); font-size: 13px;">Sin pasos.</p>';

    contenidoDetalle.innerHTML = `
      ${imgHtml}
      <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 8px;">
        <h2 style="margin: 0; font-size: 22px; font-weight: 800; color: var(--primary);">${r.nombre}</h2>
        <button id="btnEditFromDetail" class="btn-outline" style="width: auto; padding: 6px 12px; margin: 0; border-radius: 8px; font-size: 12px; display: inline-flex; align-items: center; gap: 5px;">${editSVG} Editar</button>
      </div>
      <div style="font-size: 13px; font-weight: 700; color: var(--text-muted); margin-bottom: 20px;">⏱️ ${r.tiempo_preparacion || 15} min • Apto para: ${r.categorias || 'Comida'}</div>

      <div style="margin-bottom: 20px;">
        <h4 style="margin: 0 0 10px 0; font-size: 15px; font-weight: 700; color: var(--text-main); border-bottom: 1px solid var(--border); padding-bottom: 6px;">🛒 Ingredientes</h4>
        <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: var(--text-main);">${ingredientesHtml}</ul>
      </div>

      <div>
        <h4 style="margin: 0 0 10px 0; font-size: 15px; font-weight: 700; color: var(--text-main); border-bottom: 1px solid var(--border); padding-bottom: 6px;">👨‍🍳 Pasos</h4>
        <div style="font-size: 14px; color: var(--text-main);">${pasosHtml}</div>
      </div>
    `;

    contenidoDetalle.querySelector('#btnEditFromDetail').addEventListener('click', () => {
      modalDetalle.classList.remove('visible');
      abrirEdicionReceta(r);
    });

    modalDetalle.classList.add('visible');
  }

  formReceta.addEventListener('submit', async (e) => {
    e.preventDefault();
    formErrorMsg.style.display = 'none';
    btnSubmit.disabled = true;

    try {
      const nombre = container.querySelector('#recetaNombre').value.trim();
      const tiempo = parseInt(container.querySelector('#recetaTiempo').value) || 15;
      const urlEscrita = inputUrl.value.trim();
      const finalImagenUrl = imagenBase64 || urlEscrita || null;
      const ingredientes = container.querySelector('#recetaIngredientes').value.trim();
      const pasos = container.querySelector('#recetaPasos').value.trim();

      const seleccionadas = [];
      container.querySelectorAll('.chk-cat:checked').forEach(c => seleccionadas.push(c.value));
      const categoriasStr = seleccionadas.length > 0 ? seleccionadas.join(',') : 'Comida,Cena';

      const payload = {
        user_id: usuarioActual.id,
        nombre,
        tiempo_preparacion: tiempo,
        imagen_url: finalImagenUrl,
        ingredientes,
        pasos,
        categorias: categoriasStr
      };

      if (recetaEditandoId) {
        const { error } = await supabase.from('recetas').update(payload).eq('id', recetaEditandoId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('recetas').insert([payload]);
        if (error) throw error;
      }

      resetFormulario();
      modalForm.classList.add('hidden');
      cargarRecetas();
    } catch (err) {
      formErrorMsg.innerText = "Error: " + err.message;
      formErrorMsg.style.display = 'block';
    } finally {
      btnSubmit.disabled = false;
    }
  });

  cargarRecetas();
  return container;
}