import { supabase } from '../supabase.js';

export function renderRecetasView(usuarioActual, abrirFormularioInicial = false) {
  const container = document.createElement('div');
  container.className = 'recetas-page-container';

  const searchSVG = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  `;

  let recetas = [];
  let busqueda = '';
  let imagenBase64 = null; // Guardará la imagen subida desde el PC

  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
      <div>
        <h1 style="margin: 0; font-size: 26px; font-weight: 800; color: var(--text-main);">Mis Recetas</h1>
        <p style="margin: 4px 0 0 0; font-size: 14px; color: var(--text-muted);">Gestiona tus platos y preparaciones favoritas</p>
      </div>

      <button id="btnNuevaReceta" style="width: auto; padding: 10px 18px; margin: 0; border-radius: 12px; font-weight: 700; font-size: 14px; display: flex; align-items: center; gap: 6px;">
        <span>+</span> Añadir receta
      </button>
    </div>

    <div style="position: relative; width: 100%; margin-bottom: 24px;">
      <div style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); display: flex; align-items: center; pointer-events: none;">
        ${searchSVG}
      </div>
      <input 
        type="text" 
        id="inputBuscar" 
        placeholder="Buscar por nombre o ingrediente..." 
        style="padding-left: 42px; margin-top: 0; height: 46px; border-radius: 14px;"
      />
    </div>

    <!-- MODAL / FORMULARIO CREAR RECETA -->
    <div id="modalFormReceta" class="card hidden" style="margin-bottom: 28px; border: 2px solid var(--primary-light);">
      <h3 style="margin-top: 0; margin-bottom: 16px; font-weight: 800; color: var(--primary);">Crear Nueva Receta</h3>
      
      <form id="formReceta" style="display: flex; flex-direction: column; gap: 12px;">
        <div>
          <label style="font-size: 12px; font-weight: 700; color: var(--text-muted);">Nombre de la receta *</label>
          <input type="text" id="recetaNombre" placeholder="Ej: Pollo al curry con arroz" required />
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <label style="font-size: 12px; font-weight: 700; color: var(--text-muted);">Tiempo (min)</label>
            <input type="number" id="recetaTiempo" placeholder="25" min="1" />
          </div>
          
          <!-- SELECCIÓN DE IMAGEN (SUBIR ARCHIVO O URL) -->
          <div>
            <label style="font-size: 12px; font-weight: 700; color: var(--text-muted);">Imagen (Archivo local)</label>
            <input type="file" id="recetaFile" accept="image/*" style="padding: 8px; font-size: 12px;" />
          </div>
        </div>

        <div>
          <label style="font-size: 12px; font-weight: 700; color: var(--text-muted);">O pegar enlace URL de imagen (Opcional)</label>
          <input type="url" id="recetaImagenUrl" placeholder="https://..." />
        </div>

        <!-- VISTA PREVIA DE LA FOTO SELECCIONADA -->
        <div id="previewContainer" class="hidden" style="text-align: center; margin-top: 4px;">
          <img id="imgPreview" src="" alt="Vista previa" style="max-height: 120px; border-radius: 12px; border: 1px solid var(--border);" />
        </div>

        <div>
          <label style="font-size: 12px; font-weight: 700; color: var(--text-muted);">Ingredientes</label>
          <textarea id="recetaIngredientes" rows="3" placeholder="2 pechugas de pollo&#10;1 vaso de arroz"></textarea>
        </div>

        <div>
          <label style="font-size: 12px; font-weight: 700; color: var(--text-muted);">Pasos de preparación</label>
          <textarea id="recetaPasos" rows="3" placeholder="1. Cortar el pollo...&#10;2. Cocinar a fuego lento..."></textarea>
        </div>

        <p id="formErrorMsg" style="color: var(--danger); font-size: 13px; font-weight: 600; margin: 0; display: none;"></p>

        <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 8px;">
          <button type="button" id="btnCancelarForm" class="btn-outline" style="width: auto; margin:0; padding: 10px 18px;">Cancelar</button>
          <button type="submit" id="btnSubmitReceta" style="width: auto; margin:0; padding: 10px 22px;">Guardar Receta</button>
        </div>
      </form>
    </div>

    <div id="gridRecetas" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 20px;"></div>
  `;

  const modalForm = container.querySelector('#modalFormReceta');
  const btnNueva = container.querySelector('#btnNuevaReceta');
  const btnCancelar = container.querySelector('#btnCancelarForm');
  const formReceta = container.querySelector('#formReceta');
  const btnSubmit = container.querySelector('#btnSubmitReceta');
  const formErrorMsg = container.querySelector('#formErrorMsg');
  const inputBuscar = container.querySelector('#inputBuscar');
  const grid = container.querySelector('#gridRecetas');

  const inputFile = container.querySelector('#recetaFile');
  const inputUrl = container.querySelector('#recetaImagenUrl');
  const previewContainer = container.querySelector('#previewContainer');
  const imgPreview = container.querySelector('#imgPreview');

  if (abrirFormularioInicial) {
    modalForm.classList.remove('hidden');
  }

  // LÓGICA DE LECTURA DE IMAGEN DESDE DISCO LOCAL / MÓVIL
  inputFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        imagenBase64 = event.target.result;
        imgPreview.src = imagenBase64;
        previewContainer.classList.remove('hidden');
        inputUrl.value = ''; // Limpiar el campo URL si se sube archivo
      };
      reader.readAsDataURL(file);
    }
  });

  inputUrl.addEventListener('input', (e) => {
    if (e.target.value.trim()) {
      imagenBase64 = null;
      inputFile.value = '';
      imgPreview.src = e.target.value.trim();
      previewContainer.classList.remove('hidden');
    } else {
      previewContainer.classList.add('hidden');
    }
  });

  btnNueva.addEventListener('click', () => {
    modalForm.classList.toggle('hidden');
    formErrorMsg.style.display = 'none';
  });

  btnCancelar.addEventListener('click', () => {
    modalForm.classList.add('hidden');
    formErrorMsg.style.display = 'none';
    formReceta.reset();
    imagenBase64 = null;
    previewContainer.classList.add('hidden');
  });

  inputBuscar.addEventListener('input', (e) => {
    busqueda = e.target.value.toLowerCase();
    renderGrid();
  });

  async function cargarRecetas() {
    const { data, error } = await supabase
      .from('recetas')
      .select('*')
      .eq('user_id', usuarioActual.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      recetas = data;
      renderGrid();
    }
  }

  function renderGrid() {
    const filtradas = recetas.filter(r => 
      r.nombre.toLowerCase().includes(busqueda) || 
      (r.ingredientes && r.ingredientes.toLowerCase().includes(busqueda))
    );

    grid.innerHTML = '';

    if (filtradas.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; color: var(--text-muted);">
          <div style="font-size: 40px; margin-bottom: 10px;">🍲</div>
          <p style="margin: 0; font-size: 15px; font-weight: 600;">No se encontraron recetas.</p>
          <p style="margin: 4px 0 0 0; font-size: 13px;">¡Añade tu primera receta pulsando en el botón superior!</p>
        </div>
      `;
      return;
    }

    filtradas.forEach(r => {
      const card = document.createElement('div');
      card.className = 'card';
      card.style.cssText = 'padding: 16px; border-radius: 18px; display: flex; flex-direction: column; justify-content: space-between;';

      const imgHtml = r.imagen_url 
        ? `<img src="${r.imagen_url}" alt="${r.nombre}" style="width: 100%; height: 140px; object-fit: cover; border-radius: 12px; margin-bottom: 12px;" />`
        : `<div style="width: 100%; height: 100px; background: var(--primary-light); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 32px; margin-bottom: 12px;">👨‍🍳</div>`;

      card.innerHTML = `
        <div>
          ${imgHtml}
          <h3 style="margin: 0 0 6px 0; font-size: 17px; font-weight: 800; color: var(--text-main);">${r.nombre}</h3>
          <p style="margin: 0 0 10px 0; font-size: 12px; color: var(--text-muted); font-weight: 600;">⏱️ ${r.tiempo_preparacion || 15} min</p>
        </div>

        <div style="display: flex; justify-content: flex-end; margin-top: 10px;">
          <button class="btn-delete-receta btn-outline" style="width: auto; padding: 6px 12px; margin: 0; border-radius: 8px; font-size: 12px; color: var(--danger);" data-id="${r.id}">
            🗑️ Eliminar
          </button>
        </div>
      `;

      card.querySelector('.btn-delete-receta').addEventListener('click', async () => {
        if (confirm(`¿Seguro que quieres eliminar "${r.nombre}"?`)) {
          await supabase.from('recetas').delete().eq('id', r.id);
          cargarRecetas();
        }
      });

      grid.appendChild(card);
    });
  }

  formReceta.addEventListener('submit', async (e) => {
    e.preventDefault();
    formErrorMsg.style.display = 'none';
    btnSubmit.disabled = true;
    btnSubmit.innerText = 'Guardando...';

    try {
      const nombre = container.querySelector('#recetaNombre').value.trim();
      const tiempo = parseInt(container.querySelector('#recetaTiempo').value) || 15;
      const urlEscrita = inputUrl.value.trim();
      
      // Determinar qué imagen guardar: la imagen subida localmente o la URL escrita
      const finalImagenUrl = imagenBase64 || urlEscrita || null;

      const ingredientes = container.querySelector('#recetaIngredientes').value.trim();
      const pasos = container.querySelector('#recetaPasos').value.trim();

      const { error } = await supabase.from('recetas').insert([{
        user_id: usuarioActual.id,
        nombre,
        tiempo_preparacion: tiempo,
        imagen_url: finalImagenUrl,
        ingredientes,
        pasos
      }]);

      if (error) throw error;

      formReceta.reset();
      imagenBase64 = null;
      previewContainer.classList.add('hidden');
      modalForm.classList.add('hidden');
      cargarRecetas();
    } catch (err) {
      console.error("Error al guardar receta:", err);
      formErrorMsg.innerText = "Error al guardar: " + (err.message || "comprueba la imagen.");
      formErrorMsg.style.display = 'block';
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.innerText = 'Guardar Receta';
    }
  });

  cargarRecetas();

  return container;
}