import { supabase } from '../supabase.js';
import { icons } from '../icons.js';

export function renderRecetasView(usuarioActual, abrirFormularioInicial = false) {
  const container = document.createElement('div');
  container.className = 'recetas-page-container';

  let recetas = [];
  let busqueda = '';
  let imagenBase64 = null;
  let recetaEditandoId = null;
  let recetaABorrarId = null;

  container.innerHTML = `
  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
        <div>
          <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: var(--primary); display: flex; align-items: center; gap: 10px;">
            <span style="display: flex; align-items: center; color: var(--primary);">${icons.recetas}</span>
            <span>Mis Recetas</span>
          </h1>
          <p style="margin: 4px 0 0 0; font-size: 13px; color: var(--text-muted);">Gestiona tus platos y preparaciones favoritas</p>
        </div>

        <button id="btnNuevaReceta" style="width: auto; padding: 8px 16px; margin: 0; border-radius: 10px; font-weight: 700; font-size: 13px; display: flex; align-items: center; gap: 6px;">
          <span style="font-size: 16px;">+</span> Añadir receta
        </button>
  </div>

    <div style="position: relative; width: 100%; margin-bottom: 20px;">
      <div style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); display: flex; align-items: center; pointer-events: none; color: var(--text-muted);">
        ${icons.search}
      </div>
      <input type="text" id="inputBuscar" placeholder="Buscar por nombre o ingrediente..." style="padding-left: 42px; margin-top: 0; height: 42px; border-radius: 12px; font-size: 14px;" />
    </div>

    <!-- FORMULARIO CREAR Y EDITAR -->
    <div id="modalFormReceta" class="card hidden" style="margin-bottom: 24px; border: 2px solid var(--primary-light);">
      <h3 id="formTitle" style="margin-top: 0; margin-bottom: 14px; font-weight: 800; color: var(--primary); font-size: 16px;">Crear Nueva Receta</h3>
      
      <form id="formReceta" style="display: flex; flex-direction: column; gap: 12px;">
        <div>
          <label style="font-size: 12px; font-weight: 700; color: var(--text-muted);">Nombre de la receta *</label>
          <input type="text" id="recetaNombre" placeholder="Ej: Pollo al curry con arroz" required />
        </div>

        <!-- VISIBILIDAD PÚBLICA / PRIVADA -->
        <div style="padding: 10px 14px; background: var(--input-bg); border-radius: 12px; border: 1px solid var(--border);">
          <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; margin: 0; font-size: 13px; font-weight: 700; color: var(--text-main);">
            <input type="checkbox" id="chkEsPublica" style="width: 18px; height: 18px; accent-color: var(--primary); margin:0;" />
            <span>🌐 Hacer pública esta receta para la comunidad</span>
          </label>
          <p style="margin: 4px 0 0 28px; font-size: 11px; color: var(--text-muted);">Tus seguidores podrán verla e importarla a su perfil.</p>
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
          <img id="imgPreview" src="" alt="Vista previa" style="max-height: 100px; border-radius: 10px; border: 1px solid var(--border);" />
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
          <button type="button" id="btnCancelarForm" class="btn-outline" style="width: auto; margin:0; padding: 8px 16px;">Cancelar</button>
          <button type="submit" id="btnSubmitReceta" style="width: auto; margin:0; padding: 8px 18px;">Guardar Receta</button>
        </div>
      </form>
    </div>

    <!-- TARJETAS COMPACTAS Y MÁS PEQUEÑAS (minmax de 200px) -->
    <div id="gridRecetas" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 14px;"></div>

    <div id="modalDetalleReceta" class="sidebar-overlay">
      <div class="card modal-dialog-content" style="max-width: 480px; width: 92%; margin: 40px auto; max-height: 85vh; overflow-y: auto; padding: 20px; position: relative; border-radius: 20px;">
        <button id="btnCloseDetalle" style="position: absolute; top: 14px; right: 14px; width: 28px; height: 28px; background: var(--input-bg); border: 1px solid var(--border); border-radius: 50%; font-size: 14px; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; justify-content: center; margin: 0; padding: 0; z-index: 10;">✕</button>
        <div id="contenidoDetalle"></div>
      </div>
    </div>

    <!-- MODAL CONFIRMACIÓN ELIMINAR RECETA (DISEÑO FORMAL DE BITELIFE) -->
    <div id="modalConfirmarEliminarReceta" class="sidebar-overlay">
      <div class="card" style="max-width: 380px; width: 90%; margin: 120px auto; padding: 24px; border-radius: 20px; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.15);">
        <div style="width: 52px; height: 52px; border-radius: 50%; background: #fee2e2; color: var(--danger); display: inline-flex; align-items: center; justify-content: center; margin-bottom: 14px;">
          ${icons.trash || '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>'}
        </div>
        <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 800; color: var(--text-main);">¿Eliminar esta receta?</h3>
        <p id="lblNombreRecetaBorrar" style="margin: 0 0 20px 0; font-size: 13px; color: var(--text-muted); line-height: 1.5;">
          Esta acción quitará la receta de tu recetario personal de forma permanente.
        </p>
        <div style="display: flex; gap: 10px; justify-content: center;">
          <button id="btnCancelarBorrarReceta" class="btn-outline" style="width: 50%; margin: 0; padding: 10px; font-size: 13px; font-weight: 700; border-radius: 10px;">Cancelar</button>
          <button id="btnConfirmarBorrarReceta" class="btn-primary" style="width: 50%; margin: 0; padding: 10px; font-size: 13px; font-weight: 700; border-radius: 10px; background: var(--danger); border-color: var(--danger);">Sí, eliminar</button>
        </div>
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
  const chkEsPublica = container.querySelector('#chkEsPublica');

  const modalDetalle = container.querySelector('#modalDetalleReceta');
  const contenidoDetalle = container.querySelector('#contenidoDetalle');
  const btnCloseDetalle = container.querySelector('#btnCloseDetalle');

  const modalBorrar = container.querySelector('#modalConfirmarEliminarReceta');
  const lblNombreBorrar = container.querySelector('#lblNombreRecetaBorrar');
  const btnCancelarBorrar = container.querySelector('#btnCancelarBorrarReceta');
  const btnConfirmarBorrar = container.querySelector('#btnConfirmarBorrarReceta');

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
    chkEsPublica.checked = false;
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

  // EVENTOS PARA EL MODAL DE BORRADO
  btnCancelarBorrar.addEventListener('click', () => {
    modalBorrar.classList.remove('visible');
    recetaABorrarId = null;
  });

  modalBorrar.addEventListener('click', (e) => {
    if (e.target === modalBorrar) {
      modalBorrar.classList.remove('visible');
      recetaABorrarId = null;
    }
  });

  btnConfirmarBorrar.addEventListener('click', async () => {
    if (!recetaABorrarId) return;

    btnConfirmarBorrar.disabled = true;
    btnConfirmarBorrar.innerText = 'Eliminando...';

    await supabase.from('recetas').delete().eq('id', recetaABorrarId);

    modalBorrar.classList.remove('visible');
    btnConfirmarBorrar.disabled = false;
    btnConfirmarBorrar.innerText = 'Sí, eliminar';
    recetaABorrarId = null;

    cargarRecetas();
  });

  async function cargarRecetas() {
    const { data, error } = await supabase.from('recetas').select('*').eq('user_id', usuarioActual.id).order('created_at', { ascending: false });
    if (!error && data) { recetas = data; renderGrid(); }
  }

  function renderGrid() {
    const filtradas = recetas.filter(r => r.nombre.toLowerCase().includes(busqueda) || (r.ingredientes && r.ingredientes.toLowerCase().includes(busqueda)));
    grid.innerHTML = '';

    if (filtradas.length === 0) {
      grid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 30px 20px; color: var(--text-muted);"><p style="margin: 0; font-size: 14px; font-weight: 600;">No se encontraron recetas.</p></div>`;
      return;
    }

    filtradas.forEach(r => {
      const card = document.createElement('div');
      card.className = 'card';
      card.style.cssText = 'padding: 12px; border-radius: 14px; display: flex; flex-direction: column; justify-content: space-between; cursor: pointer; transition: transform 0.2s;';

      const imgHtml = r.imagen_url 
        ? `<img src="${r.imagen_url}" alt="${r.nombre}" style="width: 100%; height: 110px; object-fit: cover; border-radius: 10px; margin-bottom: 8px;" />` 
        : `<div style="width: 100%; height: 80px; background: var(--primary-light); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: var(--primary); margin-bottom: 8px;">${icons.recetas}</div>`;

      const badgeVisibilidad = r.es_publica 
        ? `<span style="font-size: 10px; font-weight: 800; color: var(--primary); background: var(--primary-light); padding: 2px 6px; border-radius: 12px; display: inline-flex; align-items: center; gap: 3px; margin-bottom: 4px;">${icons.globe} Pública</span>`
        : `<span style="font-size: 10px; font-weight: 800; color: var(--text-muted); background: var(--input-bg); padding: 2px 6px; border-radius: 12px; display: inline-flex; align-items: center; gap: 3px; margin-bottom: 4px;">${icons.lock} Privada</span>`;

      card.innerHTML = `
        <div class="card-click-area">
          ${imgHtml}
          ${badgeVisibilidad}
          <h3 style="margin: 2px 0 4px 0; font-size: 14px; font-weight: 800; color: var(--text-main); line-height: 1.2;">${r.nombre}</h3>
          <p style="margin: 0 0 6px 0; font-size: 11px; color: var(--text-muted); font-weight: 600; display: flex; align-items: center; gap: 4px;">
            ${icons.time} ${r.tiempo_preparacion || 15} min • ${r.categorias || 'Comida'}
          </p>
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 6px; margin-top: 6px;">
          <button class="btn-edit-receta btn-outline" style="width: auto; padding: 4px 8px; margin: 0; border-radius: 6px; font-size: 11px; display: inline-flex; align-items: center; gap: 4px;" data-id="${r.id}">${icons.edit} Editar</button>
          <button class="btn-delete-receta btn-outline" style="width: auto; padding: 4px 8px; margin: 0; border-radius: 6px; font-size: 11px; color: var(--danger); display: inline-flex; align-items: center; gap: 4px;" data-id="${r.id}">${icons.trash} Eliminar</button>
        </div>
      `;

      card.querySelector('.card-click-area').addEventListener('click', () => abrirDetalleReceta(r));
      card.querySelector('.btn-edit-receta').addEventListener('click', (e) => { e.stopPropagation(); abrirEdicionReceta(r); });
      card.querySelector('.btn-delete-receta').addEventListener('click', (e) => {
        e.stopPropagation();
        recetaABorrarId = r.id;
        lblNombreBorrar.innerText = `¿Seguro que deseas eliminar "${r.nombre}"?`;
        modalBorrar.classList.add('visible');
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
    chkEsPublica.checked = !!r.es_publica;

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
    const imgHtml = r.imagen_url ? `<img src="${r.imagen_url}" alt="${r.nombre}" style="width: 100%; max-height: 200px; object-fit: cover; border-radius: 12px; margin-bottom: 14px;" />` : '';
    const ingredientesHtml = r.ingredientes ? r.ingredientes.split('\n').map(i => `<li style="margin-bottom: 4px;">${i}</li>`).join('') : '<p style="color: var(--text-muted); font-size: 12px;">Sin ingredientes.</p>';
    const pasosHtml = r.pasos ? r.pasos.split('\n').map(p => `<p style="margin-bottom: 6px; line-height: 1.4;">${p}</p>`).join('') : '<p style="color: var(--text-muted); font-size: 12px;">Sin pasos.</p>';

    const estadoTexto = r.es_publica ? `${icons.globe} Receta pública (visible para la comunidad)` : `${icons.lock} Receta privada`;

    contenidoDetalle.innerHTML = `
      ${imgHtml}
      <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; margin-bottom: 6px;">
        <h2 style="margin: 0; font-size: 18px; font-weight: 800; color: var(--primary);">${r.nombre}</h2>
        <button id="btnEditFromDetail" class="btn-outline" style="width: auto; padding: 4px 10px; margin: 0; border-radius: 6px; font-size: 11px; display: inline-flex; align-items: center; gap: 4px;">${icons.edit} Editar</button>
      </div>
      <div style="font-size: 12px; font-weight: 700; color: var(--text-muted); margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">${icons.time} ${r.tiempo_preparacion || 15} min • Apto para: ${r.categorias || 'Comida'}</div>
      <div style="font-size: 11px; font-weight: 600; color: var(--primary); margin-bottom: 16px; display: flex; align-items: center; gap: 6px;">${estadoTexto}</div>

      <div style="margin-bottom: 16px;">
        <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 700; color: var(--text-main); border-bottom: 1px solid var(--border); padding-bottom: 4px; display: flex; align-items: center; gap: 6px;">
          ${icons.cart} Ingredientes
        </h4>
        <ul style="margin: 0; padding-left: 18px; font-size: 13px; color: var(--text-main);">${ingredientesHtml}</ul>
      </div>

      <div>
        <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 700; color: var(--text-main); border-bottom: 1px solid var(--border); padding-bottom: 4px; display: flex; align-items: center; gap: 6px;">
          ${icons.chef} Pasos
        </h4>
        <div style="font-size: 13px; color: var(--text-main);">${pasosHtml}</div>
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
      const es_publica = chkEsPublica.checked;

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
        categorias: categoriasStr,
        es_publica
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