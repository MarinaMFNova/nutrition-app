import './styles.css';
import { supabase } from './supabase.js';
import { icons } from './icons.js';
import { renderAuthView } from './pages/auth.js';
import { renderPlanView } from './pages/plan.js';
import { renderRecetasView } from './pages/recetas.js';
import { renderCompraView } from './pages/compra.js';
import { renderPerfilView } from './pages/perfil.js';
import { renderComunidadView } from './pages/comunidad.js';
import { renderNotificacionesView } from './pages/notificaciones.js';

let usuarioActual = null;
let tabActual = 'Comunidad';

const app = document.getElementById('app');

async function init() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    usuarioActual = session.user;
    await renderAppLayout();
  } else {
    app.innerHTML = '';
    app.appendChild(renderAuthView(init));
  }
}

async function renderAppLayout() {
  // Cargar notificaciones no leídas para el contador
  const { count: cNotif } = await supabase
    .from('notificaciones')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', usuarioActual.id)
    .eq('leida', false);

  const numNotif = cNotif || 0;

  app.innerHTML = `
    <!-- BOTÓN HAMBURGUESA MÓVIL -->
    <button id="btnMobileToggle" class="mobile-toggle-btn" aria-label="Abrir menú">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="3" y1="12" x2="21" y2="12"></line>
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <line x1="3" y1="18" x2="21" y2="18"></line>
      </svg>
    </button>

    <div id="sidebarOverlay" class="sidebar-overlay"></div>

    <div class="layout-container">
      <aside class="sidebar" id="mainSidebar">
        <div style="display: flex; flex-direction: column; height: 100%;">
          <div class="sidebar-header">
            <h1 class="brand-title">
              <img src="/ico.ico" alt="BiteLife Logo" class="brand-logo-img" />
              <span class="brand-text">BiteLife</span>
            </h1>
            <div style="display: flex; gap: 4px; align-items: center;">
              <!-- BOTÓN PARA COLAPSAR EN ESCRITORIO -->
              <button id="btnCollapseSidebar" class="sidebar-collapse-btn" title="Plegar / Desplegar menú">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </button>
              <!-- BOTÓN CERRAR EN MÓVIL -->
              <button id="btnSidebarClose" class="sidebar-close-btn" aria-label="Cerrar menú">✕</button>
            </div>
          </div>

          <button class="btn-primary-add" id="btnQuickAdd" style="width:100%; margin-bottom: 16px; display: flex; align-items: center; justify-content: center; gap: 6px;">
            <span style="font-size: 16px;">+</span> <span class="nav-item-text">Crear Receta</span>
          </button>
          
          <nav class="sidebar-menu">
            <button class="nav-item active" data-tab="Comunidad">
              <span style="display: flex; align-items: center;">${icons.feed}</span>
              <span class="nav-item-text">Explorar Feed</span>
            </button>
            <button class="nav-item" data-tab="Recetas">
              <span style="display: flex; align-items: center;">${icons.recetas}</span>
              <span class="nav-item-text">Mis Recetas</span>
            </button>
            <button class="nav-item" data-tab="Plan">
              <span style="display: flex; align-items: center;">${icons.plan}</span>
              <span class="nav-item-text">Plan Semanal</span>
            </button>
            <button class="nav-item" data-tab="Compra">
              <span style="display: flex; align-items: center;">${icons.compra}</span>
              <span class="nav-item-text">Lista Compra</span>
            </button>
            <button class="nav-item" data-tab="Notificaciones">
              <span style="display: flex; align-items: center; position: relative;">
                ${icons.bell || '🔔'}
              </span>
              <span class="nav-item-text" style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
                <span>Notificaciones</span>
                <span id="badgeSidebarNotif" style="display: ${numNotif > 0 ? 'inline-flex' : 'none'}; background: var(--danger); color: white; border-radius: 50%; width: 18px; height: 18px; font-size: 10px; font-weight: 800; align-items: center; justify-content: center;">
                  ${numNotif}
                </span>
              </span>
            </button>
            <button class="nav-item" data-tab="Perfil">
              <span style="display: flex; align-items: center;">${icons.perfil}</span>
              <span class="nav-item-text">Mi Perfil</span>
            </button>
          </nav>

          <div class="user-profile-sidebar">
            <p class="user-email-text" style="font-size: 12px; color: var(--text-muted); margin: 0 0 8px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" id="userEmailNav"></p>
            
            <button id="btnSalir" class="nav-item" style="color: var(--danger);">
              <span style="display: flex; align-items: center;">${icons.logout}</span>
              <span class="nav-item-text">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </aside>

      <main class="main-content" id="contentView"></main>
    </div>
  `;

  document.getElementById('userEmailNav').innerText = usuarioActual.email;

  const sidebar = document.getElementById('mainSidebar');
  const overlay = document.getElementById('sidebarOverlay');
  const btnToggleMobile = document.getElementById('btnMobileToggle');
  const btnCloseMobile = document.getElementById('btnSidebarClose');
  const btnCollapseDesktop = document.getElementById('btnCollapseSidebar');

  btnCollapseDesktop.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
  });

  function abrirMenu() {
    sidebar.classList.add('open');
    overlay.classList.add('visible');
  }

  function cerrarMenu() {
    sidebar.classList.remove('open');
    overlay.classList.remove('visible');
  }

  btnToggleMobile.addEventListener('click', abrirMenu);
  btnCloseMobile.addEventListener('click', cerrarMenu);
  overlay.addEventListener('click', cerrarMenu);

  document.getElementById('btnSalir').addEventListener('click', async () => {
    await supabase.auth.signOut();
    usuarioActual = null;
    init();
  });

  document.getElementById('btnQuickAdd').addEventListener('click', () => {
    tabActual = 'Recetas';
    cerrarMenu();
    cargarVistaPestana(true);
  });

  const navItems = document.querySelectorAll('.nav-item[data-tab]');
  navItems.forEach(btn => {
    btn.addEventListener('click', () => {
      navItems.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      tabActual = btn.getAttribute('data-tab');
      cerrarMenu();
      cargarVistaPestana();
    });
  });

  cargarVistaPestana();
}

function cargarVistaPestana(abrirFormulario = false) {
  const content = document.getElementById('contentView');
  content.innerHTML = '';

  if (tabActual === 'Comunidad') {
    content.appendChild(renderComunidadView(usuarioActual));
  } else if (tabActual === 'Recetas') {
    content.appendChild(renderRecetasView(usuarioActual, abrirFormulario));
  } else if (tabActual === 'Plan') {
    content.appendChild(renderPlanView(usuarioActual));
  } else if (tabActual === 'Compra') {
    content.appendChild(renderCompraView(usuarioActual));
  } else if (tabActual === 'Notificaciones') {
    content.appendChild(renderNotificacionesView(usuarioActual));
    const badge = document.getElementById('badgeSidebarNotif');
    if (badge) badge.style.display = 'none';
  } else if (tabActual === 'Perfil') {
    content.appendChild(renderPerfilView(usuarioActual));
  }

  if (content) content.scrollTop = 0;
}

init();