import { supabase } from '../supabase.js';
import { icons } from '../icons.js';

export function renderComunidadView(usuarioActual, onRecetaImportada) {
  const container = document.createElement('div');
  container.className = 'container';

  container.innerHTML = `
    <!-- CABECERA DE LA PÁGINA -->
    <div style="margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
      <div>
        <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: var(--primary); display: flex; align-items: center; gap: 10px;">
          <span style="display: flex; align-items: center; color: var(--primary);">${icons.compass || icons.globe}</span>
          <span>Feed de la Comunidad</span>
        </h1>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: var(--text-muted);">Descubre las recetas de los cocineros que sigues e impórtalas a tu plan</p>
      </div>

      <!-- BUSCADOR -->
      <div style="position: relative; width: 100%; max-width: 320px;">
        <input type="text" id="inputBuscarFeed" placeholder="Buscar receta o @usuario..." style="width: 100%; padding-left: 38px; height: 40px; border-radius: 20px; margin: 0; box-sizing: border-box; border: 1px solid var(--border);" />
        <span style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--text-muted); display: flex; align-items: center;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        </span>
      </div>
    </div>

    <!-- REJILLA CON TAMAÑO COMPACTO CONTROLADO -->
    <div id="gridFeed" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 230px)); gap: 18px;">
      Cargando publicaciones...
    </div>

    <!-- MODAL FORMAL DE NOTIFICACIÓN -->
    <div id="modalNotificacionFeed" class="sidebar-overlay">
      <div class="card" style="max-width: 380px; width: 90%; margin: 120px auto; padding: 24px; border-radius: 20px; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.15);">
        <div id="feedModalIcon" style="width: 52px; height: 52px; border-radius: 50%; background: var(--primary-light); color: var(--primary); display: inline-flex; align-items: center; justify-content: center; margin-bottom: 14px;">
          ${icons.check || '✓'}
        </div>
        <h3 id="feedModalTitle" style="margin: 0 0 8px 0; font-size: 18px; font-weight: 800; color: var(--text-main);">¡Receta Importada!</h3>
        <p id="feedModalMsg" style="margin: 0 0 20px 0; font-size: 13px; color: var(--text-muted); line-height: 1.5;">
          La receta se ha añadido correctamente a tus recetas guardadas.
        </p>
        <button id="btnCerrarModalFeed" class="btn-primary" style="width: 100%; margin: 0; padding: 10px; font-size: 13px; font-weight: 700; border-radius: 10px;">Entendido</button>
      </div>
    </div>
  `;

  setTimeout(() => {
    const gridFeed = container.querySelector('#gridFeed');
    const inputBuscar = container.querySelector('#inputBuscarFeed');
    
    const modalNotif = container.querySelector('#modalNotificacionFeed');
    const modalIcon = container.querySelector('#feedModalIcon');
    const modalTitle = container.querySelector('#feedModalTitle');
    const modalMsg = container.querySelector('#feedModalMsg');
    const btnCerrarModal = container.querySelector('#btnCerrarModalFeed');

    btnCerrarModal.addEventListener('click', () => {
      modalNotif.classList.remove('visible');
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

    async function cargarPublicacionesFeed(busqueda = '') {
      gridFeed.innerHTML = '<p style="color: var(--text-muted); font-size: 13px;">Cargando feed...</p>';

      // Traer solo recetas públicas de OTROS usuarios (.neq en user_id)
      const { data: recetas, error } = await supabase
        .from('recetas')
        .select('*')
        .eq('es_publica', true)
        .neq('user_id', usuarioActual.id)
        .order('created_at', { ascending: false });

      if (error || !recetas || recetas.length === 0) {
        gridFeed.innerHTML = '<p style="color: var(--text-muted); font-size: 13px; grid-column: 1/-1;">No hay recetas de otros cocineros en la comunidad por ahora.</p>';
        return;
      }

      // Obtener perfiles de autores
      const userIds = [...new Set(recetas.map(r => r.user_id))];
      const { data: perfiles } = await supabase.from('perfiles').select('*').in('id', userIds);
      const mapaPerfiles = {};
      (perfiles || []).forEach(p => { mapaPerfiles[p.id] = p; });

      // Filtrar por búsqueda
      const filtro = busqueda.toLowerCase().trim();
      const recetasFiltradas = recetas.filter(r => {
        const autor = mapaPerfiles[r.user_id] || {};
        const matchNombre = r.nombre ? r.nombre.toLowerCase().includes(filtro) : false;
        const matchUser = autor.username ? autor.username.toLowerCase().includes(filtro) : false;
        return matchNombre || matchUser;
      });

      if (recetasFiltradas.length === 0) {
        gridFeed.innerHTML = '<p style="color: var(--text-muted); font-size: 13px; grid-column: 1/-1;">No se encontraron recetas con ese término.</p>';
        return;
      }

      gridFeed.innerHTML = recetasFiltradas.map(r => {
        const autor = mapaPerfiles[r.user_id] || {};

        return `
          <div class="card" style="padding: 12px; border-radius: 16px; border: 1px solid var(--border); box-shadow: 0 2px 8px rgba(0,0,0,0.03); display: flex; flex-direction: column; justify-content: space-between; width: 100%; box-sizing: border-box;">
            <div>
              ${r.imagen_url ? `<img src="${r.imagen_url}" style="width: 100%; height: 110px; object-fit: cover; border-radius: 12px; margin-bottom: 10px;" />` : ''}
              
              <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
                <div style="width: 22px; height: 22px; border-radius: 50%; background: #e6f4f4; color: #2ba8a8; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 10px; overflow: hidden; flex-shrink: 0;">
                  ${autor.avatar_url ? `<img src="${autor.avatar_url}" style="width: 100%; height: 100%; object-fit: cover;" />` : (autor.username || 'U').charAt(0).toUpperCase()}
                </div>
                <span style="font-size: 11px; font-weight: 700; color: #2ba8a8;">@${autor.username || 'usuario'}</span>
              </div>

              <h3 style="margin: 0 0 2px 0; font-size: 14px; font-weight: 800; color: var(--text-main);">${r.nombre}</h3>
              <p style="margin: 0 0 10px 0; font-size: 11px; color: var(--text-muted); display: flex; align-items: center; gap: 4px;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                <span>${r.tiempo_preparacion || 15} min</span>
              </p>
            </div>

            <button class="btn-importar-receta btn-outline" data-id="${r.id}" style="width: 100%; padding: 6px 10px; font-size: 11px; font-weight: 700; border-radius: 10px; margin: 0; display: inline-flex; align-items: center; justify-content: center; gap: 6px; border: 1px solid var(--border);">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
              <span>Guardar en Mis Recetas</span>
            </button>
          </div>
        `;
      }).join('');

      // IMPORTACIÓN DE RECETAS CON ATRIBUCIÓN AL AUTOR ORIGINAL
      gridFeed.querySelectorAll('.btn-importar-receta').forEach(btn => {
        btn.addEventListener('click', async () => {
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
              btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg> <span>Guardar en Mis Recetas</span>`;
              return;
            }

            // Nombre del autor original
            const autor = mapaPerfiles[recetaOriginal.user_id] || {};
            const nombreAutor = autor.username ? `@${autor.username}` : 'Comunidad';

            const nuevaRecetaPayload = {
              user_id: usuarioActual.id,
              nombre: `${recetaOriginal.nombre} (de ${nombreAutor})`,
              ingredientes: recetaOriginal.ingredientes || [],
              pasos: recetaOriginal.pasos || [],
              tiempo_preparacion: recetaOriginal.tiempo_preparacion || 15,
              imagen_url: recetaOriginal.imagen_url || null,
              es_publica: false
            };

            const { error: insertErr } = await supabase
              .from('recetas')
              .insert([nuevaRecetaPayload]);

            if (insertErr) {
              mostrarAvisoModal('Error al importar', insertErr.message || 'Error al guardar la receta.', true);
              btn.disabled = false;
              btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg> <span>Guardar en Mis Recetas</span>`;
              return;
            }

            mostrarAvisoModal('¡Receta Guardada!', `"${recetaOriginal.nombre}" de ${nombreAutor} se ha añadido a tus recetas.`);
            btn.innerText = '¡Guardada!';

            if (onRecetaImportada) onRecetaImportada();

          } catch (err) {
            mostrarAvisoModal('Error inesperado', err.message || 'Error al procesar la importación.', true);
            btn.disabled = false;
            btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg> <span>Guardar en Mis Recetas</span>`;
          }
        });
      });
    }

    inputBuscar.addEventListener('input', (e) => {
      cargarPublicacionesFeed(e.target.value);
    });

    cargarPublicacionesFeed();
  }, 0);

  return container;
}