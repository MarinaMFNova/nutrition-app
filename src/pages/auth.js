import { supabase } from '../supabase.js';

export function renderAuthView(onSuccess) {
  const container = document.createElement('div');
  container.className = 'auth-wrapper';

  let isLogin = true;

  function renderForm() {
    container.innerHTML = `
      <div class="auth-card">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="margin: 0 0 6px 0; font-size: 26px; font-weight: 800; color: var(--primary);">👨‍🍳 BiteLife</h1>
          <p style="margin: 0; font-size: 14px; color: var(--text-muted);">
            ${isLogin ? 'Inicia sesión para gestionar tus menús' : 'Crea una cuenta para empezar'}
          </p>
        </div>

        <form id="authForm" style="display: flex; flex-direction: column; gap: 14px;">
          <div>
            <label style="font-size: 13px; font-weight: 600; color: var(--text-muted);">Correo electrónico</label>
            <input type="email" id="authEmail" placeholder="tu@email.com" required autocomplete="email">
          </div>

          <div>
            <label style="font-size: 13px; font-weight: 600; color: var(--text-muted);">Contraseña</label>
            <div class="password-wrapper">
              <input type="password" id="authPassword" placeholder="••••••••" required autocomplete="current-password">
              <button type="button" class="toggle-password" id="btnTogglePassword" aria-label="Mostrar u ocultar contraseña">
                👁️
              </button>
            </div>
          </div>

          <p id="authError" style="color: var(--danger); font-size: 13px; margin: 0; text-align: center; display: none;"></p>

          <button type="submit" style="margin-top: 8px;">
            ${isLogin ? 'Iniciar Sesión' : 'Registrarse'}
          </button>
        </form>

        <div style="text-align: center; margin-top: 20px; font-size: 13px; color: var(--text-muted);">
          ${isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
          <button id="btnSwitchAuth" class="btn-outline" style="width: auto; display: inline-block; padding: 4px 10px; margin-left: 6px; font-size: 13px;">
            ${isLogin ? 'Regístrate' : 'Inicia Sesión'}
          </button>
        </div>
      </div>
    `;

    // LÓGICA DE MOSTRAR / OCULTAR CONTRASEÑA
    const passInput = container.querySelector('#authPassword');
    const toggleBtn = container.querySelector('#btnTogglePassword');

    toggleBtn.addEventListener('click', () => {
      const isPassword = passInput.type === 'password';
      passInput.type = isPassword ? 'text' : 'password';
      toggleBtn.innerText = isPassword ? '🙈' : '👁️';
    });

    // LÓGICA CAMBIO DE MODO (LOGIN / REGISTRO)
    container.querySelector('#btnSwitchAuth').addEventListener('click', () => {
      isLogin = !isLogin;
      renderForm();
    });

    // LÓGICA DE ENVÍO
    container.querySelector('#authForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = container.querySelector('#authEmail').value.trim();
      const password = passInput.value;
      const errorMsg = container.querySelector('#authError');

      errorMsg.style.display = 'none';

      try {
        if (isLogin) {
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) throw error;
        } else {
          const { error } = await supabase.auth.signUp({ email, password });
          if (error) throw error;
        }
        onSuccess();
      } catch (err) {
        errorMsg.innerText = err.message || 'Error de autenticación';
        errorMsg.style.display = 'block';
      }
    });
  }

  renderForm();
  return container;
}