import { supabase } from '../supabase.js';
import { icons } from '../icons.js';

// ⚡ CACHÉ EN MEMORIA PARA CONSERVAR LOS DATOS DE PERFILES CONSULTADOS
let cachePerfilesMemoria = {};

export function renderPerfilView(usuarioActual, targetUserId = null, vistaOrigen = null) {
  const container = document.createElement('div');
  container.className = 'container';

  // Si no se pasa un ID objetivo o es el mismo, estamos en nuestro perfil
  const esMiPerfil = !targetUserId || targetUserId === usuarioActual.id;
  const perfilId = targetUserId || usuarioActual.id;

  let avatarBase64 = null;
  let mostrandoCambioPass = false;
  let estadoSeguimiento = 'ninguno'; // 'aceptado', 'pendiente', 'ninguno'

  const datosCached = cachePerfilesMemoria[perfilId];

  container.innerHTML = `
    <!-- CABECERA DE LA PÁGINA CON BOTÓN DE VOLVER INTELIGENTE -->
    <div style="margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
      <div>
        <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: var(--primary); display: flex; align-items: center; gap: 10px;">
          <span style="display: flex; align-items: center; color: var(--primary);">${icons.perfil}</span>
          <span>${esMiPerfil ? 'Mi Perfil' : 'Perfil de Usuario'}</span>
        </h1>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: var(--text-muted);">
          ${esMiPerfil ? 'Gestiona tu información pública e interacciones en BiteLife' : 'Consulta sus recetas e interacciones en la comunidad'}
        </p>
      </div>

      <!-- BOTÓN VOLVER GENÉRICO -->
      ${!esMiPerfil ? `
        <button id="btnVolverAtras" class="btn-outline" style="width: auto; margin: 0; padding: 8px 16px; font-size: 13px; font-weight: 700; border-radius: 10px; display: inline-flex; align-items: center; gap: 6px; white-space: nowrap; flex-shrink: 0;">
          ◀ Volver
        </button>
      ` : ''}
    </div>

    <!-- HEADER PERFIL SOCIAL -->
    <div class="card" style="padding: 20px; border-radius: 20px; margin-bottom: 24px;">
      <div style="display: flex; flex-direction: column; gap: 20px;">
        
        <!-- BLOQUE SUPERIOR: AVATAR + DATOS + BOTÓN COMPACTO -->
        <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; width: 100%;">
          
          <div style="display: flex; align-items: center; gap: 14px; min-width: 0; flex: 1;">
            <div id="avatarContainer" style="width: 76px; height: 76px; border-radius: 50%; background: var(--primary-light); color: var(--primary); display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: 800; border: 3px solid var(--primary); flex-shrink: 0; overflow: hidden; box-shadow: var(--shadow);">
              ${datosCached && datosCached.perfil?.avatar_url ? `<img src="${datosCached.perfil.avatar_url}" style="width: 100%; height: 100%; object-fit: cover;" />` : icons.user}
            </div>
            
            <div style="min-width: 0; flex: 1;">
              <h2 id="lblNombreCompleto" style="margin: 0; font-size: 18px; font-weight: 800; color: var(--text-main); line-height: 1.2; word-break: break-word;">
                ${datosCached ? (datosCached.perfil?.nombre_completo || 'Usuario de BiteLife') : 'Cargando...'}
              </h2>
              <div id="lblUsername" style="font-size: 13px; font-weight: 700; color: var(--primary); margin-top: 2px;">
                ${datosCached ? `@${datosCached.perfil?.username || 'usuario'}` : '@...'}
              </div>
              <div id="lblEmail" style="font-size: 11px; color: var(--text-muted); margin-top: 2px; word-break: break-all; line-height: 1.3;">
                ${esMiPerfil ? usuarioActual.email : ''}
              </div>
            </div>
          </div>

          <div style="flex-shrink: 0;">
            ${esMiPerfil ? `
              <button id="btnAbrirModalEditar" class="btn-outline" style="width: auto; padding: 6px 12px; margin: 0; font-size: 12px; font-weight: 700; border-radius: 10px; display: inline-flex; align-items: center; gap: 6px; white-space: nowrap;">
                ${icons.settings} Editar
              </button>
            ` : `
              <button id="btnSeguirUsuario" class="btn-primary" style="width: auto; padding: 6px 16px; margin: 0; font-size: 12px; font-weight: 700; border-radius: 10px; white-space: nowrap;">
                Seguir
              </button>
            `}
          </div>

        </div>

        <!-- BLOQUE INFERIOR: CONTADORES SOCIALES -->
        <div style="display: flex; justify-content: space-around; align-items: center; padding-top: 14px; border-top: 1px solid var(--border); text-align: center; width: 100%;">
          <div style="cursor: pointer; flex: 1;" id="btnVerSeguidores">
            <div id="cntSeguidores" style="font-size: 18px; font-weight: 800; color: var(--text-main);">${datosCached ? datosCached.seguidores : '0'}</div>
            <div style="font-size: 10px; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Seguidores</div>
          </div>
          <div style="width: 1px; height: 24px; background: var(--border);"></div>
          <div style="cursor: pointer; flex: 1;" id="btnVerSiguiendo">
            <div id="cntSiguiendo" style="font-size: 18px; font-weight: 800; color: var(--text-main);">${datosCached ? datosCached.siguiendo : '0'}</div>
            <div style="font-size: 10px; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Siguiendo</div>
          </div>
          <div style="width: 1px; height: 24px; background: var(--border);"></div>
          <div style="flex: 1;">
            <div id="cntRecetasPublicas" style="font-size: 18px; font-weight: 800; color: var(--primary);">${datosCached ? datosCached.cPublicas : '0'}</div>
            <div style="font-size: 10px; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Públicas</div>
          </div>
        </div>

      </div>
    </div>

    <!-- PESTAÑAS -->
    <div style="display: flex; gap: 10px; margin-bottom: 20px; border-bottom: 1px solid var(--border); padding-bottom: 12px;">
      <button id="tabBtnMisPublicas" class="btn-outline" style="width: auto; padding: 8px 16px; margin: 0; font-size: 13px; font-weight: 700; border-radius: 10px; background: var(--primary-light); color: var(--primary); border-color: var(--primary); display: flex; align-items: center; gap: 6px; white-space: nowrap;">
        ${icons.globe} Recetas Públicas
      </button>
      <button id="tabBtnListaSeguidores" class="btn-outline" style="width: auto; padding: 8px 16px; margin: 0; font-size: 13px; font-weight: 700; border-radius: 10px; display: flex; align-items: center; gap: 6px; white-space: nowrap;">
        ${icons.users} Seguidores / Siguiendo
      </button>
    </div>

    <!-- SECCIÓN 1: MIS RECETAS PÚBLICAS -->
    <div id="secMisPublicas">
      <div id="gridMisPublicas" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 14px;">
        ${datosCached && datosCached.publicas ? '' : 'Cargando recetas...'}
      </div>
    </div>

    <!-- SECCIÓN 2: LISTAS SOCIALES DE ESTE PERFIL -->
    <div id="secListaSeguidores" class="hidden">
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 18px;">
        <div class="card" style="padding: 18px;">
          <h3 style="margin-top: 0; font-size: 15px; color: var(--primary); font-weight: 800; display: flex; align-items: center; gap: 6px;">
            ${icons.users} Personas que le siguen
          </h3>
          <div id="listaSeguidoresMeSiguen" style="display: flex; flex-direction: column; gap: 10px; margin-top: 12px;"></div>
        </div>

        <div class="card" style="padding: 18px;">
          <h3 style="margin-top: 0; font-size: 15px; color: var(--primary); font-weight: 800; display: flex; align-items: center; gap: 6px;">
            ${icons.users} Personas a las que sigue
          </h3>
          <div id="listaSeguidoresYoSigo" style="display: flex; flex-direction: column; gap: 10px; margin-top: 12px;"></div>
        </div>
      </div>
    </div>

    <!-- MODAL DETALLE DE RECETA DEL PERFIL -->
    <div id="modalDetallePerfilReceta" class="sidebar-overlay">
      <div class="card modal-dialog-content" style="max-width: 480px; width: 92%; margin: 40px auto; max-height: 85vh; overflow-y: auto; padding: 20px; position: relative; border-radius: 20px;">
        <button id="btnCloseDetallePerfilReceta" style="position: absolute; top: 14px; right: 14px; width: 28px; height: 28px; background: var(--input-bg); border: 1px solid var(--border); border-radius: 50%; font-size: 14px; color: var(--text-muted); cursor: pointer; display: flex; align-items: center; justify-content: center; margin: 0; padding: 0; z-index: 10;">✕</button>
        <div id="contenidoDetallePerfilReceta"></div>
      </div>
    </div>

    <!-- MODAL EDITAR PERFIL (SÓLO SI ES MI PERFIL) -->
    ${esMiPerfil ? `
    <div id="modalEditarPerfil" class="sidebar-overlay">
      <div class="card" style="max-width: 480px; width: 92%; margin: 40px auto; padding: 24px; position: relative; border-radius: 20px; max-height: 85vh; overflow-y: auto;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px;">
          <h3 style="margin: 0; font-size: 18px; font-weight: 800; color: var(--primary); display: flex; align-items: center; gap: 6px;">${icons.settings} Ajustes del Perfil</h3>
          <button id="btnCloseModalEditar" style="background: none; border: none; font-size: 20px; color: var(--text-muted); cursor: pointer; padding: 0; margin: 0; width: auto;">✕</button>
        </div>

        <form id="formPerfil" style="display: flex; flex-direction: column; gap: 14px;">
          <div style="text-align: center; margin-bottom: 4px;">
            <div id="avatarPreviewBox" style="width: 72px; height: 72px; border-radius: 50%; background: var(--input-bg); margin: 0 auto 10px auto; overflow: hidden; display: flex; align-items: center; justify-content: center; border: 2px solid var(--border); font-size: 28px;">
              ${icons.user}
            </div>
            <label for="inputAvatarFile" class="btn-outline" style="display: inline-flex; align-items: center; gap: 6px; width: auto; padding: 6px 14px; font-size: 12px; font-weight: 700; border-radius: 8px; cursor: pointer; margin: 0;">
              ${icons.camera} Cambiar foto de perfil
            </label>
            <input type="file" id="inputAvatarFile" accept="image/*" style="display: none;" />
          </div>

          <div>
            <label style="font-size: 12px; font-weight: 700; color: var(--text-muted);">Nombre de Usuario (@username)</label>
            <input type="text" id="inputUsername" placeholder="" required style="text-transform: lowercase; margin-top: 4px;" />
          </div>

          <div>
            <label style="font-size: 12px; font-weight: 700; color: var(--text-muted);">Nombre Completo</label>
            <input type="text" id="inputNombreCompleto" placeholder="" style="margin-top: 4px;" />
          </div>

          <div style="margin-top: 6px; padding-top: 14px; border-top: 1px solid var(--border);">
            <button type="button" id="btnToggleSeccionPass" class="btn-outline" style="width: 100%; padding: 10px; font-size: 12px; font-weight: 700; border-radius: 10px; display: flex; align-items: center; justify-content: center; gap: 6px; margin: 0;">
              ${icons.lock} Cambiar contraseña
            </button>

            <div id="secCambiarPassword" class="hidden" style="margin-top: 12px; padding: 12px; background: var(--input-bg); border-radius: 12px; border: 1px solid var(--border); display: flex; flex-direction: column; gap: 10px;">
              <div>
                <label style="font-size: 11px; font-weight: 700; color: var(--text-muted);">Nueva Contraseña</label>
                <div class="password-wrapper" style="margin-top: 4px; position: relative; display: flex; align-items: center;">
                  <input type="password" id="inputNuevaPassword" placeholder="••••••••" style="height: 38px; width: 100%; padding-right: 36px;" />
                  <button type="button" class="toggle-password" id="btnTogglePass1" title="Mostrar u ocultar contraseña" style="position: absolute; right: 8px; background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 4px; display: flex; align-items: center;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  </button>
                </div>
              </div>

              <div>
                <label style="font-size: 11px; font-weight: 700; color: var(--text-muted);">Repite la Nueva Contraseña</label>
                <div class="password-wrapper" style="margin-top: 4px; position: relative; display: flex; align-items: center;">
                  <input type="password" id="inputConfirmarPassword" placeholder="••••••••" style="height: 38px; width: 100%; padding-right: 36px;" />
                  <button type="button" class="toggle-password" id="btnTogglePass2" title="Mostrar u ocultar contraseña" style="position: absolute; right: 8px; background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 4px; display: flex; align-items: center;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  </button>
                </div>
              </div>

              <p style="font-size: 10px; color: var(--text-muted); margin: 0;">Mínimo 6 caracteres, 1 mayúscula, 1 número y 1 carácter especial.</p>
            </div>
          </div>

          <div id="msgPerfil" style="font-size: 13px; padding: 10px; border-radius: 10px; display: none;"></div>

          <div style="display: flex; gap: 10px; justify-content: space-between; align-items: center; margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--border);">
            <button type="button" id="btnEliminarCuenta" class="btn-outline" style="width: auto; margin:0; padding: 8px 14px; font-size: 12px; font-weight: 700; color: var(--danger); border-color: var(--danger); display: inline-flex; align-items: center; gap: 6px;">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              <span>Eliminar cuenta</span>
            </button>

            <div style="display: flex; gap: 10px;">
              <button type="button" id="btnCancelarModal" class="btn-outline" style="width: auto; margin:0; padding: 8px 16px;">Cancelar</button>
              <button type="submit" id="btnGuardarPerfil" class="btn-primary" style="width: auto; margin:0; padding: 8px 20px;">Guardar Cambios</button>
            </div>
          </div>
        </form>
      </div>
    </div>

    <!-- MODAL CONFIRMACIÓN DE ELIMINACIÓN DE CUENTA -->
    <div id="modalConfirmarEliminar" class="sidebar-overlay">
      <div class="card" style="max-width: 400px; width: 90%; margin: 100px auto; padding: 24px; border-radius: 20px; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.15);">
        <div style="width: 52px; height: 52px; border-radius: 50%; background: #fee2e2; color: var(--danger); display: inline-flex; align-items: center; justify-content: center; margin-bottom: 14px;">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
        </div>
        <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 800; color: var(--text-main);">¿Eliminar tu cuenta?</h3>
        <p style="margin: 0 0 20px 0; font-size: 13px; color: var(--text-muted); line-height: 1.5;">
          Esta acción eliminará de forma permanente tus recetas, notificaciones, interacciones sociales y tu acceso a <strong>BiteLife</strong>.
        </p>
        <div style="display: flex; gap: 10px; justify-content: center;">
          <button id="btnCancelarEliminarModal" class="btn-outline" style="width: 50%; margin: 0; padding: 10px; font-size: 13px; font-weight: 700; border-radius: 10px;">Cancelar</button>
          <button id="btnConfirmarEliminarModal" class="btn-primary" style="width: 50%; margin: 0; padding: 10px; font-size: 13px; font-weight: 700; border-radius: 10px; background: var(--danger); border-color: var(--danger);">Sí, eliminar</button>
        </div>
      </div>
    </div>
    ` : ''}
  `;

  // ELEMENTOS
  const lblNombre = container.querySelector('#lblNombreCompleto');
  const lblUser = container.querySelector('#lblUsername');
  const lblEmail = container.querySelector('#lblEmail');
  const avatarBox = container.querySelector('#avatarContainer');

  const cntSeguidores = container.querySelector('#cntSeguidores');
  const cntSiguiendo = container.querySelector('#cntSiguiendo');
  const cntPublicas = container.querySelector('#cntRecetasPublicas');

  const secPublicas = container.querySelector('#secMisPublicas');
  const secSocial = container.querySelector('#secListaSeguidores');

  const tabPublicas = container.querySelector('#tabBtnMisPublicas');
  const tabSocial = container.querySelector('#tabBtnListaSeguidores');

  const modalDetalle = container.querySelector('#modalDetallePerfilReceta');
  const contenidoDetalle = container.querySelector('#contenidoDetallePerfilReceta');
  const btnCloseDetalle = container.querySelector('#btnCloseDetallePerfilReceta');

  btnCloseDetalle.addEventListener('click', () => modalDetalle.classList.remove('visible'));
  modalDetalle.addEventListener('click', (e) => { if (e.target === modalDetalle) modalDetalle.classList.remove('visible'); });

  const btnVolver = container.querySelector('#btnVolverAtras');
  if (btnVolver) {
    btnVolver.addEventListener('click', () => {
      const appContent = document.querySelector('.main-content');
      if (appContent) {
        appContent.innerHTML = '';
        if (typeof vistaOrigen === 'function') {
          appContent.appendChild(vistaOrigen());
        } else {
          appContent.appendChild(renderPerfilView(usuarioActual, usuarioActual.id));
        }
      }
    });
  }

  const btnSeguir = container.querySelector('#btnSeguirUsuario');
  if (btnSeguir) {
    comprobarEstadoSeguimiento();
    btnSeguir.addEventListener('click', toggleSeguirUsuario);
  }

  async function comprobarEstadoSeguimiento() {
    const { data } = await supabase
      .from('seguidores')
      .select('*')
      .eq('seguidor_id', usuarioActual.id)
      .eq('seguido_id', perfilId)
      .maybeSingle();

    if (data) {
      estadoSeguimiento = data.estado || 'aceptado';
      if (estadoSeguimiento === 'aceptado') {
        btnSeguir.innerText = 'Siguiendo';
        btnSeguir.className = 'btn-outline';
        btnSeguir.style.color = 'var(--text-muted)';
        btnSeguir.disabled = false;
      } else {
        btnSeguir.innerText = 'Solicitado';
        btnSeguir.className = 'btn-outline';
        btnSeguir.style.color = 'var(--text-muted)';
        btnSeguir.disabled = false;
      }
    } else {
      estadoSeguimiento = 'ninguno';
      btnSeguir.innerText = 'Seguir';
      btnSeguir.className = 'btn-primary';
      btnSeguir.style.color = 'white';
      btnSeguir.disabled = false;
    }
  }

  // ⚡ CONMUTAR SEGUIR / CANCELAR SOLICITUD / DEJAR DE SEGUIR
  async function toggleSeguirUsuario() {
    btnSeguir.disabled = true;

    const { data: relacionExistente } = await supabase
      .from('seguidores')
      .select('*')
      .eq('seguidor_id', usuarioActual.id)
      .eq('seguido_id', perfilId)
      .maybeSingle();

    if (relacionExistente) {
      // CANCELAR / DEJAR DE SEGUIR
      await supabase.from('seguidores').delete().eq('id', relacionExistente.id);
      
      await supabase.from('notificaciones')
        .delete()
        .eq('emisor_id', usuarioActual.id)
        .eq('user_id', perfilId)
        .eq('tipo', 'solicitud_seguimiento');
    } else {
      // SEGUIR + ENVIAR NOTIFICACIÓN
      await supabase.from('seguidores').insert([{
        seguidor_id: usuarioActual.id,
        seguido_id: perfilId,
        estado: 'aceptado'
      }]);

      await supabase.from('notificaciones').insert([{
        user_id: perfilId,
        emisor_id: usuarioActual.id,
        tipo: 'solicitud_seguimiento',
        leida: false
      }]);
    }

    btnSeguir.disabled = false;
    await comprobarEstadoSeguimiento();
    cargarPerfil();
    cargarMisRecetasPublicas();
  }

  if (esMiPerfil) {
    const modalEditar = container.querySelector('#modalEditarPerfil');
    const modalEliminar = container.querySelector('#modalConfirmarEliminar');
    const btnAbrirModal = container.querySelector('#btnAbrirModalEditar');
    const btnCloseModal = container.querySelector('#btnCloseModalEditar');
    const btnCancelarModal = container.querySelector('#btnCancelarModal');
    const btnEliminarCuenta = container.querySelector('#btnEliminarCuenta');
    const btnCancelarEliminar = container.querySelector('#btnCancelarEliminarModal');
    const btnConfirmarEliminar = container.querySelector('#btnConfirmarEliminarModal');
    const btnToggleSeccionPass = container.querySelector('#btnToggleSeccionPass');
    const secCambiarPassword = container.querySelector('#secCambiarPassword');

    const inputUsername = container.querySelector('#inputUsername');
    const inputNombreCompleto = container.querySelector('#inputNombreCompleto');
    const inputNuevaPassword = container.querySelector('#inputNuevaPassword');
    const inputConfirmarPassword = container.querySelector('#inputConfirmarPassword');
    const btnTogglePass1 = container.querySelector('#btnTogglePass1');
    const btnTogglePass2 = container.querySelector('#btnTogglePass2');
    const inputAvatarFile = container.querySelector('#inputAvatarFile');
    const avatarPreviewBox = container.querySelector('#avatarPreviewBox');
    const form = container.querySelector('#formPerfil');
    const msg = container.querySelector('#msgPerfil');

    btnTogglePass1.addEventListener('click', () => {
      inputNuevaPassword.type = inputNuevaPassword.type === 'password' ? 'text' : 'password';
    });

    btnTogglePass2.addEventListener('click', () => {
      inputConfirmarPassword.type = inputConfirmarPassword.type === 'password' ? 'text' : 'password';
    });

    btnToggleSeccionPass.addEventListener('click', () => {
      mostrandoCambioPass = !mostrandoCambioPass;
      if (mostrandoCambioPass) {
        secCambiarPassword.classList.remove('hidden');
        btnToggleSeccionPass.style.background = 'var(--primary-light)';
        btnToggleSeccionPass.style.color = 'var(--primary)';
        btnToggleSeccionPass.style.borderColor = 'var(--primary)';
      } else {
        secCambiarPassword.classList.add('hidden');
        btnToggleSeccionPass.style.background = 'transparent';
        btnToggleSeccionPass.style.color = 'var(--text-main)';
        btnToggleSeccionPass.style.borderColor = 'var(--border)';
        inputNuevaPassword.value = '';
        inputConfirmarPassword.value = '';
      }
    });

    btnAbrirModal.addEventListener('click', () => modalEditar.classList.add('visible'));

    function cerrarModalAjustes() {
      modalEditar.classList.remove('visible');
      mostrandoCambioPass = false;
      secCambiarPassword.classList.add('hidden');
      btnToggleSeccionPass.style.background = 'transparent';
      btnToggleSeccionPass.style.color = 'var(--text-main)';
      btnToggleSeccionPass.style.borderColor = 'var(--border)';
      inputNuevaPassword.value = '';
      inputConfirmarPassword.value = '';
      msg.style.display = 'none';
    }

    btnCloseModal.addEventListener('click', cerrarModalAjustes);
    btnCancelarModal.addEventListener('click', cerrarModalAjustes);
    modalEditar.addEventListener('click', (e) => { if (e.target === modalEditar) cerrarModalAjustes(); });

    btnEliminarCuenta.addEventListener('click', () => modalEliminar.classList.add('visible'));
    btnCancelarEliminar.addEventListener('click', () => modalEliminar.classList.remove('visible'));
    modalEliminar.addEventListener('click', (e) => { if (e.target === modalEliminar) modalEliminar.classList.remove('visible'); });

    btnConfirmarEliminar.addEventListener('click', async () => {
      btnConfirmarEliminar.disabled = true;
      btnConfirmarEliminar.innerText = 'Eliminando...';

      try {
        const { error: rpcErr } = await supabase.rpc('borrar_cuenta_usuario');
        if (rpcErr) {
          alert('Error al eliminar la cuenta: ' + rpcErr.message);
          btnConfirmarEliminar.disabled = false;
          btnConfirmarEliminar.innerText = 'Sí, eliminar';
          modalEliminar.classList.remove('visible');
          return;
        }
        await supabase.auth.signOut();
        window.location.reload();
      } catch (err) {
        alert('Error inesperado: ' + err.message);
        btnConfirmarEliminar.disabled = false;
        btnConfirmarEliminar.innerText = 'Sí, eliminar';
        modalEliminar.classList.remove('visible');
      }
    });

    inputAvatarFile.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          avatarBase64 = event.target.result;
          avatarPreviewBox.innerHTML = `<img src="${avatarBase64}" style="width:100%; height:100%; object-fit:cover;" />`;
        };
        reader.readAsDataURL(file);
      }
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const usernameLimpio = inputUsername.value.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
      const nombreCompleto = inputNombreCompleto.value.trim();
      const pass1 = inputNuevaPassword.value;
      const pass2 = inputConfirmarPassword.value;

      if (!usernameLimpio) {
        msg.style.display = 'block';
        msg.style.background = '#fee2e2';
        msg.style.color = 'var(--danger)';
        msg.innerText = 'Username no válido.';
        return;
      }

      const { error: perfilErr } = await supabase.from('perfiles').upsert({
        id: usuarioActual.id,
        username: usernameLimpio,
        nombre_completo: nombreCompleto,
        avatar_url: avatarBase64
      });

      if (perfilErr) {
        msg.style.display = 'block';
        msg.style.background = '#fee2e2';
        msg.style.color = 'var(--danger)';
        msg.innerText = perfilErr.code === '23505' ? 'El nombre de usuario ya está ocupado.' : 'Error al guardar el perfil.';
        return;
      }

      if (mostrandoCambioPass) {
        if (!pass1 || !pass2) {
          msg.style.display = 'block';
          msg.style.background = '#fee2e2';
          msg.style.color = 'var(--danger)';
          msg.innerText = 'Debes rellenar los dos campos de contraseña.';
          return;
        }

        if (pass1 !== pass2) {
          msg.style.display = 'block';
          msg.style.background = '#fee2e2';
          msg.style.color = 'var(--danger)';
          msg.innerText = 'Las contraseñas escritas no coinciden. Por favor, revísalas.';
          return;
        }

        const regEspecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;
        if (pass1.length < 6 || !/[A-Z]/.test(pass1) || !/[0-9]/.test(pass1) || !regEspecial.test(pass1)) {
          msg.style.display = 'block';
          msg.style.background = '#fee2e2';
          msg.style.color = 'var(--danger)';
          msg.innerText = 'La contraseña debe tener mínimo 6 caracteres, 1 mayúscula, 1 número y 1 carácter especial.';
          return;
        }

        const { error: passErr } = await supabase.auth.updateUser({ password: pass1 });
        if (passErr) {
          msg.style.display = 'block';
          msg.style.background = '#fee2e2';
          msg.style.color = 'var(--danger)';
          msg.innerText = 'Error actualizando contraseña: ' + passErr.message;
          return;
        }

        msg.style.display = 'block';
        msg.style.background = 'var(--primary-light)';
        msg.style.color = 'var(--primary)';
        msg.innerText = 'Contraseña cambiada con éxito. Cerrando sesión por seguridad...';

        setTimeout(async () => {
          await supabase.auth.signOut();
          window.location.reload();
        }, 2000);
        return;
      }

      msg.style.display = 'block';
      msg.style.background = 'var(--primary-light)';
      msg.style.color = 'var(--primary)';
      msg.innerText = '¡Ajustes e información guardados con éxito!';

      setTimeout(() => {
        cerrarModalAjustes();
        cargarPerfil();
      }, 1000);
    });
  }

  function cambiarPestana(activa) {
    [secPublicas, secSocial].forEach(s => s.classList.add('hidden'));
    [tabPublicas, tabSocial].forEach(t => {
      t.style.background = 'transparent';
      t.style.color = 'var(--text-main)';
      t.style.borderColor = 'var(--border)';
    });

    if (activa === 'publicas') {
      secPublicas.classList.remove('hidden');
      tabPublicas.style.background = 'var(--primary-light)';
      tabPublicas.style.color = 'var(--primary)';
      tabPublicas.style.borderColor = 'var(--primary)';
      cargarMisRecetasPublicas();
    } else if (activa === 'social') {
      secSocial.classList.remove('hidden');
      tabSocial.style.background = 'var(--primary-light)';
      tabSocial.style.color = 'var(--primary)';
      tabSocial.style.borderColor = 'var(--primary)';
      cargarListasSociales();
    }
  }

  tabPublicas.addEventListener('click', () => cambiarPestana('publicas'));
  tabSocial.addEventListener('click', () => cambiarPestana('social'));
  container.querySelector('#btnVerSeguidores').addEventListener('click', () => cambiarPestana('social'));
  container.querySelector('#btnVerSiguiendo').addEventListener('click', () => cambiarPestana('social'));

  // ABRIR DETALLE / AVISO PRIVADO
  function abrirDetalleRecetaPerfil(r, autorPerfil, misRecetasIds) {
    const yaGuardada = misRecetasIds.has(r.id) || misRecetasIds.has(r.receta_original_id);

    // PRIVACIDAD: SI NO ES MI PERFIL Y NO LO SIGO -> BLOQUEADO
    if (!esMiPerfil && estadoSeguimiento !== 'aceptado') {
      contenidoDetalle.innerHTML = `
        <div style="text-align: center; padding: 20px 10px;">
          <div style="width: 56px; height: 56px; border-radius: 50%; background: var(--primary-light); color: var(--primary); display: inline-flex; align-items: center; justify-content: center; margin-bottom: 14px;">
            ${icons.lock || '🔒'}
          </div>
          <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 800; color: var(--text-main);">Perfil Privado</h3>
          <p style="margin: 0 0 20px 0; font-size: 13px; color: var(--text-muted); line-height: 1.5;">
            Para ver los ingredientes y pasos completos de <strong>${r.nombre}</strong>, debes seguir a <strong>@${autorPerfil.username || 'usuario'}</strong>.
          </p>
          <button id="btnSeguirDesdeModal" class="btn-primary" style="width: 100%; padding: 10px; font-size: 13px; font-weight: 700; border-radius: 10px;">
            Seguir a @${autorPerfil.username || 'usuario'}
          </button>
        </div>
      `;

      const btnSeguirModal = contenidoDetalle.querySelector('#btnSeguirDesdeModal');
      if (btnSeguirModal) {
        btnSeguirModal.addEventListener('click', async () => {
          modalDetalle.classList.remove('visible');
          await toggleSeguirUsuario();
        });
      }

      modalDetalle.classList.add('visible');
      return;
    }

    // SI TIENE PERMISO (ES MI PERFIL O LO SIGO) -> MUESTRA LA RECETA COMPLETA
    const imgHtml = r.imagen_url ? `<img src="${r.imagen_url}" alt="${r.nombre}" style="width: 100%; max-height: 200px; object-fit: cover; border-radius: 12px; margin-bottom: 14px;" />` : '';
    
    const btnGuardarHtml = esMiPerfil ? '' : (yaGuardada ? `
      <button disabled class="btn-outline" style="width: 100%; padding: 8px 12px; font-size: 12px; font-weight: 700; border-radius: 10px; margin-top: 16px; background: var(--input-bg); color: var(--primary); border: 1px solid var(--primary-light); cursor: default;">
        ✓ Guardada en Mis Recetas
      </button>
    ` : `
      <button id="btnGuardarDesdePerfilModal" class="btn-primary" style="width: 100%; padding: 10px; font-size: 12px; font-weight: 700; border-radius: 10px; margin-top: 16px;">
        Guardar en Mis Recetas
      </button>
    `);

    contenidoDetalle.innerHTML = `
      ${imgHtml}
      <h2 style="margin: 0 0 6px 0; font-size: 18px; font-weight: 800; color: var(--primary);">${r.nombre}</h2>
      <div style="font-size: 12px; font-weight: 700; color: var(--text-muted); margin-bottom: 16px; display: flex; align-items: center; gap: 6px;">
        ${icons.time || '⏱'} ${r.tiempo_preparacion || 15} min ${r.categorias ? `• ${r.categorias}` : ''}
      </div>

      <div style="margin-bottom: 16px;">
        <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 700; color: var(--text-main); border-bottom: 1px solid var(--border); padding-bottom: 4px; display: flex; align-items: center; gap: 6px;">
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

      ${btnGuardarHtml}
    `;

    const btnGuardarModal = contenidoDetalle.querySelector('#btnGuardarDesdePerfilModal');
    if (btnGuardarModal) {
      btnGuardarModal.addEventListener('click', async () => {
        btnGuardarModal.disabled = true;
        btnGuardarModal.innerText = 'Guardando...';

        try {
          const idCreadorOriginal = r.autor_original_id || r.user_id;
          const idRecetaPadre = r.receta_original_id || r.id;

          const nuevaRecetaPayload = {
            user_id: usuarioActual.id,
            nombre: r.nombre.replace(/\s*\(de @[^)]+\)/gi, ''),
            ingredientes: r.ingredientes || '',
            pasos: r.pasos || '',
            tiempo_preparacion: r.tiempo_preparacion || 15,
            imagen_url: r.imagen_url || null,
            categorias: r.categorias || 'Comida',
            es_publica: false,
            receta_original_id: idRecetaPadre,
            autor_original_id: idCreadorOriginal
          };

          const { error: insertErr } = await supabase.from('recetas').insert([nuevaRecetaPayload]);
          if (insertErr) throw insertErr;

          btnGuardarModal.innerText = '¡Guardada!';
          modalDetalle.classList.remove('visible');
          cargarMisRecetasPublicas();
        } catch (err) {
          alert('Error al guardar: ' + err.message);
          btnGuardarModal.disabled = false;
          btnGuardarModal.innerText = 'Guardar en Mis Recetas';
        }
      });
    }

    modalDetalle.classList.add('visible');
  }

  // ⚡ CARGA DE DATOS DE PERFIL Y CONTADORES
  async function cargarPerfil() {
    const [resPerfil, resSeguidores, resSiguiendo, resPublicas] = await Promise.all([
      supabase.from('perfiles').select('*').eq('id', perfilId).single(),
      supabase.from('seguidores').select('seguidor_id').eq('seguido_id', perfilId),
      supabase.from('seguidores').select('seguido_id').eq('seguidor_id', perfilId),
      supabase.from('recetas').select('*', { count: 'exact', head: true }).eq('user_id', perfilId).eq('es_publica', true)
    ]);

    const perfil = resPerfil.data;
    const seguidores = resSeguidores.data ? resSeguidores.data.length : 0;
    const siguiendo = resSiguiendo.data ? resSiguiendo.data.length : 0;
    const cPublicas = resPublicas.count || 0;

    if (perfil) {
      lblNombre.innerText = perfil.nombre_completo || 'Usuario de BiteLife';
      lblUser.innerText = `@${perfil.username || 'usuario'}`;
      if (lblEmail) lblEmail.innerText = esMiPerfil ? usuarioActual.email : '';

      if (esMiPerfil) {
        const inputUsername = container.querySelector('#inputUsername');
        const inputNombreCompleto = container.querySelector('#inputNombreCompleto');
        const avatarPreviewBox = container.querySelector('#avatarPreviewBox');
        if (inputUsername) inputUsername.value = perfil.username || '';
        if (inputNombreCompleto) inputNombreCompleto.value = perfil.nombre_completo || '';
        avatarBase64 = perfil.avatar_url || null;
        if (perfil.avatar_url && avatarPreviewBox) {
          avatarPreviewBox.innerHTML = `<img src="${perfil.avatar_url}" style="width: 100%; height: 100%; object-fit: cover;" />`;
        }
      }

      if (perfil.avatar_url) {
        avatarBox.innerHTML = `<img src="${perfil.avatar_url}" style="width: 100%; height: 100%; object-fit: cover;" />`;
      } else {
        const inicial = (perfil.nombre_completo || perfil.username || 'U').charAt(0).toUpperCase();
        avatarBox.innerText = inicial;
      }
    }

    cntSeguidores.innerText = seguidores;
    cntSiguiendo.innerText = siguiendo;
    cntPublicas.innerText = cPublicas;

    if (!cachePerfilesMemoria[perfilId]) cachePerfilesMemoria[perfilId] = {};
    cachePerfilesMemoria[perfilId] = {
      ...cachePerfilesMemoria[perfilId],
      perfil,
      seguidores,
      siguiendo,
      cPublicas
    };
  }

  function renderizarPublicasHTML(publicas, mapaAutoresOriginales, misRecetasIds, perfilObj) {
    const grid = container.querySelector('#gridMisPublicas');
    if (!publicas || publicas.length === 0) {
      grid.innerHTML = '<p style="color: var(--text-muted); font-size: 13px; grid-column: 1/-1;">Este usuario no tiene recetas públicas.</p>';
      return;
    }

    grid.innerHTML = publicas.map(r => {
      const autorOriginal = r.autor_original_id ? mapaAutoresOriginales[r.autor_original_id] : null;
      const esCompartida = !!autorOriginal && autorOriginal.id !== r.user_id;

      return `
        <div class="card card-receta-perfil-item" data-id="${r.id}" style="padding: 12px; border: 1px solid var(--border); display: flex; flex-direction: column; justify-content: space-between; cursor: pointer; transition: transform 0.2s;">
          <div>
            ${r.imagen_url ? `<img src="${r.imagen_url}" style="width: 100%; height: 110px; object-fit: cover; border-radius: 10px; margin-bottom: 8px;" />` : ''}
            
            ${esCompartida ? `
              <div class="btn-ver-perfil-creador-original" data-autorid="${autorOriginal.id}" style="display: flex; align-items: center; gap: 4px; padding: 4px 8px; background: var(--primary-light); border-radius: 8px; margin-bottom: 8px; cursor: pointer; border: 1px solid var(--border);">
                <span style="font-size: 10px; color: var(--text-muted); flex-shrink: 0;">Creada por:</span>
                <span style="font-size: 11px; font-weight: 800; color: var(--primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">@${autorOriginal.username || 'usuario'}</span>
              </div>
            ` : ''}

            <h4 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 800; color: var(--text-main);">${r.nombre}</h4>
            <span style="font-size: 11px; color: var(--text-muted); display: flex; align-items: center; gap: 4px;">${icons.time || '⏱'} ${r.tiempo_preparacion || 15} min • ${icons.globe || '🌐'} Pública</span>
          </div>
        </div>
      `;
    }).join('');

    grid.querySelectorAll('.card-receta-perfil-item').forEach(card => {
      card.addEventListener('click', (e) => {
        const btnCreador = e.target.closest('.btn-ver-perfil-creador-original');
        if (btnCreador) {
          e.stopPropagation();
          const autorId = btnCreador.getAttribute('data-autorid');
          if (autorId) {
            const appContent = document.querySelector('.main-content');
            if (appContent) {
              appContent.innerHTML = '';
              appContent.appendChild(renderPerfilView(usuarioActual, autorId, () => renderPerfilView(usuarioActual, perfilId, vistaOrigen)));
            }
          }
          return;
        }

        const id = card.getAttribute('data-id');
        const recetaSel = publicas.find(item => item.id === id);
        if (recetaSel) {
          abrirDetalleRecetaPerfil(recetaSel, perfilObj, misRecetasIds);
        }
      });
    });
  }

  async function cargarMisRecetasPublicas() {
    try {
      const [resPublicas, resMisRecetas] = await Promise.all([
        supabase.from('recetas').select('*').eq('user_id', perfilId).eq('es_publica', true).order('created_at', { ascending: false }),
        supabase.from('recetas').select('id, receta_original_id').eq('user_id', usuarioActual.id)
      ]);

      const publicas = resPublicas.data || [];
      const misRecetasGuardadas = resMisRecetas.data || [];

      const misRecetasIds = new Set();
      misRecetasGuardadas.forEach(myR => {
        if (myR.receta_original_id) misRecetasIds.add(myR.receta_original_id);
        if (myR.id) misRecetasIds.add(myR.id);
      });

      const idsAutoresOriginales = [...new Set(publicas.map(r => r.autor_original_id).filter(Boolean))];
      const mapaAutoresOriginales = {};

      if (idsAutoresOriginales.length > 0) {
        const { data: perfilesOriginales } = await supabase
          .from('perfiles')
          .select('*')
          .in('id', idsAutoresOriginales);

        (perfilesOriginales || []).forEach(p => {
          mapaAutoresOriginales[p.id] = p;
        });
      }

      const perfilObj = (cachePerfilesMemoria[perfilId] && cachePerfilesMemoria[perfilId].perfil) || { username: 'usuario' };

      if (!cachePerfilesMemoria[perfilId]) cachePerfilesMemoria[perfilId] = {};
      cachePerfilesMemoria[perfilId].publicas = publicas;
      cachePerfilesMemoria[perfilId].mapaAutoresOriginales = mapaAutoresOriginales;

      renderizarPublicasHTML(publicas, mapaAutoresOriginales, misRecetasIds, perfilObj);

    } catch (err) {
      console.error("Error cargando recetas públicas del perfil:", err);
      container.querySelector('#gridMisPublicas').innerHTML = '<p style="color: var(--danger); font-size: 13px; grid-column: 1/-1;">Error al cargar las recetas de este perfil.</p>';
    }
  }

  async function cargarListasSociales() {
    const divMeSiguen = container.querySelector('#listaSeguidoresMeSiguen');
    const divYoSigo = container.querySelector('#listaSeguidoresYoSigo');

    divMeSiguen.innerHTML = '<p style="font-size:12px; color:var(--text-muted);">Cargando...</p>';
    divYoSigo.innerHTML = '<p style="font-size:12px; color:var(--text-muted);">Cargando...</p>';

    const [resSeguidores, resSiguiendo] = await Promise.all([
      supabase.from('seguidores').select('seguidor_id').eq('seguido_id', perfilId),
      supabase.from('seguidores').select('seguido_id').eq('seguidor_id', perfilId)
    ]);

    const relacionesSeguidores = resSeguidores.data || [];
    const relacionesSiguiendo = resSiguiendo.data || [];

    if (relacionesSeguidores.length > 0) {
      const idsSeguidores = relacionesSeguidores.map(s => s.seguidor_id);
      const { data: perfilesSeguidores } = await supabase.from('perfiles').select('*').in('id', idsSeguidores);

      divMeSiguen.innerHTML = (perfilesSeguidores || []).map(p => `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: var(--input-bg); border-radius: 12px; border: 1px solid var(--border);">
          <div style="display: flex; align-items: center; gap: 10px; cursor: pointer; min-width: 0; flex: 1;" class="btn-ver-perfil-item" data-id="${p.id}">
            <div style="width: 34px; height: 34px; border-radius: 50%; background: var(--primary-light); color: var(--primary); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 14px; overflow: hidden; flex-shrink: 0;">
              ${p.avatar_url ? `<img src="${p.avatar_url}" style="width:100%; height:100%; object-fit:cover;" />` : (p.username || 'U').charAt(0).toUpperCase()}
            </div>
            <div style="min-width: 0;">
              <div style="font-weight: 800; font-size: 13px; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${p.nombre_completo || p.username}</div>
              <div style="font-size: 11px; color: var(--primary); font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">@${p.username}</div>
            </div>
          </div>
        </div>
      `).join('');

      divMeSiguen.querySelectorAll('.btn-ver-perfil-item').forEach(el => {
        el.addEventListener('click', () => {
          const idTarget = el.getAttribute('data-id');
          const appContent = document.querySelector('.main-content');
          if (appContent) {
            appContent.innerHTML = '';
            appContent.appendChild(renderPerfilView(usuarioActual, idTarget, () => renderPerfilView(usuarioActual, perfilId, vistaOrigen)));
          }
        });
      });
    } else {
      divMeSiguen.innerHTML = '<p style="font-size:12px; color:var(--text-muted);">Nadie le sigue aún.</p>';
    }

    if (relacionesSiguiendo.length > 0) {
      const idsSiguiendo = relacionesSiguiendo.map(s => s.seguido_id);
      const { data: perfilesSiguiendo } = await supabase.from('perfiles').select('*').in('id', idsSiguiendo);

      divYoSigo.innerHTML = (perfilesSiguiendo || []).map(p => `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: var(--input-bg); border-radius: 12px; border: 1px solid var(--border);">
          <div style="display: flex; align-items: center; gap: 10px; cursor: pointer; min-width: 0; flex: 1;" class="btn-ver-perfil-item" data-id="${p.id}">
            <div style="width: 34px; height: 34px; border-radius: 50%; background: var(--primary-light); color: var(--primary); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 14px; overflow: hidden; flex-shrink: 0;">
              ${p.avatar_url ? `<img src="${p.avatar_url}" style="width:100%; height:100%; object-fit:cover;" />` : (p.username || 'U').charAt(0).toUpperCase()}
            </div>
            <div style="min-width: 0;">
              <div style="font-weight: 800; font-size: 13px; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${p.nombre_completo || p.username}</div>
              <div style="font-size: 11px; color: var(--primary); font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">@${p.username}</div>
            </div>
          </div>
          ${esMiPerfil ? `<button class="btn-unfollow btn-outline" data-id="${p.id}" style="width: auto; padding: 4px 10px; font-size: 11px; margin: 0; color: var(--danger); white-space: nowrap; flex-shrink: 0;">Dejar de seguir</button>` : ''}
        </div>
      `).join('');

      divYoSigo.querySelectorAll('.btn-ver-perfil-item').forEach(el => {
        el.addEventListener('click', () => {
          const idTarget = el.getAttribute('data-id');
          const appContent = document.querySelector('.main-content');
          if (appContent) {
            appContent.innerHTML = '';
            appContent.appendChild(renderPerfilView(usuarioActual, idTarget, () => renderPerfilView(usuarioActual, perfilId, vistaOrigen)));
          }
        });
      });

      if (esMiPerfil) {
        divYoSigo.querySelectorAll('.btn-unfollow').forEach(btn => {
          btn.addEventListener('click', async () => {
            const idBorrar = btn.getAttribute('data-id');
            await supabase.from('seguidores').delete().eq('seguidor_id', usuarioActual.id).eq('seguido_id', idBorrar);
            delete cachePerfilesMemoria[perfilId];
            cargarPerfil();
            cargarListasSociales();
          });
        });
      }
    } else {
      divYoSigo.innerHTML = '<p style="font-size:12px; color:var(--text-muted);">No sigue a nadie todavía.</p>';
    }
  }

  cargarPerfil();
  cargarMisRecetasPublicas();

  return container;
}