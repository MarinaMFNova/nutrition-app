import { supabase } from '../supabase.js';

export function renderAuthView(onSuccess) {
  const container = document.createElement('div');
  container.className = 'container auth-wrapper';
  container.innerHTML = `
    <div class="card" style="width: 100%; max-width: 380px; text-align: center;">
      
      <!-- ICONO VECTORIAL: GORRO DE CHEF SIMPLE -->
      <div style="display: flex; justify-content: center; margin-bottom: 12px;">
        <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 18px; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 18px rgba(16, 185, 129, 0.28);">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 13.8a4.5 4.5 0 1 1 2.61-7.06 5 5 0 0 1 6.78 0A4.5 4.5 0 1 1 18 13.8"></path>
            <path d="M6 13.8h12v3a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-3z"></path>
          </svg>
        </div>
      </div>

      <!-- MARCA Y SUBTÍTULO -->
      <h2 style="margin: 0 0 4px 0; font-size: 24px; font-weight: 800; letter-spacing: -0.6px; color: var(--text-main);">BiteLife</h2>
      <p style="color: var(--text-muted); font-size: 13px; margin-bottom: 24px;">Tu estilo de vida nutricional</p>
      
      <!-- FORMULARIO DE INICIO DE SESIÓN -->
      <div id="loginForm">
        <input type="email" id="authEmail" placeholder="Correo electrónico">
        
        <div class="password-wrapper">
          <input type="password" id="authPassword" placeholder="Contraseña">
          <button type="button" id="btnTogglePassword" class="toggle-password">👁️</button>
        </div>

        <button id="btnIniciarSesion" style="margin-top: 16px;">Iniciar Sesión</button>
        
        <p style="font-size: 13px; color: var(--text-muted); margin-top: 16px; margin-bottom: 0;">
          ¿No tienes cuenta? 
          <button type="button" id="btnAbrirRegistro" style="background: none; border: none; color: var(--accent-blue); padding: 0; width: auto; display: inline; margin: 0; text-decoration: underline; font-size: 13px; cursor: pointer;">
            Registrarse
          </button>
        </p>
      </div>

      <!-- FORMULARIO DE REGISTRO COMPLETO -->
      <div id="registerForm" class="hidden" style="text-align: left;">
        <h3 style="margin-top: 0; margin-bottom: 12px; text-align: center;">Crear cuenta en BiteLife</h3>
        
        <input type="text" id="regNombre" placeholder="Nombre">
        <input type="text" id="regApellidos" placeholder="Apellidos">
        <input type="email" id="regEmail" placeholder="Correo electrónico">
        
        <div class="password-wrapper">
          <input type="password" id="regPassword" placeholder="Contraseña">
          <button type="button" id="btnToggleRegPass1" class="toggle-password">👁️</button>
        </div>

        <div class="password-wrapper">
          <input type="password" id="regConfirmPassword" placeholder="Repetir contraseña">
          <button type="button" id="btnToggleRegPass2" class="toggle-password">👁️</button>
        </div>

        <button id="btnEjecutarRegistro" class="btn-secondary" style="margin-top: 16px;">Completar Registro</button>
        
        <button type="button" id="btnVolverLogin" style="background: transparent; color: var(--text-muted); border: 1px solid var(--border); margin-top: 8px;">
          Volver a Iniciar Sesión
        </button>
      </div>
    </div>
  `;

  setTimeout(() => {
    const loginForm = container.querySelector('#loginForm');
    const registerForm = container.querySelector('#registerForm');

    container.querySelector('#btnAbrirRegistro').addEventListener('click', () => {
      loginForm.classList.add('hidden');
      registerForm.classList.remove('hidden');
    });

    container.querySelector('#btnVolverLogin').addEventListener('click', () => {
      registerForm.classList.add('hidden');
      loginForm.classList.remove('hidden');
    });

    const setupToggle = (inputId, btnId) => {
      const input = container.querySelector(`#${inputId}`);
      const btn = container.querySelector(`#${btnId}`);
      btn.addEventListener('click', () => {
        const isPass = input.type === 'password';
        input.type = isPass ? 'text' : 'password';
        btn.innerText = isPass ? '🙈' : '👁️';
      });
    };

    setupToggle('authPassword', 'btnTogglePassword');
    setupToggle('regPassword', 'btnToggleRegPass1');
    setupToggle('regConfirmPassword', 'btnToggleRegPass2');

    container.querySelector('#btnIniciarSesion').addEventListener('click', async () => {
      const email = container.querySelector('#authEmail').value.trim();
      const password = container.querySelector('#authPassword').value;
      if (!email || !password) return alert("Introduce correo y contraseña.");

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert("Error: " + error.message);
      else onSuccess();
    });

    container.querySelector('#btnEjecutarRegistro').addEventListener('click', async () => {
      const nombre = container.querySelector('#regNombre').value.trim();
      const apellidos = container.querySelector('#regApellidos').value.trim();
      const email = container.querySelector('#regEmail').value.trim();
      const password = container.querySelector('#regPassword').value;
      const confirmPassword = container.querySelector('#regConfirmPassword').value;

      if (!nombre || !apellidos || !email || !password) {
        return alert("Por favor, rellena todos los campos.");
      }

      if (password !== confirmPassword) {
        return alert("Las contraseñas no coinciden.");
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { nombre, apellidos }
        }
      });

      if (error) {
        alert("Error en el registro: " + error.message);
      } else {
        alert("¡Cuenta registrada con éxito!");
        const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
        if (!loginError) onSuccess();
      }
    });
  }, 0);

  return container;
}