import { supabase } from '../supabase.js';
import { icons } from '../icons.js';

export function renderComunidadView(usuarioActual, onRecetaImportada) {
  const container = document.createElement('div');
  container.className = 'container';

  let categoriaFiltro = 'Todos';
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
    </div>

    <!-- MODAL PERFIL PÚBLICO DEL COCINERO -->
    <div id="modalPerfilCocinero" class="sidebar-overlay">
      <div class="card modal-dialog-content" style="max-width: 520px; width: 92%; margin: 40px auto; max-height: 85vh; overflow-y: auto; padding: 20px; position: relative; border-radius: 20px;">
        <button id="btnClosePerfilCocinero" style="position: absolute; top: 14px; right: 14px; width: 28px; height: 28px; background: var(--input-bg); border: 1px solid var(--border); border-radius: 50%; font-size: 14px; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; justify-content: center; margin: 0; padding: 0; z-index: 10;">✕</button>
        <div id="contenidoPerfilCocinero"></div>
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

  setTimeout(() => {
    const gridFeed = container.querySelector('#gridFeed');
    const inputBuscar = container.querySelector('#inputBuscarFeed');
    const secUsuarios = container.querySelector('#secUsuariosEncontrados');
    const gridUsuarios = container.querySelector('#gridUsuariosEncontrados');

    const modalPerfil = container.querySelector('#modalPerfilCocinero');
    const contenidoPerfil = container.querySelector('#contenidoPerfilCocinero');
    const btnClosePerfil = container.querySelector('#btnClosePerfilCocinero');

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

    btnClosePerfil.addEventListener('click', () => modalPerfil.classList.remove('visible'));
    modalPerfil.addEventListener('click', (e) => { if (e.target === modalPerfil) modalPerfil.classList.remove('visible'); });

    // FILTRADO POR CHIPS DE CATEGORÍA
    container.querySelectorAll('.filter-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        container.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');

        categoriaFiltro = chip.getAttribute('data-cat');
        cargarComunidad(inputBuscar.value);
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

    // ABRIR PERFIL DEL COCINERO
    async function abrirPerfilCocinero(perfil, estadoRelacion) {
      contenidoPerfil.innerHTML = '<p style="color: var(--text-muted); font-size: 13px;">Cargando perfil...</p>';
      modalPerfil.classList.add('visible');

      // Cargar recetas públicas del usuario
      const { data: recetasUsuario } = await supabase
        .from('recetas')
        .select('*')
        .eq('user_id', perfil.id)
        .eq('es_publica', true)
        .order('created_at', { ascending: false });

      const listaRecetas = recetasUsuario || [];

      const gridRecetasPerfil = listaRecetas.length > 0
        ? listaRecetas.map(r => `
            <div class="card" style="padding: 10px; border-radius: 12px; border: 1px solid var(--border); display: flex; flex-direction: column; justify-content: space-between;">
              <div>
                ${r.imagen_url ? `<img src="${r.imagen_url}" style="width: 100%; height: 90px; object-fit: cover; border-radius: 8px; margin-bottom: 6px;" />` : ''}
                <h4 style="margin: 0 0 2px 0; font-size: 13px; font-weight: 800; color: var(--text-main);">${r.nombre}</h4>
                <p style="margin: 0; font-size: 10px; color: var(--text-muted);">⏱ ${r.tiempo_preparacion || 15} min</p>
              </div>
              <button class="btn-importar-perfil btn-outline" data-id="${r.id}" style="width: 100%; padding: 4px 8px; font-size: 10px; font-weight: 700; border-radius: 6px; margin-top: 8px;">
                + Guardar
              </button>
            </div>
          `).join('')
        : '<p style="color: var(--text-muted); font-size: 12px; grid-column: 1/-1;">Este usuario aún no tiene recetas públicas.</p>';

      contenidoPerfil.innerHTML = `
        <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 20px; border-bottom: 1px solid var(--border); padding-bottom: 16px;">
          <div style="width: 52px; height: 52px; border-radius: 50%; background: #e6f4f4; color: #2ba8a8; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 18px; overflow: hidden; flex-shrink: 0;">
            ${perfil.avatar_url ? `<img src="${perfil.avatar_url}" style="width: 100%; height: 100%; object-fit: cover;" />` : (perfil.username || 'U').charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 style="margin: 0 0 2px 0; font-size: 18px; font-weight: 800; color: var(--text-main);">${perfil.nombre_completo || perfil.username}</h2>
            <div style="font-size: 12px; font-weight: 700; color: var(--primary);">@${perfil.username}</div>
            <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">${listaRecetas.length} recetas públicas</div>
          </div>
        </div>

        <h3 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 800; color: var(--text-main);">Recetas públicas</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 10px; margin-bottom: 10px;">
          ${gridRecetasPerfil}
        </div>
      `;

      // Eventos para guardar recetas desde dentro del perfil del usuario
      contenidoPerfil.querySelectorAll('.btn-importar-perfil').forEach(btn => {
        btn.addEventListener('click', async () => {
          const rId = btn.getAttribute('data-id');
          const rSel = listaRecetas.find(item => item.id === rId);
          if (!rSel) return;

          btn.disabled = true;
          btn.innerText = 'Guardando...';

          const payload = {
            user_id: usuarioActual.id,
            nombre: `${rSel.nombre} (de @${perfil.username})`,
            ingredientes: rSel.ingredientes || '',
            pasos: rSel.pasos || '',
            tiempo_preparacion: rSel.tiempo_preparacion || 15,
            imagen_url: rSel.imagen_url || null,
            categorias: rSel.categorias || 'Comida',
            es_publica: false
          };

          const { error } = await supabase.from('recetas').insert([payload]);

          if (!error) {
            btn.innerText = '¡Guardada!';
            if (perfil.id !== usuarioActual.id) {
              await supabase.from('notificaciones').insert([{
                user_id: perfil.id,
                emisor_id: usuarioActual.id,
                tipo: 'receta_guardada',
                referencia: rSel.nombre,
                leida: false
              }]);
            }
            if (onRecetaImportada) onRecetaImportada();
          } else {
            btn.disabled = false;
            btn.innerText = '+ Guardar';
            alert('Error: ' + error.message);
          }
        });
      });
    }

    function abrirDetalleFeed(r, autor) {
      const imgHtml = r.imagen_url ? `<img src="${r.imagen_url}" alt="${r.nombre}" style="width: 100%; max-height: 200px; object-fit: cover; border-radius: 12px; margin-bottom: 14px;" />` : '';

      const listaIngredientesHtml = r.ingredientes
        ? r.ingredientes.split('\n').filter(l => l.trim()).map(l => `
            <div style="display: flex; align-items: flex-start; gap: 8px; margin-bottom: 6px;">
              <span style="color: var(--primary); display: flex; align-items: center; flex-shrink: 0; margin-top: 2px;">
                ${icons.cart || '🛒'}
              </span>
              <span style="font-size: 13px; color: var(--text-main); line-height: 1.4;">${l.trim()}</span>
            </div>
          `).join('')
        : '<p style="color: var(--text-muted); font-size: 12px;">Sin ingredientes especificados.</p>';

      contenidoDetalle.innerHTML = `
        ${imgHtml}
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; cursor: pointer;" id="btnAbrirPerfilDesdeModal">
          <div style="width: 28px; height: 28px; border-radius: 50%; background: var(--primary-light); color: var(--primary); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 12px; overflow: hidden;">
            ${autor.avatar_url ? `<img src="${autor.avatar_url}" style="width: 100%; height: 100%; object-fit: cover;" />` : (autor.username || 'U').charAt(0).toUpperCase()}
          </div>
          <span style="font-size: 13px; font-weight: 700; color: var(--primary);">@${autor.username || 'usuario'}</span>
        </div>

        <h2 style="margin: 0 0 6px 0; font-size: 18px; font-weight: 800; color: var(--primary);">${r.nombre}</h2>
        <div style="font-size: 12px; font-weight: 700; color: var(--text-muted); margin-bottom: 16px; display: flex; align-items: center; gap: 6px;">
          ${icons.time || '⏱'} ${r.tiempo_preparacion || 15} min ${r.categorias ? `• ${r.categorias}` : ''}
        </div>

        <div style="margin-bottom: 16px;">
          <h4 style="margin: 0 0 10px 0; font-size: 14px; font-weight: 700; color: var(--text-main); border-bottom: 1px solid var(--border); padding-bottom: 4px; display: flex; align-items: center; gap: 6px;">
            ${icons.cart || '🛒'} Ingredientes
          </h4>
          <div>${listaIngredientesHtml}</div>
        </div>

        <div>
          <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 700; color: var(--text-main); border-bottom: 1px solid var(--border); padding-bottom: 4px; display: flex; align-items: center; gap: 6px;">
            ${icons.chef || '👨‍🍳'} Pasos
          </h4>
          <div style="font-size: 13px; color: var(--text-main); line-height: 1.5; white-space: pre-line;">${r.pasos || 'Sin pasos explicados.'}</div>
        </div>
      `;

      contenidoDetalle.querySelector('#btnAbrirPerfilDesdeModal').addEventListener('click', () => {
        modalDetalle.classList.remove('visible');
        abrirPerfilCocinero(autor);
      });

      modalDetalle.classList.add('visible');
    }

    async function cargarComunidad(busqueda = '') {
      const termino = busqueda.toLowerCase().trim().replace('@', '');
      const hayBusqueda = termino.length > 0;

      const { data: relaciones } = await supabase
        .from('seguidores')
        .select('seguido_id, estado')
        .eq('seguidor_id', usuarioActual.id);

      const mapaRelaciones = {};
      (relaciones || []).forEach(rel => {
        mapaRelaciones[rel.seguido_id] = rel.estado || 'aceptado';
      });

      const idsAceptados = Object.keys(mapaRelaciones).filter(id => mapaRelaciones[id] === 'aceptado');

      // 1. BUSCADOR DE PERFILES
      if (hayBusqueda) {
        const { data: perfilesEncontrados } = await supabase
          .from('perfiles')
          .select('*')
          .neq('id', usuarioActual.id)
          .or(`username.ilike.%${termino}%,nombre_completo.ilike.%${termino}%`);

        if (perfilesEncontrados && perfilesEncontrados.length > 0) {
          secUsuarios.classList.remove('hidden');
          gridUsuarios.innerHTML = perfilesEncontrados.map(p => {
            const estado = mapaRelaciones[p.id];

            let btnHtml = '';
            if (estado === 'aceptado') {
              btnHtml = `<span style="font-size:11px; font-weight:800; color:var(--primary); background:var(--primary-light); padding:5px 12px; border-radius:12px;">Siguiendo</span>`;
            } else if (estado === 'pendiente') {
              btnHtml = `<button disabled style="padding:5px 12px; font-size:11px; font-weight:700; border-radius:10px; background:var(--input-bg); color:var(--text-muted); border:1px solid var(--border); margin:0;">Solicitado</button>`;
            } else {
              btnHtml = `<button class="btn-enviar-solicitud btn-primary" data-id="${p.id}" style="width:auto; padding:6px 14px; font-size:11px; font-weight:700; border-radius:10px; margin:0;">Seguir</button>`;
            }

            return `
              <div class="card card-perfil-item" data-id="${p.id}" style="padding:12px 14px; border-radius:16px; border:1px solid var(--border); display:flex; align-items:center; justify-space-between; gap:10px; cursor:pointer;">
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

          // CLICK EN TARJETA DE USUARIO ENCONTRADO PARA ABRIR SU PERFIL
          gridUsuarios.querySelectorAll('.area-click-perfil').forEach(area => {
            area.addEventListener('click', () => {
              const pId = area.getAttribute('data-id');
              const perfilSel = perfilesEncontrados.find(item => item.id === pId);
              if (perfilSel) abrirPerfilCocinero(perfilSel, mapaRelaciones[pId]);
            });
          });

          gridUsuarios.querySelectorAll('.btn-enviar-solicitud').forEach(btn => {
            btn.addEventListener('click', async (e) => {
              e.stopPropagation();
              const idDestino = btn.getAttribute('data-id');
              btn.disabled = true;
              btn.innerText = 'Enviando...';

              try {
                await supabase.from('seguidores').insert([{
                  seguidor_id: usuarioActual.id,
                  seguido_id: idDestino,
                  estado: 'pendiente'
                }]);

                await supabase.from('notificaciones').insert([{
                  user_id: idDestino,
                  emisor_id: usuarioActual.id,
                  tipo: 'solicitud_seguimiento',
                  leida: false
                }]);

                mostrarAvisoModal('Solicitud enviada', 'Se ha enviado la solicitud de seguimiento correctamente.');
                cargarComunidad(inputBuscar.value);
              } catch (e) {
                console.error('Error enviando solicitud:', e);
                btn.disabled = false;
                btn.innerText = 'Seguir';
              }
            });
          });
        } else {
          secUsuarios.classList.add('hidden');
        }
      } else {
        secUsuarios.classList.add('hidden');
      }

      // 2. RECETAS DE USUARIOS ACEPTADOS
      gridFeed.innerHTML = '<p style="color: var(--text-muted); font-size: 13px;">Cargando publicaciones...</p>';

      if (idsAceptados.length === 0) {
        gridFeed.innerHTML = `
          <div style="grid-column: 1/-1; text-align: center; padding: 40px 20px; background: var(--input-bg); border-radius: 16px; border: 1px dashed var(--border);">
            <p style="margin: 0 0 6px 0; font-size: 14px; font-weight: 800; color: var(--text-main);">Aún no tienes recetas para mostrar</p>
            <p style="margin: 0; font-size: 12px; color: var(--text-muted);">Busca arriba a otros usuarios por su @username y envíales una solicitud de seguimiento.</p>
          </div>
        `;
        return;
      }

      const { data: recetas, error: errRecetas } = await supabase
        .from('recetas')
        .select('*')
        .eq('es_publica', true)
        .in('user_id', idsAceptados)
        .order('created_at', { ascending: false });

      if (errRecetas || !recetas || recetas.length === 0) {
        gridFeed.innerHTML = '<p style="color: var(--text-muted); font-size: 13px; grid-column: 1/-1;">Los cocineros a los que sigues no han publicado recetas todavía.</p>';
        return;
      }

      const idsAutores = [...new Set(recetas.map(r => r.user_id))];
      const { data: perfilesAutores } = await supabase.from('perfiles').select('*').in('id', idsAutores);
      const mapaAutores = {};
      (perfilesAutores || []).forEach(p => { mapaAutores[p.id] = p; });

      // FILTRADO COMBINADO POR TEXTO Y CATEGORÍA
      let recetasFiltradas = recetas.filter(r => {
        const matchNombre = r.nombre ? r.nombre.toLowerCase().includes(termino) : false;
        const matchIng = r.ingredientes ? r.ingredientes.toLowerCase().includes(termino) : false;
        const matchTexto = hayBusqueda ? (matchNombre || matchIng) : true;

        const matchCat = categoriaFiltro === 'Todos' || (r.categorias && r.categorias.toLowerCase().includes(categoriaFiltro.toLowerCase()));
        
        return matchTexto && matchCat;
      });

      if (recetasFiltradas.length === 0) {
        gridFeed.innerHTML = '<p style="color: var(--text-muted); font-size: 13px; grid-column: 1/-1;">No se encontraron recetas coincidentes en esta categoría.</p>';
        return;
      }

      gridFeed.innerHTML = recetasFiltradas.map(r => {
        const autor = mapaAutores[r.user_id] || {};
        const listaIngredientes = r.ingredientes 
          ? r.ingredientes.split('\n').filter(i => i.trim()).slice(0, 3).join(', ') 
          : 'Sin ingredientes especificados';

        return `
          <div class="card card-receta-feed" data-id="${r.id}" style="padding: 12px; border-radius: 16px; border: 1px solid var(--border); box-shadow: 0 2px 8px rgba(0,0,0,0.03); display: flex; flex-direction: column; justify-content: space-between; width: 100%; box-sizing: border-box; cursor: pointer;">
            <div>
              ${r.imagen_url ? `<img src="${r.imagen_url}" style="width: 100%; height: 110px; object-fit: cover; border-radius: 12px; margin-bottom: 10px;" />` : ''}
              
              <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;" class="click-autor-header" data-autorid="${autor.id}">
                <div style="width: 22px; height: 22px; border-radius: 50%; background: #e6f4f4; color: #2ba8a8; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 10px; overflow: hidden; flex-shrink: 0;">
                  ${autor.avatar_url ? `<img src="${autor.avatar_url}" style="width: 100%; height: 100%; object-fit: cover;" />` : (autor.username || 'U').charAt(0).toUpperCase()}
                </div>
                <span style="font-size: 11px; font-weight: 700; color: #2ba8a8;">@${autor.username || 'usuario'}</span>
              </div>

              <h3 style="margin: 0 0 2px 0; font-size: 14px; font-weight: 800; color: var(--text-main);">${r.nombre}</h3>
              <p style="margin: 0 0 6px 0; font-size: 11px; color: var(--text-muted); display: flex; align-items: center; gap: 4px;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
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

            <button class="btn-importar-receta btn-outline" data-id="${r.id}" style="width: 100%; padding: 6px 10px; font-size: 11px; font-weight: 700; border-radius: 10px; margin: 0; display: inline-flex; align-items: center; justify-content: center; gap: 6px; border: 1px solid var(--border);">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
              <span>Guardar en Mis Recetas</span>
            </button>
          </div>
        `;
      }).join('');

      gridFeed.querySelectorAll('.card-receta-feed').forEach(card => {
        card.addEventListener('click', (e) => {
          if (e.target.closest('.btn-importar-receta')) return;
          
          // Si pulsa en el header del autor, abrimos el perfil del cocinero directamente
          const headerAutor = e.target.closest('.click-autor-header');
          if (headerAutor) {
            e.stopPropagation();
            const autorId = headerAutor.getAttribute('data-autorid');
            const autorSel = mapaAutores[autorId];
            if (autorSel) abrirPerfilCocinero(autorSel, 'aceptado');
            return;
          }

          const id = card.getAttribute('data-id');
          const recetaSel = recetas.find(item => item.id === id);
          if (recetaSel) {
            const autor = mapaAutores[recetaSel.user_id] || {};
            abrirDetalleFeed(recetaSel, autor);
          }
        });
      });

      // ACCIÓN DE GUARDAR RECETA CON NOTIFICACIÓN DIRIGIDA AL AUTOR REAL
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

            const autorOriginalId = recetaOriginal.user_id;
            const autor = mapaAutores[autorOriginalId] || {};
            const usuarioAutor = autor.username ? `@${autor.username}` : 'Comunidad';

            const nuevaRecetaPayload = {
              user_id: usuarioActual.id,
              nombre: `${recetaOriginal.nombre} (de ${usuarioAutor})`,
              ingredientes: recetaOriginal.ingredientes || '',
              pasos: recetaOriginal.pasos || '',
              tiempo_preparacion: recetaOriginal.tiempo_preparacion || 15,
              imagen_url: recetaOriginal.imagen_url || null,
              categorias: recetaOriginal.categorias || 'Comida',
              es_publica: false
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

            // ENVIAR NOTIFICACIÓN DIRECTA AL AUTOR ORIGINAL
            if (autorOriginalId && autorOriginalId !== usuarioActual.id) {
              const { error: notifErr } = await supabase.from('notificaciones').insert([{
                user_id: autorOriginalId,
                emisor_id: usuarioActual.id,
                tipo: 'receta_guardada',
                referencia: recetaOriginal.nombre,
                leida: false
              }]);

              if (notifErr) {
                console.error('Error enviando notificación:', notifErr.message);
              }
            }

            mostrarAvisoModal('¡Receta Guardada!', `"${recetaOriginal.nombre}" de ${usuarioAutor} se ha añadido a tus recetas.`);
            btn.innerText = '¡Guardada!';

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

    inputBuscar.addEventListener('input', (e) => {
      cargarComunidad(e.target.value);
    });

    cargarComunidad();
  }, 0);

  return container;
}