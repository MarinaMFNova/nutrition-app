import './styles.css';
import { supabase } from './supabase.js';
import { renderAuthView } from './pages/auth.js';
import { renderPlanView } from './pages/plan.js';
import { renderRecetasView } from './pages/recetas.js';
import { renderCompraView } from './pages/compra.js';

let usuarioActual = null;
let tabActual = 'Plan';

const app = document.getElementById('app');

async function init() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    usuarioActual = session.user;
    renderAppLayout();
  } else {
    app.innerHTML = '';
    app.appendChild(renderAuthView(init));
  }
}

function renderAppLayout() {
  app.innerHTML = `
    <div class="layout-container">
      <!-- SIDEBAR LATERAL -->
      <aside class="sidebar">
        <div>
          <div class="brand-title">👨‍🍳 BiteLife</div>
          <button class="btn-primary-add" id="btnQuickAdd" style="width:100%; margin-bottom: 16px;">+ Crear Receta</button>
          
          <nav class="sidebar-menu">
            <button class="nav-item active" data-tab="Plan"><span>📅</span> Plan Semanal</button>
            <button class="nav-item" data-tab="Recetas"><span>📖</span> Recetas</button>
            <button class="nav-item" data-tab="Compra"><span>🛒</span> Lista Compra</button>
          </nav>
        </div>

        <div class="user-profile-sidebar">
          <p style="font-size: 12px; color: var(--text-muted); margin: 0 0 8px 0;" id="userEmailNav"></p>
          
          <!-- BOTÓN CERRAR SESIÓN CON ICONO MINIMALISTA DE CUADRADO Y FLECHA -->
          <button id="btnSalir" class="nav-item" style="color: var(--danger);">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            Cerrar Sesión
          </button>
        </div>
      </aside>

      <!-- CONTENIDO PRINCIPAL -->
      <main class="main-content" id="contentView"></main>
    </div>
  `;

  document.getElementById('userEmailNav').innerText = usuarioActual.email;

  document.getElementById('btnSalir').addEventListener('click', async () => {
    await supabase.auth.signOut();
    usuarioActual = null;
    init();
  });

  document.getElementById('btnQuickAdd').addEventListener('click', () => {
    tabActual = 'Recetas';
    cargarVistaPestana(true);
  });

  const navItems = document.querySelectorAll('.nav-item[data-tab]');
  navItems.forEach(btn => {
    btn.addEventListener('click', () => {
      navItems.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      tabActual = btn.getAttribute('data-tab');
      cargarVistaPestana();
    });
  });

  cargarVistaPestana();
}

function cargarVistaPestana(abrirFormulario = false) {
  const content = document.getElementById('contentView');
  content.innerHTML = '';

  if (tabActual === 'Plan') {
    content.appendChild(renderPlanView(usuarioActual));
  } else if (tabActual === 'Recetas') {
    content.appendChild(renderRecetasView(usuarioActual, abrirFormulario));
  } else if (tabActual === 'Compra') {
    content.appendChild(renderCompraView(usuarioActual));
  }
}

init();