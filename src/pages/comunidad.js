import { supabase } from '../supabase.js';
import { icons } from '../icons.js';

export function renderComunidadView(usuarioActual) {
  const container = document.createElement('div');
  container.className = 'container';

  container.innerHTML = `
    <!-- CABECERA -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 14px;">
      <div>
        <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: var(--primary); display: flex; align-items: center; gap: 8px;">
          <span style="display: flex; align-items: center; color: var(--primary);">${icons.feed}</span>
          <span>Feed de la Comunidad</span>
        </h1>
        <p style="margin: 2px 0 0 0; font-size: 12px; color: var(--text-muted);">Descubre las recetas de los cocineros que sigues e impórtalas a tu plan</p>
      </div>

      <!-- BUSCADOR CON SUGERENCIAS DE USUARIOS -->
      <div style="position: relative; min-width: 260px;">
        <div style="position: relative; display: flex; align-items: center;">
          <input type="text" id="inputBuscarFeed" placeholder="Buscar receta o @usuario..." style="width: 100%; height: 36px; padding-left: 34px; margin: 0; font-size: 12px;" />
          <span style="position: absolute; left: 10px; color: var(--text-muted); pointer-events: none; display: flex;">${icons.search}</span>
        </div>
        <div id="boxResultadosUsuarios" style="position: absolute; top: 42px; left: 0; right: 0; background: var(--bg-card, #ffffff); border: 1px solid var(--border); border-radius: 12px; box-shadow: var(--shadow); z-index: 100; max-height: 250px; overflow-y: auto; display: none;"></div>
      </div>
    </div>

    <!-- GRID DE RECETAS PÚBLICAS -->
    <div id="gridFeed" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px;">
      Cargando recetas de la comunidad...
    </div>
  `;

  setTimeout(() => {
    const inputBuscar = container.querySelector('#inputBuscarFeed');
    const boxUsuarios = container.querySelector('#boxResultadosUsuarios');
    const gridFeed = container.querySelector('#gridFeed');

    let todasLasRecetas = [];

    // Cargar únicamente recetas de usuarios con seguimiento aceptado
    async function cargarFeed() {
      gridFeed.innerHTML = '<p style="color: var(--text-muted); font-size: 12px;">Cargando recetas...</p>';

      // 1. Obtener los IDs de las personas a las que sigues (con estado aceptado o sin estado definido)
      const { data: misSiguiendo } = await supabase
        .from('seguidores')
        .select('seguido_id')
        .eq('seguidor_id', usuarioActual.id)
        .or('estado.eq.aceptado,estado.is.null');

      const idsPermitidos = (misSiguiendo || []).map(s => s.seguido_id);

      if (idsPermitidos.length === 0) {
        renderizarRecetas([]);
        return;
      }

      // 2. Traer solo las recetas públicas de esos usuarios seguidos
      const { data: recetas, error } = await supabase
        .from('recetas')
        .select('*')
        .eq('es_publica', true)
        .in('user_id', idsPermitidos)
        .order('created_at', { ascending: false });

      if (error) {
        gridFeed.innerHTML = `<p style="color: var(--danger); font-size: 12px;">Error al cargar las recetas: ${error.message}</p>`;
        return;
      }

      if (!recetas || recetas.length === 0) {
        renderizarRecetas([]);
        return;
      }

      // 3. Traer los perfiles de los autores de esas recetas
      const userIds = [...new Set(recetas.map(r => r.user_id))];
      const { data: perfiles } = await supabase.from('perfiles').select('*').in('id', userIds);

      const mapaPerfiles = {};
      (perfiles || []).forEach(p => { mapaPerfiles[p.id] = p; });

      todasLasRecetas = recetas.map(r => ({
        ...r,
        perfiles: mapaPerfiles[r.user_id] || {}
      }));

      renderizarRecetas(todasLasRecetas);
    }

    function renderizarRecetas(lista) {
      if (!lista || lista.length === 0) {
        gridFeed.innerHTML = `
          <div class="card" style="padding: 30px; text-align: center; grid-column: 1/-1; border-radius: 16px;">
            <h3 style="margin: 0 0 6px 0; font-size: 15px; color: var(--text-main);">No hay recetas públicas en tu feed</h3>
            <p style="margin: 0; font-size: 12px; color: var(--text-muted);">Sigue a otros cocineros desde la barra de búsqueda superior para ver sus publicaciones aquí.</p>
          </div>
        `;
        return;
      }

      gridFeed.innerHTML = lista.map(r => {
        const autor = r.perfiles || {};
        return `
          <div class="card" style="padding: 10px; border-radius: 14px; display: flex; flex-direction: column; justify-content: space-between; max-width: 240px;">
            <div>
              ${r.imagen_url ? `<img src="${r.imagen_url}" style="width: 100%; height: 110px; object-fit: cover; border-radius: 10px; margin-bottom: 8px;" />` : ''}
              
              <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
                <div style="width: 22px; height: 22px; border-radius: 50%; background: var(--primary-light); color: var(--primary); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 10px; overflow: hidden; flex-shrink: 0;">
                  ${autor.avatar_url ? `<img src="${autor.avatar_url}" style="width: 100%; height: 100%; object-fit: cover;" />` : (autor.username || 'U').charAt(0).toUpperCase()}
                </div>
                <span style="font-size: 11px; font-weight: 700; color: var(--primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">@${autor.username || 'usuario'}</span>
              </div>

              <h3 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 800; color: var(--text-main); line-height: 1.2;">${r.nombre}</h3>
              <p style="font-size: 11px; color: var(--text-muted); margin: 0 0 8px 0; display: flex; align-items: center; gap: 4px;">
                ${icons.time} ${r.tiempo_preparacion || 15} min
              </p>
            </div>

            <button class="btn-importar-receta btn-outline" data-id="${r.id}" style="width: 100%; padding: 6px 8px; font-size: 11px; font-weight: 700; border-radius: 8px; margin: 0; display: flex; align-items: center; justify-content: center; gap: 4px; height: 32px;">
              ${icons.recetas} Guardar en Mis Recetas
            </button>
          </div>
        `;
      }).join('');

      gridFeed.querySelectorAll('.btn-importar-receta').forEach(btn => {
        btn.addEventListener('click', async () => {
          const recId = btn.getAttribute('data-id');
          const recetaOriginal = todasLasRecetas.find(x => x.id === recId);
          if (!recetaOriginal) return;

          btn.disabled = true;
          btn.innerText = 'Guardando...';

          const { error } = await supabase.from('recetas').insert([{
            user_id: usuarioActual.id,
            nombre: recetaOriginal.nombre,
            ingredientes: recetaOriginal.ingredientes,
            instrucciones: recetaOriginal.instrucciones,
            tiempo_preparacion: recetaOriginal.tiempo_preparacion,
            imagen_url: recetaOriginal.imagen_url,
            es_publica: false
          }]);

          if (error) {
            alert('Error al importar la receta.');
            btn.disabled = false;
            btn.innerText = 'Guardar en Mis Recetas';
          } else {
            btn.innerText = '✅ ¡Guardada!';
          }
        });
      });
    }

    inputBuscar.addEventListener('input', async (e) => {
      const q = e.target.value.trim().toLowerCase();

      if (!q) {
        boxUsuarios.style.display = 'none';
        renderizarRecetas(todasLasRecetas);
        return;
      }

      if (q.startsWith('@') || q.length >= 2) {
        const terminoUser = q.replace('@', '');
        
        const { data: usuarios } = await supabase
          .from('perfiles')
          .select('*')
          .neq('id', usuarioActual.id)
          .or(`username.ilike.%${terminoUser}%,nombre_completo.ilike.%${terminoUser}%`)
          .limit(5);

        if (usuarios && usuarios.length > 0) {
          boxUsuarios.style.display = 'block';
          
          const idsBusqueda = usuarios.map(u => u.id);
          const { data: misSeguimientos } = await supabase
            .from('seguidores')
            .select('seguido_id, estado')
            .eq('seguidor_id', usuarioActual.id)
            .in('seguido_id', idsBusqueda);

          const mapaEstados = {};
          (misSeguimientos || []).forEach(s => { mapaEstados[s.seguido_id] = s.estado; });

          boxUsuarios.innerHTML = usuarios.map(u => {
            const estadoSeguimiento = mapaEstados[u.id];

            let textoBoton = '+ Seguir';
            let estiloClase = 'btn-primary';

            if (estadoSeguimiento === 'pendiente') {
              textoBoton = 'Cancelar solicitud';
              estiloClase = 'btn-outline';
            } else if (estadoSeguimiento === 'aceptado') {
              textoBoton = 'Dejar de seguir';
              estiloClase = 'btn-outline';
            }

            return `
              <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; border-bottom: 1px solid var(--border);">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <div style="width: 28px; height: 28px; border-radius: 50%; background: var(--primary-light); color: var(--primary); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 11px; overflow: hidden;">
                    ${u.avatar_url ? `<img src="${u.avatar_url}" style="width:100%; height:100%; object-fit:cover;" />` : (u.username || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style="font-size: 12px; font-weight: 700; color: var(--text-main);">${u.nombre_completo || u.username}</div>
                    <div style="font-size: 10px; color: var(--primary); font-weight: 700;">@${u.username}</div>
                  </div>
                </div>

                <button class="btn-accion-seguir ${estiloClase}" data-userid="${u.id}" data-estado="${estadoSeguimiento || 'ninguno'}" style="width: auto; padding: 4px 10px; font-size: 10px; font-weight: 700; margin: 0; border-radius: 6px;">
                  ${textoBoton}
                </button>
              </div>
            `;
          }).join('');

          boxUsuarios.querySelectorAll('.btn-accion-seguir').forEach(btn => {
            btn.addEventListener('click', async () => {
              const destinoId = btn.getAttribute('data-userid');
              const estadoActual = btn.getAttribute('data-estado');

              btn.disabled = true;

              if (estadoActual === 'pendiente' || estadoActual === 'aceptado') {
                btn.innerText = 'Procesando...';

                // 1. Borrar relación de seguimiento
                await supabase.from('seguidores').delete().eq('seguidor_id', usuarioActual.id).eq('seguido_id', destinoId);

                // 2. Borrar notificación de solicitud pendiente si existía
                await supabase.from('notificaciones').delete().eq('emisor_id', usuarioActual.id).eq('user_id', destinoId);

                btn.innerText = '+ Seguir';
                btn.className = 'btn-accion-seguir btn-primary';
                btn.setAttribute('data-estado', 'ninguno');
                btn.disabled = false;

                // 3. Recargar el Feed para ocultar inmediatamente sus recetas
                cargarFeed();
              } else {
                btn.innerText = 'Enviando...';

                // 1. Guardar o actualizar estado de seguimiento a pendiente
                const { error: segErr } = await supabase.from('seguidores').upsert([{
                  seguidor_id: usuarioActual.id,
                  seguido_id: destinoId,
                  estado: 'pendiente'
                }]);

                if (segErr) {
                  console.error('Error al solicitar seguimiento:', segErr);
                  btn.innerText = '+ Seguir';
                  btn.disabled = false;
                  return;
                }

                // 2. Generar registro explícito en notificaciones
                await supabase.from('notificaciones').insert([{
                  user_id: destinoId,
                  emisor_id: usuarioActual.id,
                  tipo: 'solicitud_seguimiento',
                  leida: false
                }]);

                btn.innerText = 'Cancelar solicitud';
                btn.className = 'btn-accion-seguir btn-outline';
                btn.setAttribute('data-estado', 'pendiente');
                btn.disabled = false;
              }
            });
          });
        } else {
          boxUsuarios.style.display = 'none';
        }
      } else {
        boxUsuarios.style.display = 'none';
      }

      const filtradas = todasLasRecetas.filter(r => 
        r.nombre.toLowerCase().includes(q) ||
        (r.ingredientes && r.ingredientes.toLowerCase().includes(q)) ||
        (r.perfiles && r.perfiles.username && r.perfiles.username.toLowerCase().includes(q))
      );
      renderizarRecetas(filtradas);
    });

    document.addEventListener('click', (e) => {
      if (!container.contains(e.target)) {
        boxUsuarios.style.display = 'none';
      }
    });

    cargarFeed();
  }, 0);

  return container;
}