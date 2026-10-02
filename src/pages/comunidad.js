import { supabase } from '../supabase.js';
import { icons } from '../icons.js';
import { renderPerfilView } from './perfil.js';

let cacheComunidadMemoria = null;

export function renderComunidadView(usuarioActual, onRecetaImportada) {
  const container = document.createElement('div');
  container.className = 'container';

  let categoriaFiltro = 'Todos';
  let paginaActual = 1;
  const recetasPorPagina = 12;
  let totalPaginas = 1;

  const listaCategorias = [
    'Todos', 
    'Desayuno', 
    'Comida', 
    'Cena', 
    'Salsas', 
    'Postre', 
    'Batidos', 
    'Snack', 
    'Entrantes', 
    'Acompañamientos'
  ];

  container.innerHTML = `
    <!-- CABECERA DE LA PÁGINA -->
    <div style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
      <div>
        <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: var(--primary); display: flex; align-items: center; gap: 10px;">
          <span style="display: flex; align-items: center; color: var(--primary);">${icons.compass || icons.globe}</span>
          <span>Feed de la Comunidad</span>
        </h1>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: var(--text-muted);">Encuentra cocineros y consulta las recetas de los usuarios que te han aceptado</p>
      </div>

      <!-- BUSCADOR -->
      <div style="position: relative; width: 100%; max-width: 320px;">
        <input type="text" id="inputBuscarFeed" placeholder="Buscar cocinero (@usuario) o receta..." style="width: 100%; padding-left: 38px; height: 40px; border-radius: 20px; margin: 0; box-sizing: border-box; border: 1px solid var(--border);" />
        <span style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--text-muted); display: flex; align-items: center;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        </span>
      </div>
    </div>

    <!-- CHIPS DE FILTRADO DESLICABLES POR CATEGORÍA -->
    <div class="filters-scroll-container" id="contenedorChipsFeed">
      ${listaCategorias.map(cat => `
        <button class="filter-chip ${cat === 'Todos' ? 'active' : ''}" data-cat="${cat}">
          ${cat}
        </button>
      `).join('')}
    </div>

    <!-- SECCIÓN 1: RESULTADOS DE BÚSQUEDA DE COCINEROS -->
    <div id="secUsuariosEncontrados" class="hidden" style="margin-bottom: 28px;">
      <h3 style="margin: 0 0 12px 0; font-size: 15px; font-weight: 800; color: var(--primary); display: flex; align-items: center; gap: 6px;">
        ${icons.users || '👥'} Cocineros encontrados
      </h3>
      <div id="gridUsuariosEncontrados" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 14px;"></div>
    </div>

    <!-- SECCIÓN 2: FEED DE RECETAS DE SEGUIDOS ACEPTADOS -->
    <div id="secFeedRecetas">
      <h3 id="tituloSeccionRecetas" style="margin: 0 0 14px 0; font-size: 15px; font-weight: 800; color: var(--text-main);">
        Recetas de tus cocineros seguidos
      </h3>
      <div id="gridFeed" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 18px; width: 100%;">
        Cargando publicaciones...
      </div>

      <!-- CONTROLES DE PAGINACIÓN -->
      <div id="contenedorPaginacionFeed" style="display: flex; justify-content: center; align-items: center; gap: 12px; margin-top: 24px;">
        <button id="btnPaginaAnteriorFeed" class="btn-outline" style="width: auto; padding: 6px 14px; margin: 0; font-size: 12px; font-weight: 700; border-radius: 8px;" disabled>◀ Anterior</button>
        <span id="lblPaginaInfoFeed" style="font-size: 12px; font-weight: 700; color: var(--text-muted);">Página 1 de 1</span>
        <button id="btnPaginaSiguienteFeed" class="btn-outline" style="width: auto; padding: 6px 14px; margin: 0; font-size: 12px; font-weight: 700; border-radius: 8px;" disabled>Siguiente ▶</button>
      </div>
    </div>

    <!-- MODAL DETALLE DE RECETA DEL FEED -->
    <div id="modalDetalleFeed" class="sidebar-overlay">
      <div class="card modal-dialog-content" style="max-width: 480px; width: 92%; margin: 40px auto; max-height: 85vh; overflow-y: auto; padding: 20px; position: relative; border-radius: 20px;">
        <button id="btnCloseDetalleFeed" style="position: absolute; top: 14px; right: 14px; width: 28px; height: 28px; background: var(--input-bg); border: 1px solid var(--border); border-radius: 50%; font-size: 14px; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; justify-content: center; margin: 0; padding: 0; z-index: 10;">✕</button>
        <div id="contenidoDetalleFeed"></div>
      </div>
    </div>

    <!-- MODAL NOTIFICACIÓN -->
    <div id="modalNotificacionFeed" class="sidebar-overlay">
      <div class="card" style="max-width: 380px; width: 90%; margin: 120px auto; padding: 24px; border-radius: 20px; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.15);">
        <div id="feedModalIcon" style="width: 52px; height: 52px; border-radius: 50%; background: var(--primary-light); color: var(--primary); display: inline-flex; align-items: center; justify-content: center; margin-bottom: 14px;">
          ${icons.check || '✓'}
        </div>
        <h3 id="feedModalTitle" style="margin: 0 0 8px 0; font-size: 18px; font-weight: 800; color: var(--text-main);">¡Notificación!</h3>
        <p id="feedModalMsg" style="margin: 0 0 20px 0; font-size: 13px; color: var(--text-muted); line-height: 1.5;">
          Operación realizada con éxito.
        </p>
        <button id="btnCerrarModalFeed" class="btn-primary" style="width: 100%; margin: 0; padding: 10px; font-size: 13px; font-weight: 700; border-radius: 10px;">Entendido</button>
      </div>
    </div>
  `;

  // ELEMENTOS DEL DOM
  const gridFeed = container.querySelector('#gridFeed');
  const inputBuscar = container.querySelector('#inputBuscarFeed');
  const secUsuarios = container.querySelector('#secUsuariosEncontrados');
  const gridUsuarios = container.querySelector('#gridUsuariosEncontrados');

  const btnPagAnt = container.querySelector('#btnPaginaAnteriorFeed');
  const btnPagSig = container.querySelector('#btnPaginaSiguienteFeed');
  const lblPagInfo = container.querySelector('#lblPaginaInfoFeed');

  const modalDetalle = container.querySelector('#modalDetalleFeed');
  const contenidoDetalle = container.querySelector('#contenidoDetalleFeed');
  const btnCloseDetalle = container.querySelector('#btnCloseDetalleFeed');
  
  const modalNotif = container.querySelector('#modalNotificacionFeed');
  const modalIcon = container.querySelector('#feedModalIcon');
  const modalTitle = container.querySelector('#feedModalTitle');
  const modalMsg = container.querySelector('#feedModalMsg');
  const btnCerrarModal = container.querySelector('#btnCerrarModalFeed');

  btnCerrarModal.addEventListener('click', () => modalNotif.classList.remove('visible'));
  btnCloseDetalle.addEventListener('click', () => modalDetalle.classList.remove('visible'));
  modalDetalle.addEventListener('click', (e) => { if (e.target === modalDetalle) modalDetalle.classList.remove('visible'); });

  // EVENTOS PAGINACIÓN
  btnPagAnt.addEventListener('click', () => {
    if (paginaActual > 1) {
      paginaActual--;
      cargarComunidad(inputBuscar.value, true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  btnPagSig.addEventListener('click', () => {
    if (paginaActual < totalPaginas) {
      paginaActual++;
      cargarComunidad(inputBuscar.value, true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  // NAVEGAR AL PERFIL
  function irAlPerfilCocinero(userId) {
    const appContent = document.querySelector('.main-content');
    if (appContent && userId) {
      appContent.innerHTML = '';
      appContent.appendChild(renderPerfilView(usuarioActual, userId, () => renderComunidadView(usuarioActual, onRecetaImportada)));
    }
  }

  // FILTRADO POR CHIPS
  container.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      container.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      categoriaFiltro = chip.getAttribute('data-cat');
      paginaActual = 1;
      cargarComunidad(inputBuscar.value, true);
    });
  });

  function mostrarAvisoModal(titulo, mensaje, esError = false) {
    modalTitle.innerText = titulo;
    modalMsg.innerText = mensaje;

    if (esError) {
      modalIcon.style.background = '#fee2e2';
      modalIcon.style.color = 'var(--danger)';
      modalIcon.innerHTML = `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
    } else {
      modalIcon.style.background = 'var(--primary-light)';
      modalIcon.style.color = 'var(--primary)';
      modalIcon.innerHTML = `<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    }

    modalNotif.classList.add('visible');
  }

  function abrirDetalleFeed(r, autorPublicador, autorOriginal) {
    const imgHtml = r.imagen_url ? `<img src="${r.imagen_url}" alt="${r.nombre}" style="width: 100%; max-height: 200px; object-fit: cover; border-radius: 12px; margin-bottom: 14px;" />` : '';
    const esCompartida = autorOriginal && autorOriginal.id !== r.user_id;
    const svgRepeat = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg>`;

    contenidoDetalle.innerHTML = `
      ${imgHtml}
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
        <div style="display: flex; align-items: center; gap: 8px; cursor: pointer;" id="btnAbrirPerfilPublicadorModal">
          <div style="width: 28px; height: 28px; border-radius: 50%; background: var(--primary-light); color: var(--primary); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 12px; overflow: hidden;">
            ${autorPublicador.avatar_url ? `<img src="${autorPublicador.avatar_url}" style="width: 100%; height: 100%; object-fit: cover;" />` : (autorPublicador.username || 'U').charAt(0).toUpperCase()}
          </div>
          <span style="font-size: 13px; font-weight: 700; color: var(--primary);">@${autorPublicador.username || 'usuario'}</span>
        </div>
      </div>

      ${esCompartida ? `
        <div id="btnAbrirPerfilOriginalModal" style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 10px; background: var(--primary-light); border-radius: 8px; margin-bottom: 14px; cursor: pointer; border: 1px solid var(--border);">
          <span style="color: var(--primary); display: flex; align-items: center;">${svgRepeat}</span>
          <span style="font-size: 11px; color: var(--text-muted);">Creada por:</span>
          <span style="font-size: 12px; font-weight: 800; color: var(--primary);">@${autorOriginal.username}</span>
        </div>
      ` : ''}

      <h2 style="margin: 0 0 6px 0; font-size: 18px; font-weight: 800; color: var(--primary);">${r.nombre}</h2>
      <div style="font-size: 12px; font-weight: 700; color: var(--text-muted); margin-bottom: 16px; display: flex; align-items: center; gap: 6px;">
        ${icons.time || '⏱'} ${r.tiempo_preparacion || 15} min ${r.categorias ? `• ${r.categorias}` : ''}
      </div>

      <div style="margin-bottom: 16px;">
        <h4 style="margin: 0 0 10px 0; font-size: 14px; font-weight: 700; color: var(--text-main); border-bottom: 1px solid var(--border); padding-bottom: 4px; display: flex; align-items: center; gap: 6px;">
          ${icons.cart || '🛒'} Ingredientes
        </h4>
        <div style="font-size: 13px; color: var(--text-main); line-height: 1.5; white-space: pre-line;">${r.ingredientes || 'Sin ingredientes especificados.'}</div>
      </div>

      <div>
        <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 700; color: var(--text-main); border-bottom: 1px solid var(--border); padding-bottom: 4px; display: flex; align-items: center; gap: 6px;">
          ${icons.chef || '👨‍🍳'} Pasos
        </h4>
        <div style="font-size: 13px; color: var(--text-main); line-height: 1.5; white-space: pre-line;">${r.pasos || 'Sin pasos explicados.'}</div>
      </div>
    `;

    contenidoDetalle.querySelector('#btnAbrirPerfilPublicadorModal').addEventListener('click', () => {
      modalDetalle.classList.remove('visible');
      irAlPerfilCocinero(autorPublicador.id);
    });

    const btnOriginal = contenidoDetalle.querySelector('#btnAbrirPerfilOriginalModal');
    if (btnOriginal) {
      btnOriginal.addEventListener('click', () => {
        modalDetalle.classList.remove('visible');
        irAlPerfilCocinero(autorOriginal.id);
      });
    }

    modalDetalle.classList.add('visible');
  }

  function renderizarListaFeed(recetasFiltradas, mapaPerfiles, misRecetasGuardadas = []) {
    const svgRepeat = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg>`;

    const idsGuardados = new Set();
    misRecetasGuardadas.forEach(myR => {
      if (myR.receta_original_id) idsGuardados.add(myR.receta_original_id);
      if (myR.id) idsGuardados.add(myR.id);
    });

    gridFeed.innerHTML = recetasFiltradas.map(r => {
      const autorPublicador = mapaPerfiles[r.user_id] || {};
      const autorOriginal = r.autor_original_id ? mapaPerfiles[r.autor_original_id] : null;
      const esCompartida = !!autorOriginal && autorOriginal.id !== r.user_id;

      const idReferenciaOriginal = r.receta_original_id || r.id;
      const yaGuardada = idsGuardados.has(r.id) || idsGuardados.has(idReferenciaOriginal);

      const listaIngredientes = r.ingredientes 
        ? r.ingredientes.split('\n').filter(i => i.trim()).slice(0, 3).join(', ') 
        : 'Sin ingredientes especificados';

      const btnGuardarHtml = yaGuardada ? `
        <button disabled class="btn-outline" style="width: 100%; padding: 6px 10px; font-size: 11px; font-weight: 700; border-radius: 10px; margin: 0; display: inline-flex; align-items: center; justify-content: center; gap: 6px; background: var(--input-bg); color: var(--primary); border: 1px solid var(--primary-light); cursor: default; opacity: 0.9;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          <span>Guardada</span>
        </button>
      ` : `
        <button class="btn-importar-receta btn-outline" data-id="${r.id}" style="width: 100%; padding: 6px 10px; font-size: 11px; font-weight: 700; border-radius: 10px; margin: 0; display: inline-flex; align-items: center; justify-content: center; gap: 6px;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
          <span>Guardar en Mis Recetas</span>
        </button>
      `;

      return `
        <div class="card card-receta-feed" data-id="${r.id}" style="padding: 12px; border-radius: 16px; border: 1px solid var(--border); display: flex; flex-direction: column; justify-content: space-between; width: 100%; box-sizing: border-box; cursor: pointer;">
          <div>
            ${r.imagen_url ? `<img src="${r.imagen_url}" style="width: 100%; height: 110px; object-fit: cover; border-radius: 12px; margin-bottom: 10px;" />` : ''}
            
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px; margin-bottom: 6px;">
              <div style="display: flex; align-items: center; gap: 6px; min-width: 0; flex: 1;" class="click-autor-header" data-autorid="${autorPublicador.id}">
                <div style="width: 22px; height: 22px; border-radius: 50%; background: #e6f4f4; color: #2ba8a8; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 10px; overflow: hidden; flex-shrink: 0;">
                  ${autorPublicador.avatar_url ? `<img src="${autorPublicador.avatar_url}" style="width: 100%; height: 100%; object-fit: cover;" />` : (autorPublicador.username || 'U').charAt(0).toUpperCase()}
                </div>
                <span style="font-size: 11px; font-weight: 700; color: #2ba8a8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  @${autorPublicador.username || 'usuario'}
                </span>
              </div>
            </div>

            ${esCompartida ? `
              <div class="click-autor-original" data-autorid="${autorOriginal.id}" style="display: flex; align-items: center; gap: 5px; padding: 4px 8px; background: var(--primary-light); border-radius: 8px; margin-bottom: 8px; cursor: pointer; border: 1px solid var(--border);">
                <span style="color: var(--primary); display: flex; align-items: center;">${svgRepeat}</span>
                <span style="font-size: 10px; color: var(--text-muted); flex-shrink: 0;">Creada por:</span>
                <span style="font-size: 11px; font-weight: 800; color: var(--primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">@${autorOriginal.username || 'usuario'}</span>
              </div>
            ` : ''}

            <h3 style="margin: 0 0 2px 0; font-size: 14px; font-weight: 800; color: var(--text-main);">${r.nombre}</h3>
            <p style="margin: 0 0 6px 0; font-size: 11px; color: var(--text-muted); display: flex; align-items: center; gap: 4px;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              <span>${r.tiempo_preparacion || 15} min</span>
            </p>

            <div style="margin-bottom: 10px; padding: 6px 8px; background: var(--input-bg); border-radius: 8px; border: 1px solid var(--border);">
              <span style="font-size: 10px; font-weight: 800; color: var(--primary); display: flex; align-items: center; gap: 4px;">
                ${icons.cart || '🛒'} Ingredientes:
              </span>
              <p style="margin: 2px 0 0 0; font-size: 10px; color: var(--text-muted); line-height: 1.3; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">
                ${listaIngredientes}
              </p>
            </div>
          </div>

          ${btnGuardarHtml}
        </div>
      `;
    }).join('');

    gridFeed.querySelectorAll('.card-receta-feed').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.btn-importar-receta')) return;
        
        const headerAutor = e.target.closest('.click-autor-header');
        if (headerAutor) {
          e.stopPropagation();
          const aId = headerAutor.getAttribute('data-autorid');
          if (aId) irAlPerfilCocinero(aId);
          return;
        }

        const btnOriginal = e.target.closest('.click-autor-original');
        if (btnOriginal) {
          e.stopPropagation();
          const aId = btnOriginal.getAttribute('data-autorid');
          if (aId) irAlPerfilCocinero(aId);
          return;
        }

        const id = card.getAttribute('data-id');
        const recetaSel = recetasFiltradas.find(item => item.id === id);
        if (recetaSel) {
          abrirDetalleFeed(recetaSel, mapaPerfiles[recetaSel.user_id] || {}, recetaSel.autor_original_id ? mapaPerfiles[recetaSel.autor_original_id] : null);
        }
      });
    });

    gridFeed.querySelectorAll('.btn-importar-receta').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const recetaId = btn.getAttribute('data-id');
        btn.disabled = true;
        btn.innerText = 'Guardando...';

        try {
          const { data: recetaOriginal, error: getErr } = await supabase
            .from('recetas')
            .select('*')
            .eq('id', recetaId)
            .single();

          if (getErr || !recetaOriginal) {
            mostrarAvisoModal('Error', 'No se pudo leer la información de la receta.', true);
            btn.disabled = false;
            btn.innerText = 'Guardar en Mis Recetas';
            return;
          }

          const idCreadorOriginal = recetaOriginal.autor_original_id || recetaOriginal.user_id;
          const idRecetaPadre = recetaOriginal.receta_original_id || recetaOriginal.id;
          const autorCreador = mapaPerfiles[idCreadorOriginal] || {};
          const tagCreador = autorCreador.username ? `@${autorCreador.username}` : 'autor original';
          const nombreLimpio = recetaOriginal.nombre.replace(/\s*\(de @[^)]+\)/gi, '');

          const nuevaRecetaPayload = {
            user_id: usuarioActual.id,
            nombre: nombreLimpio,
            ingredientes: recetaOriginal.ingredientes || '',
            pasos: recetaOriginal.pasos || '',
            tiempo_preparacion: recetaOriginal.tiempo_preparacion || 15,
            imagen_url: recetaOriginal.imagen_url || null,
            categorias: recetaOriginal.categorias || 'Comida',
            es_publica: false,
            receta_original_id: idRecetaPadre,
            autor_original_id: idCreadorOriginal
          };

          const { error: insertErr } = await supabase
            .from('recetas')
            .insert([nuevaRecetaPayload]);

          if (insertErr) {
            mostrarAvisoModal('Error al importar', insertErr.message || 'Error al guardar la receta.', true);
            btn.disabled = false;
            btn.innerText = 'Guardar en Mis Recetas';
            return;
          }

          if (idCreadorOriginal && idCreadorOriginal !== usuarioActual.id) {
            await supabase.from('notificaciones').insert([{
              user_id: idCreadorOriginal,
              emisor_id: usuarioActual.id,
              tipo: 'receta_guardada',
              referencia: nombreLimpio,
              leida: false
            }]);
          }

          mostrarAvisoModal('¡Receta Guardada!', `"${nombreLimpio}" de ${tagCreador} se ha añadido a tus recetas.`);
          cargarComunidad(inputBuscar.value, true);

          if (onRecetaImportada) onRecetaImportada();

        } catch (err) {
          console.error('Error en proceso de importación:', err);
          mostrarAvisoModal('Error inesperado', err.message || 'Error al procesar la importación.', true);
          btn.disabled = false;
          btn.innerText = 'Guardar en Mis Recetas';
        }
      });
    });
  }

  async function cargarComunidad(busqueda = '', forzarRecarga = false) {
    const termino = busqueda.toLowerCase().trim().replace('@', '');
    const hayBusqueda = termino.length > 0;

    // RENDERIZADO DESDE MEMORIA SI NO HAY BÚSQUEDA NI FILTROS
    if (cacheComunidadMemoria && !hayBusqueda && categoriaFiltro === 'Todos' && !forzarRecarga) {
      renderizarListaFeed(cacheComunidadMemoria.recetasFiltradas, cacheComunidadMemoria.mapaPerfiles, cacheComunidadMemoria.misRecetasGuardadas);
      lblPagInfo.innerText = `Página ${paginaActual} de ${cacheComunidadMemoria.totalPaginas || 1}`;
      btnPagAnt.disabled = paginaActual <= 1;
      btnPagSig.disabled = paginaActual >= (cacheComunidadMemoria.totalPaginas || 1);
    } else if (!cacheComunidadMemoria || hayBusqueda || categoriaFiltro !== 'Todos') {
      gridFeed.innerHTML = '<p style="color: var(--text-muted); font-size: 13px;">Cargando publicaciones...</p>';
    }

    try {
      // OBTENER SEGUIDOS Y MIS RECETAS PARALELAMENTE
      const [resRelaciones, resMisRecetas] = await Promise.all([
        supabase.from('seguidores').select('seguido_id, estado').eq('seguidor_id', usuarioActual.id),
        supabase.from('recetas').select('id, receta_original_id').eq('user_id', usuarioActual.id)
      ]);

      if (resRelaciones.error) throw resRelaciones.error;

      const mapaRelaciones = {};
      (resRelaciones.data || []).forEach(rel => {
        mapaRelaciones[rel.seguido_id] = rel.estado || 'aceptado';
      });

      const idsAceptados = Object.keys(mapaRelaciones).filter(id => mapaRelaciones[id] === 'aceptado');
      const misRecetasGuardadas = resMisRecetas.data || [];

      // BUSCADOR DE USUARIOS
      if (hayBusqueda) {
        const { data: perfilesEncontrados } = await supabase
          .from('perfiles')
          .select('id, username, avatar_url, nombre_completo')
          .neq('id', usuarioActual.id)
          .or(`username.ilike.%${termino}%,nombre_completo.ilike.%${termino}%`);

        if (perfilesEncontrados && perfilesEncontrados.length > 0) {
          secUsuarios.classList.remove('hidden');
          gridUsuarios.innerHTML = perfilesEncontrados.map(p => {
            const estado = mapaRelaciones[p.id];
            
            let btnHtml = '';
            if (estado === 'aceptado') {
              btnHtml = `<button class="btn-toggle-seguir btn-outline" data-id="${p.id}" data-estado="aceptado" style="width:auto; padding:5px 12px; font-size:11px; font-weight:700; border-radius:10px; margin:0; color:var(--text-muted);">Siguiendo</button>`;
            } else if (estado === 'pendiente') {
              btnHtml = `<button class="btn-toggle-seguir btn-outline" data-id="${p.id}" data-estado="pendiente" style="width:auto; padding:5px 12px; font-size:11px; font-weight:700; border-radius:10px; margin:0; color:var(--text-muted);">Solicitado</button>`;
            } else {
              btnHtml = `<button class="btn-toggle-seguir btn-primary" data-id="${p.id}" data-estado="ninguno" style="width:auto; padding:6px 14px; font-size:11px; font-weight:700; border-radius:10px; margin:0;">Seguir</button>`;
            }

            return `
              <div class="card card-perfil-item" data-id="${p.id}" style="padding:12px 14px; border-radius:16px; border:1px solid var(--border); display:flex; align-items:center; justify-content:space-between; gap:10px; cursor:pointer;">
                <div style="display:flex; align-items:center; gap:10px; overflow:hidden;" class="area-click-perfil" data-id="${p.id}">
                  <div style="width:38px; height:38px; border-radius:50%; background:#e6f4f4; color:#2ba8a8; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:14px; overflow:hidden; flex-shrink:0;">
                    ${p.avatar_url ? `<img src="${p.avatar_url}" style="width:100%; height:100%; object-fit:cover;" />` : (p.username || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div style="overflow:hidden;">
                    <div style="font-size:13px; font-weight:800; color:var(--text-main); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${p.nombre_completo || p.username}</div>
                    <div style="font-size:11px; font-weight:700; color:#2ba8a8;">@${p.username}</div>
                  </div>
                </div>
                <div>${btnHtml}</div>
              </div>
            `;
          }).join('');

          gridUsuarios.querySelectorAll('.area-click-perfil').forEach(area => {
            area.addEventListener('click', () => irAlPerfilCocinero(area.getAttribute('data-id')));
          });

          // ⚡ EVENTO CONMUTAR SEGUIR / CANCELAR SOLICITUD DESDE EL BUSCADOR
          gridUsuarios.querySelectorAll('.btn-toggle-seguir').forEach(btn => {
            btn.addEventListener('click', async (e) => {
              e.stopPropagation();
              const idTarget = btn.getAttribute('data-id');
              const estadoActual = btn.getAttribute('data-estado');
              btn.disabled = true;

              try {
                if (estadoActual === 'aceptado' || estadoActual === 'pendiente') {
                  // CANCELAR SOLICITUD O DEJAR DE SEGUIR
                  await supabase.from('seguidores')
                    .delete()
                    .eq('seguidor_id', usuarioActual.id)
                    .eq('seguido_id', idTarget);

                  await supabase.from('notificaciones')
                    .delete()
                    .eq('emisor_id', usuarioActual.id)
                    .eq('user_id', idTarget)
                    .eq('tipo', 'solicitud_seguimiento');

                } else {
                  // SEGUIR + NOTIFICAR
                  await supabase.from('seguidores').insert([{
                    seguidor_id: usuarioActual.id,
                    seguido_id: idTarget,
                    estado: 'aceptado'
                  }]);

                  await supabase.from('notificaciones').insert([{
                    user_id: idTarget,
                    emisor_id: usuarioActual.id,
                    tipo: 'solicitud_seguimiento',
                    leida: false
                  }]);
                }

                cargarComunidad(inputBuscar.value, true);
              } catch (err) {
                console.error("Error al conmutar seguimiento desde el buscador:", err);
                btn.disabled = false;
              }
            });
          });

        } else {
          secUsuarios.classList.add('hidden');
        }
      } else {
        secUsuarios.classList.add('hidden');
      }

      if (idsAceptados.length === 0) {
        gridFeed.innerHTML = `
          <div style="grid-column: 1/-1; text-align: center; padding: 30px 20px; background: var(--input-bg); border-radius: 16px; border: 1px dashed var(--border);">
            <p style="margin: 0 0 4px 0; font-size: 14px; font-weight: 800; color: var(--text-main);">Aún no sigues a ningún cocinero</p>
            <p style="margin: 0; font-size: 12px; color: var(--text-muted);">Busca arriba a otros usuarios por su @username y envíales una solicitud de seguimiento.</p>
          </div>
        `;
        lblPagInfo.innerText = "Página 1 de 1";
        btnPagAnt.disabled = true;
        btnPagSig.disabled = true;
        return;
      }

      // CALCULAMOS EL RANGO PARA PAGINACIÓN DE 12 ELEMENTOS
      const desde = (paginaActual - 1) * recetasPorPagina;
      const hasta = desde + recetasPorPagina - 1;

      let query = supabase
        .from('recetas')
        .select('id, user_id, autor_original_id, receta_original_id, nombre, tiempo_preparacion, ingredientes, pasos, categorias, imagen_url', { count: 'exact' })
        .eq('es_publica', true)
        .in('user_id', idsAceptados)
        .order('created_at', { ascending: false });

      if (hayBusqueda) {
        query = query.or(`nombre.ilike.%${termino}%,ingredientes.ilike.%${termino}%`);
      }

      if (categoriaFiltro !== 'Todos') {
        query = query.ilike('categorias', `%${categoriaFiltro}%`);
      }

      const resRecetas = await query.range(desde, hasta);
      if (resRecetas.error) throw resRecetas.error;

      const recetasComunidad = resRecetas.data || [];
      const totalRegistros = resRecetas.count || 0;
      totalPaginas = Math.ceil(totalRegistros / recetasPorPagina) || 1;

      // ACTUALIZAR LEYENDA Y BOTONES
      lblPagInfo.innerText = `Página ${paginaActual} de ${totalPaginas}`;
      btnPagAnt.disabled = paginaActual <= 1;
      btnPagSig.disabled = paginaActual >= totalPaginas;

      if (recetasComunidad.length === 0) {
        gridFeed.innerHTML = '<p style="color: var(--text-muted); font-size: 13px; grid-column: 1/-1;">No hay recetas en esta página.</p>';
        return;
      }

      const idsPerfiles = [...new Set(recetasComunidad.flatMap(r => [r.user_id, r.autor_original_id].filter(Boolean)))];
      const { data: perfiles } = await supabase
        .from('perfiles')
        .select('id, username, avatar_url')
        .in('id', idsPerfiles);

      const mapaPerfiles = {};
      (perfiles || []).forEach(p => { mapaPerfiles[p.id] = p; });

      if (!hayBusqueda && categoriaFiltro === 'Todos') {
        cacheComunidadMemoria = { recetasFiltradas: recetasComunidad, mapaPerfiles, misRecetasGuardadas, totalPaginas };
      }

      renderizarListaFeed(recetasComunidad, mapaPerfiles, misRecetasGuardadas);

    } catch (err) {
      console.error("Error al cargar la comunidad:", err);
      gridFeed.innerHTML = `<p style="color: var(--danger); font-size: 13px; grid-column: 1/-1;">Error al cargar las publicaciones: ${err.message || 'Comprueba tu conexión'}</p>`;
    }
  }

  inputBuscar.addEventListener('input', (e) => {
    paginaActual = 1;
    cargarComunidad(e.target.value);
  });

  cargarComunidad();

  return container;
}