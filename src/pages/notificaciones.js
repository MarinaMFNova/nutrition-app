import { supabase } from '../supabase.js';
import { icons } from '../icons.js';

export function renderNotificacionesView(usuarioActual) {
  const container = document.createElement('div');
  container.className = 'container';

  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px;">
      <div>
        <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: var(--primary); display: flex; align-items: center; gap: 10px;">
          <span style="display: flex; align-items: center; color: var(--primary);">${icons.bell || '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>'}</span>
          <span>Notificaciones</span>
        </h1>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: var(--text-muted);">Gestiona tus solicitudes de seguimiento e interacciones sociales</p>
      </div>

      <button id="btnLimpiarNotifs" class="btn-outline" style="width: auto; padding: 6px 14px; font-size: 11px; font-weight: 700; margin: 0; border-radius: 8px; display: none;">
        Limpiar todas
      </button>
    </div>

    <div class="card" style="padding: 20px; max-width: 620px; border-radius: 16px;">
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

    if (btnLimpiar) btnLimpiar.style.display = 'block';

    const emisorIds = [...new Set(notifs.map(n => n.emisor_id))];
    const { data: perfiles } = await supabase.from('perfiles').select('*').in('id', emisorIds);
    const mapaPerfiles = {};
    (perfiles || []).forEach(p => { mapaPerfiles[p.id] = p; });

    lista.innerHTML = notifs.map(n => {
      const emisor = mapaPerfiles[n.emisor_id] || {};
      const esSolicitud = n.tipo === 'solicitud_seguimiento';
      const esConexionMutua = n.tipo === 'conexion_mutua';

      let textoNotificacion = '';
      if (esSolicitud) {
        textoNotificacion = 'quiere seguirte.';
      } else if (esConexionMutua) {
        textoNotificacion = 'y tú ahora os seguís mutuamente. 🎉';
      } else if (n.tipo === 'seguimiento_aceptado') {
        textoNotificacion = 'ha aceptado tu solicitud de seguimiento.';
      } else {
        textoNotificacion = 'ha interactuado contigo.';
      }

      return `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; background: var(--input-bg); border-radius: 12px; border: 1px solid var(--border); flex-wrap: wrap; gap: 10px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 36px; height: 36px; border-radius: 50%; background: #e6f4f4; color: #2ba8a8; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 13px; overflow: hidden; flex-shrink: 0;">
              ${emisor.avatar_url ? `<img src="${emisor.avatar_url}" style="width:100%; height:100%; object-fit:cover;" />` : (emisor.username || 'U').charAt(0).toUpperCase()}
            </div>
            <div>
              <div style="font-size: 12px; color: var(--text-main); line-height: 1.3;">
                <strong style="color: var(--text-main);">@${emisor.username || 'usuario'}</strong> ${textoNotificacion}
              </div>
              <div style="font-size: 10px; color: var(--text-muted); margin-top: 2px;">${new Date(n.created_at).toLocaleDateString()}</div>
            </div>
          </div>

          ${esSolicitud ? `
            <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
              <button class="btn-aceptar-y-seguir btn-primary" data-notifid="${n.id}" data-emisorid="${emisor.id}" style="width: auto; padding: 6px 12px; font-size: 11px; font-weight: 700; margin: 0; border-radius: 6px; display: inline-flex; align-items: center; gap: 4px;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
                <span>Aceptar y seguir también</span>
              </button>

              <button class="btn-aceptar btn-outline" data-notifid="${n.id}" data-emisorid="${emisor.id}" style="width: auto; padding: 6px 12px; font-size: 11px; font-weight: 700; margin: 0; border-radius: 6px;">
                Solo aceptar
              </button>

              <button class="btn-rechazar btn-outline" data-notifid="${n.id}" data-emisorid="${emisor.id}" style="width: auto; padding: 6px 12px; font-size: 11px; font-weight: 700; margin: 0; border-radius: 6px; color: var(--danger); border-color: var(--danger);">
                Rechazar
              </button>
            </div>
          ` : `
            <button class="btn-borrar-notif btn-outline" data-notifid="${n.id}" title="Eliminar notificación" style="width: 24px; height: 24px; padding: 0; margin: 0; border-radius: 6px; border: none; color: var(--text-muted); display: inline-flex; align-items: center; justify-content: center;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          `}
        </div>
      `;
    }).join('');

    // ACEPTAR Y SEGUIR TAMBIÉN
    lista.querySelectorAll('.btn-aceptar-y-seguir').forEach(btn => {
      btn.addEventListener('click', async () => {
        const notifId = btn.getAttribute('data-notifid');
        const emisorId = btn.getAttribute('data-emisorid');

        btn.disabled = true;
        btn.innerText = 'Procesando...';

        try {
          // 1. Aceptar solicitud recibida
          await supabase.from('seguidores').update({ estado: 'aceptado' }).eq('seguidor_id', emisorId).eq('seguido_id', usuarioActual.id);

          // 2. Registrar el seguimiento reciproco
          await supabase.from('seguidores').upsert([{
            seguidor_id: usuarioActual.id,
            seguido_id: emisorId,
            estado: 'aceptado'
          }]);

          // 3. Transformar la notificación actual en una confirmación de conexión mutua
          await supabase.from('notificaciones').update({ tipo: 'conexion_mutua', leida: true }).eq('id', notifId);

          // 4. Notificar al emisor original que también le sigues
          await supabase.from('notificaciones').insert([{
            user_id: emisorId,
            emisor_id: usuarioActual.id,
            tipo: 'conexion_mutua',
            leida: false
          }]);

        } catch (err) {
          console.error('Error al aceptar y seguir:', err);
        }

        cargarNotificaciones();
      });
    });

    // SOLO ACEPTAR
    lista.querySelectorAll('.btn-aceptar').forEach(btn => {
      btn.addEventListener('click', async () => {
        const notifId = btn.getAttribute('data-notifid');
        const emisorId = btn.getAttribute('data-emisorid');

        btn.disabled = true;
        btn.innerText = 'Aceptando...';

        try {
          await supabase.from('seguidores').update({ estado: 'aceptado' }).eq('seguidor_id', emisorId).eq('seguido_id', usuarioActual.id);
          
          await supabase.from('notificaciones').update({ tipo: 'seguimiento_aceptado', leida: true }).eq('id', notifId);

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

    // RECHAZAR
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

    // BORRAR NOTIFICACIÓN INDIVIDUAL
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