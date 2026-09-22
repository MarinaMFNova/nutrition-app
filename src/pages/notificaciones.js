import { supabase } from '../supabase.js';
import { icons } from '../icons.js';

export function renderNotificacionesView(usuarioActual) {
  const container = document.createElement('div');
  container.className = 'container';

  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px;">
      <div>
        <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: var(--primary); display: flex; align-items: center; gap: 8px;">
          <span style="display: flex; align-items: center; color: var(--primary);">${icons.bell || '🔔'}</span>
          <span>Notificaciones</span>
        </h1>
        <p style="margin: 2px 0 0 0; font-size: 12px; color: var(--text-muted);">Gestiona tus solicitudes de seguimiento e interacciones</p>
      </div>

      <button id="btnLimpiarNotifs" class="btn-outline" style="width: auto; padding: 6px 12px; font-size: 11px; font-weight: 700; margin: 0; border-radius: 8px; display: none;">
        Limpiar leídas
      </button>
    </div>

    <div class="card" style="padding: 20px; max-width: 600px; border-radius: 16px;">
      <div id="contenedorListaNotificaciones" style="display: flex; flex-direction: column; gap: 10px;">
        Cargando notificaciones...
      </div>
    </div>
  `;

  async function cargarNotificaciones() {
    const lista = container.querySelector('#contenedorListaNotificaciones');
    const btnLimpiar = container.querySelector('#btnLimpiarNotifs');
    if (!lista) return;

    lista.innerHTML = '<p style="font-size: 12px; color: var(--text-muted); margin: 0;">Cargando notificaciones...</p>';

    // 1. Cargar notificaciones del usuario actual
    const { data: notifs, error } = await supabase
      .from('notificaciones')
      .select('*')
      .eq('user_id', usuarioActual.id)
      .order('created_at', { ascending: false });

    if (error || !notifs || notifs.length === 0) {
      lista.innerHTML = '<p style="font-size: 12px; color: var(--text-muted); margin: 0;">No tienes notificaciones pendientes.</p>';
      if (btnLimpiar) btnLimpiar.style.display = 'none';
      return;
    }

    // 2. Filtrar duplicados en el cliente (misma persona + mismo tipo)
    const notifsUnicas = [];
    const clavesVistas = new Set();

    notifs.forEach(n => {
      const clave = `${n.emisor_id}_${n.tipo}`;
      if (!clavesVistas.has(clave)) {
        clavesVistas.add(clave);
        notifsUnicas.push(n);
      } else {
        // Si es duplicado exacto en DB, lo borramos en segundo plano para limpiar la tabla
        supabase.from('notificaciones').delete().eq('id', n.id);
      }
    });

    if (btnLimpiar) btnLimpiar.style.display = 'block';

    // 3. Obtener perfiles de los emisores
    const emisorIds = [...new Set(notifsUnicas.map(n => n.emisor_id))];
    const { data: perfiles } = await supabase.from('perfiles').select('*').in('id', emisorIds);

    const mapaPerfiles = {};
    (perfiles || []).forEach(p => { mapaPerfiles[p.id] = p; });

    lista.innerHTML = notifsUnicas.map(n => {
      const emisor = mapaPerfiles[n.emisor_id] || {};
      const esSolicitud = n.tipo === 'solicitud_seguimiento';

      return `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; background: var(--input-bg); border-radius: 12px; border: 1px solid var(--border); flex-wrap: wrap; gap: 8px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 32px; height: 32px; border-radius: 50%; background: var(--primary-light); color: var(--primary); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 12px; overflow: hidden; flex-shrink: 0;">
              ${emisor.avatar_url ? `<img src="${emisor.avatar_url}" style="width:100%; height:100%; object-fit:cover;" />` : (emisor.username || 'U').charAt(0).toUpperCase()}
            </div>
            <div>
              <div style="font-size: 12px; font-weight: 700; color: var(--text-main);">
                <strong>@${emisor.username || 'usuario'}</strong> ${esSolicitud ? 'quiere seguirte.' : 'ha aceptado tu solicitud.'}
              </div>
              <div style="font-size: 10px; color: var(--text-muted);">${new Date(n.created_at).toLocaleDateString()}</div>
            </div>
          </div>

          ${esSolicitud ? `
            <div style="display: flex; gap: 6px;">
              <button class="btn-aceptar btn-primary" data-notifid="${n.id}" data-emisorid="${emisor.id}" style="width: auto; padding: 6px 12px; font-size: 11px; font-weight: 700; margin: 0; border-radius: 6px;">
                Aceptar
              </button>
              <button class="btn-rechazar btn-outline" data-notifid="${n.id}" data-emisorid="${emisor.id}" style="width: auto; padding: 6px 12px; font-size: 11px; font-weight: 700; margin: 0; border-radius: 6px; color: var(--danger);">
                Rechazar
              </button>
            </div>
          ` : `
            <button class="btn-borrar-notif btn-outline" data-notifid="${n.id}" style="width: auto; padding: 4px 8px; font-size: 10px; margin: 0; border-radius: 6px; border: none; color: var(--text-muted);">
              ✕
            </button>
          `}
        </div>
      `;
    }).join('');

    // Marcar notificaciones como leídas
    await supabase.from('notificaciones').update({ leida: true }).eq('user_id', usuarioActual.id);

    // Eventos
    lista.querySelectorAll('.btn-aceptar').forEach(btn => {
      btn.addEventListener('click', async () => {
        const notifId = btn.getAttribute('data-notifid');
        const emisorId = btn.getAttribute('data-emisorid');

        btn.disabled = true;
        btn.innerText = 'Aceptando...';

        try {
          await supabase.from('seguidores').update({ estado: 'aceptado' }).eq('seguidor_id', emisorId).eq('seguido_id', usuarioActual.id);
          await supabase.from('notificaciones').delete().eq('id', notifId);

          // Crear notificación de confirmación enviando una sola vez
          await supabase.from('notificaciones').insert([{
            user_id: emisorId,
            emisor_id: usuarioActual.id,
            tipo: 'seguimiento_aceptado',
            leida: false
          }]);
        } catch (err) {
          console.error('Error al aceptar:', err);
        }

        cargarNotificaciones();
      });
    });

    lista.querySelectorAll('.btn-rechazar').forEach(btn => {
      btn.addEventListener('click', async () => {
        const notifId = btn.getAttribute('data-notifid');
        const emisorId = btn.getAttribute('data-emisorid');

        btn.disabled = true;
        btn.innerText = 'Rechazando...';

        try {
          await supabase.from('seguidores').delete().eq('seguidor_id', emisorId).eq('seguido_id', usuarioActual.id);
          await supabase.from('notificaciones').delete().eq('id', notifId);
        } catch (err) {
          console.error('Error al rechazar:', err);
        }

        cargarNotificaciones();
      });
    });

    lista.querySelectorAll('.btn-borrar-notif').forEach(btn => {
      btn.addEventListener('click', async () => {
        const notifId = btn.getAttribute('data-notifid');
        await supabase.from('notificaciones').delete().eq('id', notifId);
        cargarNotificaciones();
      });
    });

    if (btnLimpiar) {
      btnLimpiar.onclick = async () => {
        await supabase.from('notificaciones').delete().eq('user_id', usuarioActual.id);
        cargarNotificaciones();
      };
    }
  }

  setTimeout(() => {
    cargarNotificaciones();
  }, 0);

  return container;
}