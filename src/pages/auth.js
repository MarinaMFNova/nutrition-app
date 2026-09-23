import { supabase } from '../supabase.js';
import { icons } from '../icons.js';

export function renderAuthView(onLoginSuccess) {
  const container = document.createElement('div');
  container.className = 'container';
  container.style.cssText = 'max-width: 420px; margin: 40px auto; min-height: calc(100vh - 80px); display: flex; align-items: center; justify-content: center;';

  let esRegistro = false;

  container.innerHTML = `
    <div class="card" style="width: 100%; padding: 32px; border-radius: 24px; box-shadow: var(--shadow);">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-flex; align-items: center; justify-content: center; width: 56px; height: 56px; background: var(--primary-light); color: var(--primary); border-radius: 16px; margin-bottom: 12px;">
          <img src="/ico.ico" alt="Logo" style="width: 32px; height: 32px; object-fit: contain;" />
        </div>
        <h1 id="authTitle" style="margin: 0; font-size: 22px; font-weight: 800; color: var(--text-main);">Iniciar Sesión en BiteLife</h1>
        <p id="authSubtitle" style="margin: 6px 0 0 0; font-size: 13px; color: var(--text-muted);">Organiza tu menú y conecta con otros cocineros</p>
      </div>

      <form id="formAuth" style="display: flex; flex-direction: column; gap: 14px;">
        
        <!-- CAMPOS EXTRAS PARA REGISTRO -->
        <div id="secCamposRegistro" class="hidden" style="display: flex; flex-direction: column; gap: 14px;">
          <div>
            <label style="font-size: 12px; font-weight: 700; color: var(--text-muted);">Nombre de usuario (@username)</label>
            <input type="text" id="inputRegUsername" placeholder="" style="margin-top: 4px; text-transform: lowercase;" />
          </div>

          <div>
            <label style="font-size: 12px; font-weight: 700; color: var(--text-muted);">Nombre Completo</label>
            <input type="text" id="inputRegNombre" placeholder="" style="margin-top: 4px;" />
          </div>
        </div>

        <div>
          <label style="font-size: 12px; font-weight: 700; color: var(--text-muted);">Correo Electrónico</label>
          <input type="email" id="inputEmail" placeholder="" required style="margin-top: 4px;" />
        </div>

        <div>
          <label style="font-size: 12px; font-weight: 700; color: var(--text-muted);">Contraseña</label>
          <div style="position: relative; display: flex; align-items: center; width: 100%; margin-top: 4px;">
            <input type="password" id="inputPassword" placeholder="" required style="width: 100%; padding-right: 42px; margin: 0; box-sizing: border-box;" />
            <button type="button" id="btnToggleAuthPass" style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 0; margin: 0; display: inline-flex; align-items: center; justify-content: center; width: 20px; height: 20px; z-index: 2;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: block;">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </button>
          </div>
          <p id="passHint" class="hidden" style="font-size: 10px; color: var(--text-muted); margin: 4px 0 0 0;">
            Mínimo 6 caracteres, 1 mayúscula, 1 número y 1 carácter especial.
          </p>
        </div>

        <div id="msgAuth" style="font-size: 12px; padding: 10px; border-radius: 10px; display: none;"></div>

        <button type="submit" id="btnSubmitAuth" class="btn-primary" style="width: 100%; padding: 12px; font-size: 14px; font-weight: 800; border-radius: 12px; margin-top: 4px;">
          Entrar
        </button>
      </form>

      <div style="text-align: center; margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--border);">
        <span id="txtToggleModo" style="font-size: 12px; color: var(--text-muted);">¿No tienes cuenta todavía?</span>
        <button id="btnToggleModo" style="background: none; border: none; color: var(--primary); font-weight: 800; font-size: 12px; cursor: pointer; margin-left: 4px; padding: 0;">
          Regístrate aquí
        </button>
      </div>
    </div>
  `;

  setTimeout(() => {
    const form = container.querySelector('#formAuth');
    const title = container.querySelector('#authTitle');
    const subtitle = container.querySelector('#authSubtitle');
    const secRegistro = container.querySelector('#secCamposRegistro');
    const inputRegUsername = container.querySelector('#inputRegUsername');
    const inputRegNombre = container.querySelector('#inputRegNombre');
    const inputEmail = container.querySelector('#inputEmail');
    const inputPassword = container.querySelector('#inputPassword');
    const btnToggleAuthPass = container.querySelector('#btnToggleAuthPass');
    const passHint = container.querySelector('#passHint');
    const btnSubmit = container.querySelector('#btnSubmitAuth');
    const btnToggleModo = container.querySelector('#btnToggleModo');
    const txtToggleModo = container.querySelector('#txtToggleModo');
    const msg = container.querySelector('#msgAuth');

    btnToggleAuthPass.addEventListener('click', () => {
      inputPassword.type = inputPassword.type === 'password' ? 'text' : 'password';
    });

    btnToggleModo.addEventListener('click', () => {
      esRegistro = !esRegistro;
      msg.style.display = 'none';

      if (esRegistro) {
        title.innerText = 'Crear Cuenta en BiteLife';
        subtitle.innerText = 'Únete a la comunidad de cocina';
        btnSubmit.innerText = 'Registrarse';
        txtToggleModo.innerText = '¿Ya tienes una cuenta?';
        btnToggleModo.innerText = 'Inicia sesión';
        secRegistro.classList.remove('hidden');
        passHint.classList.remove('hidden');
      } else {
        title.innerText = 'Iniciar Sesión en BiteLife';
        subtitle.innerText = 'Organiza tu menú y conecta con otros cocineros';
        btnSubmit.innerText = 'Entrar';
        txtToggleModo.innerText = '¿No tienes cuenta todavía?';
        btnToggleModo.innerText = 'Regístrate aquí';
        secRegistro.classList.add('hidden');
        passHint.classList.add('hidden');
      }
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      msg.style.display = 'none';

      const email = inputEmail.value.trim();
      const password = inputPassword.value;

      if (esRegistro) {
        const usernameLimpio = inputRegUsername.value.trim().toLowerCase().replace('@', '').replace(/[^a-z0-9_]/g, '');
        const nombreCompletoLimpio = inputRegNombre.value.trim();

        if (!usernameLimpio) {
          msg.style.display = 'block';
          msg.style.background = '#fee2e2';
          msg.style.color = 'var(--danger)';
          msg.innerText = 'Debes elegir un nombre de usuario válido.';
          return;
        }

        const regEspecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;
        if (password.length < 6 || !/[A-Z]/.test(password) || !/[0-9]/.test(password) || !regEspecial.test(password)) {
          msg.style.display = 'block';
          msg.style.background = '#fee2e2';
          msg.style.color = 'var(--danger)';
          msg.innerText = 'La contraseña no cumple con los requisitos de seguridad.';
          return;
        }

        btnSubmit.disabled = true;
        btnSubmit.innerText = 'Creando cuenta...';

        const redirectUrl = window.location.origin;

        // Registrar pasando la metadata completa a Supabase Auth
        const { data: authData, error: authErr } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              username: usernameLimpio,
              nombre_completo: nombreCompletoLimpio || usernameLimpio
            }
          }
        });

        if (authErr) {
          msg.style.display = 'block';
          msg.style.background = '#fee2e2';
          msg.style.color = 'var(--danger)';
          
          if (authErr.message.includes('rate limit')) {
            msg.innerText = 'Has realizado demasiados intentos en poco tiempo. Por favor, espera unos minutos.';
          } else {
            msg.innerText = 'Error: ' + authErr.message;
          }

          btnSubmit.disabled = false;
          btnSubmit.innerText = 'Registrarse';
          return;
        }

        if (authData.user) {
          // Asegurar que el registro en la tabla pública tenga los datos exactos
          await supabase.from('perfiles').upsert({
            id: authData.user.id,
            username: usernameLimpio,
            nombre_completo: nombreCompletoLimpio || usernameLimpio
          });

          msg.style.display = 'block';
          msg.style.background = 'var(--primary-light)';
          msg.style.color = 'var(--primary)';
          
          if (authData.session) {
            msg.innerText = '¡Cuenta creada con éxito!';
            setTimeout(() => {
              if (onLoginSuccess) onLoginSuccess();
            }, 1000);
          } else {
            msg.innerText = 'Te hemos enviado un correo de confirmación. Por favor, revisa tu bandeja de entrada.';
            btnSubmit.disabled = false;
            btnSubmit.innerText = 'Registrarse';
          }
        }
      } else {
        btnSubmit.disabled = true;
        btnSubmit.innerText = 'Entrando...';

        const { error: loginErr } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (loginErr) {
          msg.style.display = 'block';
          msg.style.background = '#fee2e2';
          msg.style.color = 'var(--danger)';
          msg.innerText = 'Credenciales incorrectas o correo no confirmado.';
          btnSubmit.disabled = false;
          btnSubmit.innerText = 'Entrar';
          return;
        }

        if (onLoginSuccess) onLoginSuccess();
      }
    });
  }, 0);

  return container;
}