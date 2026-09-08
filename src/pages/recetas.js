import { supabase } from '../supabase.js';

export function renderRecetasView(usuarioActual, autoAbrirForm = false) {
  const container = document.createElement('div');
  
  const chefHatSVG = `
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M6 13.8a4.5 4.5 0 1 1 2.61-7.06 5 5 0 0 1 6.78 0A4.5 4.5 0 1 1 18 13.8"></path>
      <path d="M6 13.8h12v3a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-3z"></path>
    </svg>
  `;

  container.innerHTML = `
    <!-- TOP BAR -->
    <div class="top-header">
      <h2 style="margin:0; font-size: 24px;">Mis Recetas</h2>
      
      <div class="search-bar">
        <span>🔍</span>
        <input type="text" id="inputBuscarReceta" placeholder="Buscar recetas...">
      </div>

      <button id="btnNuevaReceta" class="btn-primary-add">+ Añadir receta</button>
    </div>

    <!-- FORMULARIO CREAR / EDITAR RECETA -->
    <div id="formRecetaModal" class="card hidden" style="margin-bottom: 24px;">
      <h3 id="formTitle">Añadir Nueva Receta</h3>
      <input type="text" id="recetaNombre" placeholder="Nombre de la receta (ej: Spaghetti Bolognese)">
      
      <!-- CARGA DE IMAGEN -->
      <div style="margin-top: 8px;">
        <label style="font-size: 13px; color: var(--text-muted); font-weight: 500;">Imagen de la receta (Opcional):</label>
        <input type="file" id="recetaArchivoImg" accept="image/*" style="margin-top: 4px; padding: 8px;">
        <input type="url" id="recetaImagenUrl" placeholder="O pega la URL de la imagen (https://...)" style="margin-top: 6px;">
        
        <div id="previewContainer" class="hidden" style="margin-top: 10px; position: relative;">
          <img id="previewImg" src="" style="width: 100%; height: 160px; object-fit: cover; border-radius: 10px; border: 1px solid var(--border);" />
          <button id="btnQuitarImg" type="button" class="btn-danger" style="position: absolute; top: 8px; right: 8px; width: auto; padding: 4px 8px; font-size: 12px; margin: 0;">Quitar Foto</button>
        </div>
      </div>

      <select id="recetaCategoria" style="margin-top: 12px;">
        <option value="Desayuno">Desayuno</option>
        <option value="Comida">Comida</option>
        <option value="Merienda">Merienda</option>
        <option value="Cena">Cena</option>
        <option value="Postre">Postre</option>
        <option value="Snack">Snack</option>
      </select>
      <input type="number" id="recetaTiempo" placeholder="Tiempo de preparación (minutos)">
      
      <!-- INGREDIENTES Y PASOS SEPARADOS -->
      <textarea id="recetaIngredientes" placeholder="Ingredientes (ej: 200g pasta, 100g carne picada...)" rows="3" style="margin-top: 8px;"></textarea>
      <textarea id="recetaPasos" placeholder="Pasos de preparación (ej: 1. Hervir agua...)" rows="4" style="margin-top: 8px;"></textarea>
      
      <div style="display: flex; gap: 10px; margin-top: 12px;">
        <button id="btnGuardar" class="btn-primary-add" style="flex:1;">Guardar</button>
        <button id="btnCancelar" class="btn-primary-add" style="background:var(--danger); flex:1;">Cancelar</button>
      </div>
    </div>

    <!-- GRID DE TARJETAS -->
    <div class="recipes-grid" id="gridRecetas">Cargando recetas...</div>

    <!-- MODAL DETALLE DE RECETA -->
    <div id="modalDetalleReceta" class="card hidden" style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 200; width: 90%; max-width: 500px; max-height: 85vh; overflow-y: auto; box-shadow: 0 10px 25px rgba(0,0,0,0.3);">
      <div id="detalleContenido"></div>
      <div style="display: flex; gap: 8px; margin-top: 16px; flex-wrap: wrap;">
        <button id="btnEditarReceta" class="btn-secondary" style="flex: 1; margin: 0;">Editar</button>
        <button id="btnEliminarReceta" class="btn-danger" style="flex: 1; margin: 0;">Eliminar</button>
        <button id="btnCerrarDetalle" class="btn-outline" style="flex: 1; margin: 0;">Cerrar</button>
      </div>
    </div>

    <!-- MODAL CONFIRMACIÓN -->
    <div id="modalConfirmacion" class="card hidden" style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 300; width: 90%; max-width: 380px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
      <div style="font-size: 40px; margin-bottom: 8px;">🗑️</div>
      <h3 style="margin: 0 0 8px 0; font-size: 18px;" id="confirmTitle">¿Eliminar receta?</h3>
      <p style="color: var(--text-muted); font-size: 14px; margin-bottom: 20px;" id="confirmMessage">Esta acción no se puede deshacer.</p>
      
      <div style="display: flex; gap: 10px;">
        <button id="btnConfirmarAccion" class="btn-danger" style="flex: 1; margin: 0;">Eliminar</button>
        <button id="btnCancelarAccion" class="btn-outline" style="flex: 1; margin: 0;">Cancelar</button>
      </div>
    </div>

    <div id="backdropModal" class="hidden" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(2px); z-index: 150;"></div>
  `;

  let recetasCache = [];
  let recetaSeleccionada = null;
  let modoEdicionId = null;
  let imagenBase64Cargada = null;

  async function cargarRecetas() {
    const grid = container.querySelector('#gridRecetas');
    const { data, error } = await supabase.from('recetas').select('*').order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      grid.innerHTML = '<p style="color: var(--text-muted);">No tienes recetas aún. ¡Crea la primera!</p>';
      return;
    }

    recetasCache = data;
    renderGrid(recetasCache);
  }

  function renderGrid(lista) {
    const grid = container.querySelector('#gridRecetas');
    if (lista.length === 0) {
      grid.innerHTML = '<p style="color: var(--text-muted);">No se encontraron recetas.</p>';
      return;
    }

    grid.innerHTML = '';
    lista.forEach(r => {
      const card = document.createElement('div');
      card.className = 'recipe-card';
      
      const imgUrl = obtenerImagenUrl(r);

      const imgHtml = imgUrl 
        ? `<img class="recipe-img" src="${imgUrl}" alt="${r.nombre}" />`
        : `<div class="recipe-img" style="display:flex; align-items:center; justify-content:center; background: var(--input-bg); border-bottom: 1px solid var(--border);">${chefHatSVG}</div>`;

      card.innerHTML = `
        ${imgHtml}
        <div class="recipe-info">
          <h4 class="recipe-title">${r.nombre}</h4>
          <div class="recipe-meta">⏱️ ${r.tiempo_preparacion || 15} min • ${r.categoria || 'General'}</div>
        </div>
      `;

      card.addEventListener('click', () => abrirDetalle(r));
      grid.appendChild(card);
    });
  }

  function obtenerImagenUrl(receta) {
    if (receta.imagen_url) return receta.imagen_url;
    if (receta.imagen) return receta.imagen;
    if (receta.pasos && receta.pasos.includes('[Imagen: ')) {
      const match = receta.pasos.match(/\[Imagen:\s*([^\]]+)\]/);
      if (match && match[1]) return match[1];
    }
    return null;
  }

  // Parsear texto para extraer ingredientes y preparación de forma independiente
  function parsearContenido(receta) {
    let raw = receta.pasos ? receta.pasos.replace(/\[Imagen:\s*[^\]]+\]/g, '').trim() : '';
    let ingredientes = '';
    let pasos = raw;

    if (raw.includes('---INGREDIENTES---')) {
      const partes = raw.split('---PASOS---');
      ingredientes = partes[0].replace('---INGREDIENTES---', '').trim();
      pasos = partes[1] ? partes[1].trim() : '';
    }

    return { ingredientes, pasos };
  }

  function abrirDetalle(receta) {
    recetaSeleccionada = receta;
    const detalle = container.querySelector('#detalleContenido');
    const imgUrl = obtenerImagenUrl(receta);
    const { ingredientes, pasos } = parsearContenido(receta);
    
    const imgHeader = imgUrl 
      ? `<img src="${imgUrl}" style="width:100%; height:200px; object-fit:cover; border-radius:12px; margin-bottom:12px;" />`
      : `<div style="width:100%; height:140px; display:flex; align-items:center; justify-content:center; background:var(--input-bg); border-radius:12px; margin-bottom:12px;">${chefHatSVG}</div>`;

    let htmlIngredientes = ingredientes 
      ? `<h4 style="margin: 12px 0 6px 0; font-size: 15px; color: var(--primary);">🥕 Ingredientes:</h4>
         <p style="font-size: 14px; white-space: pre-line; color: var(--text-main); margin: 0 0 12px 0;">${ingredientes}</p>`
      : '';

    detalle.innerHTML = `
      ${imgHeader}
      <h2 style="margin: 0 0 6px 0; font-size: 20px;">${receta.nombre}</h2>
      <p style="color: var(--text-muted); font-size: 13px; margin-bottom: 12px;">⏱️ ${receta.tiempo_preparacion || 15} min • Categoría: ${receta.categoria || 'General'}</p>
      <hr style="border: none; border-top: 1px solid var(--border); margin: 12px 0;">
      ${htmlIngredientes}
      <h4 style="margin: 0 0 6px 0; font-size: 15px; color: var(--primary);">👨‍🍳 Preparación:</h4>
      <p style="font-size: 14px; white-space: pre-line; color: var(--text-main); margin: 0;">${pasos || 'Sin instrucciones adicionales.'}</p>
    `;

    container.querySelector('#modalDetalleReceta').classList.remove('hidden');
    container.querySelector('#backdropModal').classList.remove('hidden');
  }

  function cerrarModales() {
    container.querySelector('#modalDetalleReceta').classList.add('hidden');
    container.querySelector('#modalConfirmacion').classList.add('hidden');
    container.querySelector('#backdropModal').classList.add('hidden');
  }

  function abrirFormularioEdicion(receta) {
    modoEdicionId = receta.id;
    container.querySelector('#formTitle').innerText = 'Editar Receta';
    container.querySelector('#recetaNombre').value = receta.nombre || '';
    
    const imgUrl = obtenerImagenUrl(receta);
    if (imgUrl) {
      if (imgUrl.startsWith('data:image')) {
        imagenBase64Cargada = imgUrl;
        mostrarPreview(imgUrl);
      } else {
        container.querySelector('#recetaImagenUrl').value = imgUrl;
        mostrarPreview(imgUrl);
      }
    } else {
      ocultarPreview();
    }

    container.querySelector('#recetaCategoria').value = receta.categoria || 'Comida';
    container.querySelector('#recetaTiempo').value = receta.tiempo_preparacion || '';
    
    const { ingredientes, pasos } = parsearContenido(receta);
    container.querySelector('#recetaIngredientes').value = ingredientes;
    container.querySelector('#recetaPasos').value = pasos;
    
    cerrarModales();
    container.querySelector('#formRecetaModal').classList.remove('hidden');
  }

  function resetFormulario() {
    modoEdicionId = null;
    imagenBase64Cargada = null;
    container.querySelector('#formTitle').innerText = 'Añadir Nueva Receta';
    container.querySelector('#recetaNombre').value = '';
    container.querySelector('#recetaArchivoImg').value = '';
    container.querySelector('#recetaImagenUrl').value = '';
    container.querySelector('#recetaTiempo').value = '';
    container.querySelector('#recetaIngredientes').value = '';
    container.querySelector('#recetaPasos').value = '';
    ocultarPreview();
  }

  function mostrarPreview(src) {
    const previewContainer = container.querySelector('#previewContainer');
    const previewImg = container.querySelector('#previewImg');
    previewImg.src = src;
    previewContainer.classList.remove('hidden');
  }

  function ocultarPreview() {
    container.querySelector('#previewContainer').classList.add('hidden');
    container.querySelector('#previewImg').src = '';
    container.querySelector('#recetaArchivoImg').value = '';
    container.querySelector('#recetaImagenUrl').value = '';
    imagenBase64Cargada = null;
  }

  function mostrarModalConfirmacion(titulo, mensaje, accionConfirmar) {
    container.querySelector('#confirmTitle').innerText = titulo;
    container.querySelector('#confirmMessage').innerText = mensaje;
    
    const btnConfirm = container.querySelector('#btnConfirmarAccion');
    const newBtn = btnConfirm.cloneNode(true);
    btnConfirm.parentNode.replaceChild(newBtn, btnConfirm);
    
    newBtn.addEventListener('click', async () => {
      await accionConfirmar();
      cerrarModales();
    });

    container.querySelector('#modalConfirmacion').classList.remove('hidden');
    container.querySelector('#backdropModal').classList.remove('hidden');
  }

  setTimeout(() => {
    const modalForm = container.querySelector('#formRecetaModal');
    
    if (autoAbrirForm) modalForm.classList.remove('hidden');

    container.querySelector('#recetaArchivoImg').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          imagenBase64Cargada = event.target.result;
          container.querySelector('#recetaImagenUrl').value = '';
          mostrarPreview(imagenBase64Cargada);
        };
        reader.readAsDataURL(file);
      }
    });

    container.querySelector('#recetaImagenUrl').addEventListener('input', (e) => {
      const url = e.target.value.trim();
      if (url) {
        imagenBase64Cargada = null;
        mostrarPreview(url);
      } else if (!imagenBase64Cargada) {
        ocultarPreview();
      }
    });

    container.querySelector('#btnQuitarImg').addEventListener('click', ocultarPreview);

    container.querySelector('#btnNuevaReceta').addEventListener('click', () => {
      resetFormulario();
      modalForm.classList.remove('hidden');
    });

    container.querySelector('#btnCancelar').addEventListener('click', () => {
      modalForm.classList.add('hidden');
      resetFormulario();
    });

    container.querySelector('#btnCerrarDetalle').addEventListener('click', cerrarModales);
    container.querySelector('#btnCancelarAccion').addEventListener('click', cerrarModales);
    container.querySelector('#backdropModal').addEventListener('click', cerrarModales);

    // EDITAR
    container.querySelector('#btnEditarReceta').addEventListener('click', () => {
      if (recetaSeleccionada) abrirFormularioEdicion(recetaSeleccionada);
    });

    // ELIMINAR
    container.querySelector('#btnEliminarReceta').addEventListener('click', () => {
      if (!recetaSeleccionada) return;

      mostrarModalConfirmacion(
        `¿Eliminar "${recetaSeleccionada.nombre}"?`,
        "Se borrará de forma permanente de tu biblioteca.",
        async () => {
          await supabase.from('plan_semanal').delete().eq('receta_id', recetaSeleccionada.id);
          const { error } = await supabase.from('recetas').delete().eq('id', recetaSeleccionada.id);

          if (error) {
            alert("Error al eliminar: " + error.message);
          } else {
            cargarRecetas();
          }
        }
      );
    });

    // GUARDAR (CREAR O ACTUALIZAR SEPARANDO INGREDIENTES Y PASOS)
    container.querySelector('#btnGuardar').addEventListener('click', async () => {
      const nombre = container.querySelector('#recetaNombre').value.trim();
      const urlInput = container.querySelector('#recetaImagenUrl').value.trim();
      const categoria = container.querySelector('#recetaCategoria').value;
      const tiempo_preparacion = container.querySelector('#recetaTiempo').value;
      const ingredientes = container.querySelector('#recetaIngredientes').value.trim();
      const pasos = container.querySelector('#recetaPasos').value.trim();

      if (!nombre) return alert("Escribe el nombre de la receta.");

      const imagenFinal = imagenBase64Cargada || urlInput || null;

      // Unificamos el bloque de texto reteniendo las etiquetas internas
      let contenidoEstructurado = `---INGREDIENTES---\n${ingredientes}\n\n---PASOS---\n${pasos}`;
      if (imagenFinal) {
        contenidoEstructurado += `\n\n[Imagen: ${imagenFinal}]`;
      }

      const payload = {
        nombre,
        categoria,
        tiempo_preparacion: tiempo_preparacion ? parseInt(tiempo_preparacion) : null,
        pasos: contenidoEstructurado
      };

      let res;
      if (modoEdicionId) {
        res = await supabase.from('recetas').update(payload).eq('id', modoEdicionId);
      } else {
        res = await supabase.from('recetas').insert([{ ...payload, user_id: usuarioActual.id }]);
      }

      if (res.error) {
        alert("Error al guardar: " + res.error.message);
      } else {
        modalForm.classList.add('hidden');
        resetFormulario();
        cargarRecetas();
      }
    });

    // BUSCADOR
    container.querySelector('#inputBuscarReceta').addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      const filtradas = recetasCache.filter(r => r.nombre.toLowerCase().includes(query));
      renderGrid(filtradas);
    });

    cargarRecetas();
  }, 0);

  return container;
}