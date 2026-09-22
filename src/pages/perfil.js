import { supabase } from '../supabase.js';
import { icons } from '../icons.js';

export function renderPerfilView(usuarioActual) {
  const container = document.createElement('div');
  container.className = 'container';

  let avatarBase64 = null;
  let mostrandoCambioPass = false;

  container.innerHTML = `
    <!-- CABECERA DE LA PÁGINA -->
    <div style="margin-bottom: 20px;">
      <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: var(--primary); display: flex; align-items: center; gap: 10px;">
        <span style="display: flex; align-items: center; color: var(--primary);">${icons.perfil}</span>
        <span>Mi Perfil</span>
      </h1>
      <p style="margin: 4px 0 0 0; font-size: 13px; color: var(--text-muted);">Gestiona tu información pública e interacciones en BiteLife</p>
    </div>

    <!-- HEADER PERFIL SOCIAL -->
    <div class="card" style="padding: 28px; border-radius: 20px; margin-bottom: 24px;">
      <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 20px;">
        
        <div style="display: flex; align-items: center; gap: 20px;">
          <div id="avatarContainer" style="width: 80px; height: 80px; border-radius: 50%; background: var(--primary-light); color: var(--primary); display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: 800; border: 3px solid var(--primary); flex-shrink: 0; overflow: hidden; box-shadow: var(--shadow);">
            ${icons.user}
          </div>
          <div>
            <div style="display: flex; align-items: center; gap: 10px;">
              <h2 id="lblNombreCompleto" style="margin: 0; font-size: 22px; font-weight: 800; color: var(--text-main);">Cargando...</h2>
              <button id="btnAbrirModalEditar" class="btn-outline" style="width: auto; padding: 6px 12px; margin: 0; font-size: 12px; font-weight: 700; border-radius: 8px; display: inline-flex; align-items: center; gap: 6px;">
                ${icons.settings} Editar Perfil
              </button>
            </div>
            <div id="lblUsername" style="font-size: 14px; font-weight: 700; color: var(--primary); margin-top: 2px;">@...</div>
            <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">${usuarioActual.email}</div>
          </div>
        </div>

        <!-- CONTADORES SOCIALES -->
        <div style="display: flex; gap: 24px; text-align: center;">
          <div style="cursor: pointer;" id="btnVerSeguidores">
            <div id="cntSeguidores" style="font-size: 20px; font-weight: 800; color: var(--text-main);">0</div>
            <div style="font-size: 11px; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Seguidores</div>
          </div>
          <div style="cursor: pointer;" id="btnVerSiguiendo">
            <div id="cntSiguiendo" style="font-size: 20px; font-weight: 800; color: var(--text-main);">0</div>
            <div style="font-size: 11px; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Siguiendo</div>
          </div>
          <div>
            <div id="cntRecetasPublicas" style="font-size: 20px; font-weight: 800; color: var(--primary);">0</div>
            <div style="font-size: 11px; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Recetas Públicas</div>
          </div>
        </div>

      </div>
    </div>

    <!-- PESTAÑAS -->
    <div style="display: flex; gap: 10px; margin-bottom: 20px; border-bottom: 1px solid var(--border); padding-bottom: 12px;">
      <button id="tabBtnMisPublicas" class="btn-outline" style="width: auto; padding: 8px 18px; margin: 0; font-size: 13px; font-weight: 700; border-radius: 10px; background: var(--primary-light); color: var(--primary); border-color: var(--primary); display: flex; align-items: center; gap: 6px;">
        ${icons.globe} Mis Recetas Públicas
      </button>
      <button id="tabBtnListaSeguidores" class="btn-outline" style="width: auto; padding: 8px 18px; margin: 0; font-size: 13px; font-weight: 700; border-radius: 10px; display: flex; align-items: center; gap: 6px;">
        ${icons.users} Mis Seguidores / Siguiendo
      </button>
    </div>

    <!-- SECCIÓN 1: MIS RECETAS PÚBLICAS -->
    <div id="secMisPublicas">
      <div id="gridMisPublicas" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 14px;">
        Cargando recetas...
      </div>
    </div>

    <!-- SECCIÓN 2: LISTAS SOCIALES -->
    <div id="secListaSeguidores" class="hidden">
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
        <div class="card" style="padding: 20px;">
          <h3 style="margin-top: 0; font-size: 15px; color: var(--primary); font-weight: 800; display: flex; align-items: center; gap: 6px;">${icons.users} Personas que te siguen</h3>
          <div id="listaSeguidoresMeSiguen" style="display: flex; flex-direction: column; gap: 10px; margin-top: 12px;"></div>
        </div>

        <div class="card" style="padding: 20px;">
          <h3 style="margin-top: 0; font-size: 15px; color: var(--primary); font-weight: 800; display: flex; align-items: center; gap: 6px;">${icons.users} Personas a las que sigues</h3>
          <div id="listaSeguidoresYoSigo" style="display: flex; flex-direction: column; gap: 10px; margin-top: 12px;"></div>
        </div>
      </div>
    </div>

    <!-- MODAL EDITAR PERFIL -->
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
            <input type="text" id="inputUsername" placeholder="ej: marina_yague" required style="text-transform: lowercase; margin-top: 4px;" />
          </div>

          <div>
            <label style="font-size: 12px; font-weight: 700; color: var(--text-muted);">Nombre Completo</label>
            <input type="text" id="inputNombreCompleto" placeholder="ej: Marina Yagüe" style="margin-top: 4px;" />
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
  `;

  setTimeout(() => {
    const modalEditar = container.querySelector('#modalEditarPerfil');
    const btnAbrirModal = container.querySelector('#btnAbrirModalEditar');
    const btnCloseModal = container.querySelector('#btnCloseModalEditar');
    const btnCancelarModal = container.querySelector('#btnCancelarModal');
    const btnEliminarCuenta = container.querySelector('#btnEliminarCuenta');

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

    const lblNombre = container.querySelector('#lblNombreCompleto');
    const lblUser = container.querySelector('#lblUsername');
    const avatarBox = container.querySelector('#avatarContainer');

    const cntSeguidores = container.querySelector('#cntSeguidores');
    const cntSiguiendo = container.querySelector('#cntSiguiendo');
    const cntPublicas = container.querySelector('#cntRecetasPublicas');

    const secPublicas = container.querySelector('#secMisPublicas');
    const secSocial = container.querySelector('#secListaSeguidores');

    const tabPublicas = container.querySelector('#tabBtnMisPublicas');
    const tabSocial = container.querySelector('#tabBtnListaSeguidores');

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

    btnEliminarCuenta.addEventListener('click', async () => {
      const confirmacion = confirm('¿Estás seguro/a de que deseas eliminar tu cuenta?\n\nEsta acción eliminará de forma permanente todas tus recetas, notificaciones, perfil y tu acceso a BiteLife.');

      if (!confirmacion) return;

      btnEliminarCuenta.disabled = true;
      btnEliminarCuenta.innerHTML = '<span>Eliminando...</span>';

      try {
        const { error: rpcErr } = await supabase.rpc('borrar_cuenta_usuario');

        if (rpcErr) {
          alert('Error al eliminar la cuenta: ' + rpcErr.message);
          btnEliminarCuenta.disabled = false;
          btnEliminarCuenta.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg><span>Eliminar cuenta</span>';
          return;
        }

        await supabase.auth.signOut();
        window.location.reload();

      } catch (err) {
        alert('Error inesperado: ' + err.message);
        btnEliminarCuenta.disabled = false;
        btnEliminarCuenta.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg><span>Eliminar cuenta</span>';
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

    async function cargarPerfil() {
      const { data: perfil } = await supabase.from('perfiles').select('*').eq('id', usuarioActual.id).single();

      if (perfil) {
        lblNombre.innerText = perfil.nombre_completo || 'Usuario de BiteLife';
        lblUser.innerText = `@${perfil.username || 'usuario'}`;
        inputUsername.value = perfil.username || '';
        inputNombreCompleto.value = perfil.nombre_completo || '';
        avatarBase64 = perfil.avatar_url || null;

        if (perfil.avatar_url) {
          avatarBox.innerHTML = `<img src="${perfil.avatar_url}" style="width: 100%; height: 100%; object-fit: cover;" />`;
          avatarPreviewBox.innerHTML = `<img src="${perfil.avatar_url}" style="width: 100%; height: 100%; object-fit: cover;" />`;
        } else {
          const inicial = (perfil.nombre_completo || perfil.username || 'U').charAt(0).toUpperCase();
          avatarBox.innerText = inicial;
          avatarPreviewBox.innerText = inicial;
        }
      }

      const { data: seguidoresData } = await supabase
        .from('seguidores')
        .select('seguidor_id')
        .eq('seguido_id', usuarioActual.id)
        .or('estado.eq.aceptado,estado.is.null');

      const { data: siguiendoData } = await supabase
        .from('seguidores')
        .select('seguido_id')
        .eq('seguidor_id', usuarioActual.id)
        .or('estado.eq.aceptado,estado.is.null');

      const { count: cPublicas } = await supabase
        .from('recetas')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', usuarioActual.id)
        .eq('es_publica', true);

      cntSeguidores.innerText = seguidoresData ? seguidoresData.length : 0;
      cntSiguiendo.innerText = siguiendoData ? siguiendoData.length : 0;
      cntPublicas.innerText = cPublicas || 0;
    }

    async function cargarMisRecetasPublicas() {
      const grid = container.querySelector('#gridMisPublicas');
      grid.innerHTML = '<p style="color: var(--text-muted); font-size: 13px;">Cargando...</p>';

      const { data: publicas } = await supabase.from('recetas').select('*').eq('user_id', usuarioActual.id).eq('es_publica', true).order('created_at', { ascending: false });

      if (!publicas || publicas.length === 0) {
        grid.innerHTML = '<p style="color: var(--text-muted); font-size: 13px; grid-column: 1/-1;">Aún no tienes recetas públicas.</p>';
        return;
      }

      grid.innerHTML = publicas.map(r => `
        <div class="card" style="padding: 12px; border: 1px solid var(--border);">
          ${r.imagen_url ? `<img src="${r.imagen_url}" style="width: 100%; height: 110px; object-fit: cover; border-radius: 10px; margin-bottom: 8px;" />` : ''}
          <h4 style="margin: 0 0 4px 0; font-size: 14px;">${r.nombre}</h4>
          <span style="font-size: 11px; color: var(--text-muted); display: flex; align-items: center; gap: 4px;">${icons.time} ${r.tiempo_preparacion || 15} min • ${icons.globe} Pública</span>
        </div>
      `).join('');
    }

    async function cargarListasSociales() {
      const divMeSiguen = container.querySelector('#listaSeguidoresMeSiguen');
      const divYoSigo = container.querySelector('#listaSeguidoresYoSigo');

      divMeSiguen.innerHTML = '<p style="font-size:12px; color:var(--text-muted);">Cargando...</p>';
      divYoSigo.innerHTML = '<p style="font-size:12px; color:var(--text-muted);">Cargando...</p>';

      const { data: relacionesSeguidores } = await supabase
        .from('seguidores')
        .select('seguidor_id')
        .eq('seguido_id', usuarioActual.id)
        .or('estado.eq.aceptado,estado.is.null');

      const { data: relacionesSiguiendo } = await supabase
        .from('seguidores')
        .select('seguido_id')
        .eq('seguidor_id', usuarioActual.id)
        .or('estado.eq.aceptado,estado.is.null');

      if (relacionesSeguidores && relacionesSeguidores.length > 0) {
        const idsSeguidores = relacionesSeguidores.map(s => s.seguidor_id);
        const { data: perfilesSeguidores } = await supabase.from('perfiles').select('*').in('id', idsSeguidores);

        divMeSiguen.innerHTML = (perfilesSeguidores || []).map(p => `
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: var(--input-bg); border-radius: 12px; border: 1px solid var(--border);">
            <div style="display: flex; align-items: center; gap: 10px;">
              <div style="width: 34px; height: 34px; border-radius: 50%; background: var(--primary-light); color: var(--primary); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 14px; overflow: hidden;">
                ${p.avatar_url ? `<img src="${p.avatar_url}" style="width:100%; height:100%; object-fit:cover;" />` : (p.username || 'U').charAt(0).toUpperCase()}
              </div>
              <div>
                <div style="font-weight: 800; font-size: 13px; color: var(--text-main);">${p.nombre_completo || p.username}</div>
                <div style="font-size: 11px; color: var(--primary); font-weight: 700;">@${p.username}</div>
              </div>
            </div>
          </div>
        `).join('');
      } else {
        divMeSiguen.innerHTML = '<p style="font-size:12px; color:var(--text-muted);">Nadie te sigue aún.</p>';
      }

      if (relacionesSiguiendo && relacionesSiguiendo.length > 0) {
        const idsSiguiendo = relacionesSiguiendo.map(s => s.seguido_id);
        const { data: perfilesSiguiendo } = await supabase.from('perfiles').select('*').in('id', idsSiguiendo);

        divYoSigo.innerHTML = (perfilesSiguiendo || []).map(p => `
          <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: var(--input-bg); border-radius: 12px; border: 1px solid var(--border);">
            <div style="display: flex; align-items: center; gap: 10px;">
              <div style="width: 34px; height: 34px; border-radius: 50%; background: var(--primary-light); color: var(--primary); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 14px; overflow: hidden;">
                ${p.avatar_url ? `<img src="${p.avatar_url}" style="width:100%; height:100%; object-fit:cover;" />` : (p.username || 'U').charAt(0).toUpperCase()}
              </div>
              <div>
                <div style="font-weight: 800; font-size: 13px; color: var(--text-main);">${p.nombre_completo || p.username}</div>
                <div style="font-size: 11px; color: var(--primary); font-weight: 700;">@${p.username}</div>
              </div>
            </div>
            <button class="btn-unfollow btn-outline" data-id="${p.id}" style="width: auto; padding: 4px 10px; font-size: 11px; margin: 0; color: var(--danger);">Dejar de seguir</button>
          </div>
        `).join('');

        divYoSigo.querySelectorAll('.btn-unfollow').forEach(btn => {
          btn.addEventListener('click', async () => {
            const idBorrar = btn.getAttribute('data-id');
            await supabase.from('seguidores').delete().eq('seguidor_id', usuarioActual.id).eq('seguido_id', idBorrar);
            cargarPerfil();
            cargarListasSociales();
          });
        });
      } else {
        divYoSigo.innerHTML = '<p style="font-size:12px; color:var(--text-muted);">No sigues a nadie todavía.</p>';
      }
    }

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
          
          if (passErr.message && passErr.message.toLowerCase().includes('should be different')) {
            msg.innerText = 'La nueva contraseña debe ser diferente a la contraseña actual.';
          } else {
            msg.innerText = 'Error actualizando contraseña: ' + passErr.message;
          }
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

    cargarPerfil();
    cargarMisRecetasPublicas();
  }, 0);

  return container;
}