import { supabase } from '../supabase.js';
import { icons } from '../icons.js';

// Lista de palabras vacías que NO son ingredientes de compra
const PALABRAS_VACIAS = [
  'con', 'del', 'de', 'la', 'los', 'las', 'el', 'un', 'una', 'unos', 'unas',
  'solo', 'sola', 'solos', 'solas', 'para', 'por', 'sin', 'tipo', 'modo', 'estilo'
];

// Función limpiadora de ingredientes y cantidades
function limpiarTextoIngrediente(texto) {
  if (!texto) return '';

  let limpio = texto.toLowerCase();

  // 1. Eliminar cantidades y fracciones (ej: 250, 1.5, 1/2)
  limpio = limpio.replace(/\b\d+([.,\/]\d+)?\b/g, '');

  // 2. Eliminar unidades de medida comunes
  const unidades = [
    'gr', 'gramos', 'g', 'kg', 'kilos', 'kilo', 
    'ml', 'l', 'litro', 'litros', 'cl', 
    'cucharada', 'cucharadas', 'cucharadita', 'cucharaditas', 
    'taza', 'tazas', 'vaso', 'vasos', 'pizca', 'pizcas', 
    'diente', 'dientes', 'unidades', 'unidad', 'uds', 'ud',
    'bote', 'botes', 'paquete', 'paquetes', 'lata', 'latas', 'chorrito'
  ];
  
  const regexUnidades = new RegExp(`\\b(${unidades.join('|')})\\b`, 'gi');
  limpio = limpio.replace(regexUnidades, '');

  // 3. Eliminar caracteres especiales
  limpio = limpio.replace(/[\(\)\-\*:\.]/g, ' ');

  // 4. Limpiar espacios múltiples
  limpio = limpio.trim().replace(/\s+/g, ' ');

  if (!limpio || PALABRAS_VACIAS.includes(limpio)) return '';

  return limpio.charAt(0).toUpperCase() + limpio.slice(1);
}

// Extrae ingredientes individuales descomponiendo frases como "Tostada con aguacate y huevo"
function extraerIngredientesDeNota(nota) {
  if (!nota) return [];

  // Separar por conectores como 'con', 'y', '/', ',', '+' o 'de'
  const partes = nota.split(/\s+(?:con|y|\+|\/|,)\s+|\/|,|\+/i);
  const resultados = [];

  partes.forEach(p => {
    let limpia = p.trim();
    // Si la parte empieza por "tostada de...", "tortitas de...", quitamos el tipo de preparación si procede
    limpia = limpia.replace(/^(tostada|tostadas|tortita|tortitas|batido|batidos)\s+(de\s+la|del|de)?\s*/gi, '');

    const final = limpiarTextoIngrediente(limpia);
    if (final && !PALABRAS_VACIAS.includes(final.toLowerCase()) && !resultados.includes(final)) {
      resultados.push(final);
    }
  });

  return resultados;
}

export function renderCompraView(usuarioActual) {
  const container = document.createElement('div');
  container.className = 'container';

  let itemsLista = [];
  let ingredientesUnicosDisponibles = [];

  container.innerHTML = `
    <!-- CABECERA DE LA VISTA -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 16px;">
      <div>
        <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: var(--primary); display: flex; align-items: center; gap: 10px;">
          <span style="display: flex; align-items: center; color: var(--primary);">${icons.compra}</span>
          <span>Lista de la Compra</span>
        </h1>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: var(--text-muted);">Gestiona tus artículos y productos pendientes</p>
      </div>

      <!-- BOTONERA ACCIONES UNIFICADA -->
      <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
        <button id="btnCargarPlan" class="btn-outline" style="width: auto; height: 38px; padding: 0 14px; font-size: 12px; font-weight: 700; border-radius: 10px; display: inline-flex; align-items: center; gap: 6px; margin: 0;">
          ${icons.plan} Cargar del plan
        </button>
        <button id="btnExportarPDF" class="btn-outline" style="width: auto; height: 38px; padding: 0 14px; font-size: 12px; font-weight: 700; border-radius: 10px; display: inline-flex; align-items: center; gap: 6px; margin: 0;">
          ${icons.download} PDF
        </button>
        <button id="btnCompartirWA" class="btn-outline" style="width: auto; height: 38px; padding: 0 14px; font-size: 12px; font-weight: 700; border-radius: 10px; background: var(--primary-light); color: var(--primary); border-color: var(--primary); display: inline-flex; align-items: center; gap: 6px; margin: 0;">
          ${icons.whatsapp} Enviar WhatsApp
        </button>
      </div>
    </div>

    <!-- CAJA PARA AÑADIR PRODUCTO MANUALMENTE -->
    <div class="card" style="padding: 18px; margin-bottom: 20px; border-radius: 18px;">
      <h3 style="margin-top: 0; margin-bottom: 12px; font-size: 15px; font-weight: 800; color: var(--primary); display: flex; align-items: center; gap: 6px;">
        <span style="font-size: 18px;">+</span> Añadir Producto
      </h3>
      <form id="formAddProducto" style="display: flex; gap: 10px; flex-wrap: wrap;">
        <input type="text" id="inputNuevoProducto" placeholder="Ej: Leche, Huevos, Manzanas..." required style="flex: 1; margin: 0; height: 42px;" />
        <button type="submit" style="width: auto; margin: 0; padding: 0 20px; height: 42px; font-size: 13px; font-weight: 700; border-radius: 12px;">
          Añadir a la lista
        </button>
      </form>
    </div>

    <!-- SECCIÓN MI LISTA -->
    <div class="card" style="padding: 20px; border-radius: 18px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
        <h3 style="margin: 0; font-size: 16px; font-weight: 800; color: var(--text-main);">Mi Lista</h3>
        <button id="btnLimpiarLista" class="btn-outline" style="width: auto; padding: 4px 10px; font-size: 11px; margin: 0; color: var(--danger); border-color: transparent; display: flex; align-items: center; gap: 4px;">
          ${icons.trash} Vaciar lista
        </button>
      </div>

      <div id="contenedorListaCompra" style="display: flex; flex-direction: column; gap: 8px;">
        Cargando productos...
      </div>
    </div>

    <!-- MODAL SELECCIÓN DE INGREDIENTES ÚNICOS DEL PLAN -->
    <div id="modalSeleccionarIngredientes" class="sidebar-overlay">
      <div class="card" style="max-width: 500px; width: 92%; margin: 50px auto; max-height: 85vh; padding: 22px; display: flex; flex-direction: column; border-radius: 20px; position: relative;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <h3 style="margin: 0; font-size: 16px; font-weight: 800; color: var(--primary); display: flex; align-items: center; gap: 6px;">
            ${icons.plan} Seleccionar ingredientes del plan
          </h3>
          <button id="btnCloseModalIngredientes" style="background: none; border: none; font-size: 18px; color: var(--text-muted); cursor: pointer; padding: 0; margin: 0; width: auto;">✕</button>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <p style="font-size: 12px; color: var(--text-muted); margin: 0;">Ingredientes únicos encontrados en tu plan de la semana:</p>
          <div style="display: flex; gap: 6px;">
            <button id="btnSelectAll" class="btn-outline" style="width: auto; padding: 2px 8px; font-size: 10px; margin:0; border-radius: 6px;">Marcar todos</button>
            <button id="btnUnselectAll" class="btn-outline" style="width: auto; padding: 2px 8px; font-size: 10px; margin:0; border-radius: 6px;">Desmarcar</button>
          </div>
        </div>

        <div id="listadoModalIngredientes" style="display: flex; flex-direction: column; gap: 8px; max-height: 55vh; overflow-y: auto; padding-right: 4px; flex: 1;">
          Cargando ingredientes del plan...
        </div>

        <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 16px; border-top: 1px solid var(--border); padding-top: 12px;">
          <button type="button" id="btnCancelarModalIngredientes" class="btn-outline" style="width: auto; padding: 8px 16px; margin: 0;">Cancelar</button>
          <button type="button" id="btnConfirmarAñadirIngredientes" class="btn-primary" style="width: auto; padding: 8px 20px; margin: 0;">Añadir seleccionados</button>
        </div>
      </div>
    </div>
  `;

  setTimeout(() => {
    const contenedor = container.querySelector('#contenedorListaCompra');
    const formAdd = container.querySelector('#formAddProducto');
    const inputProducto = container.querySelector('#inputNuevoProducto');

    const modalIngredientes = container.querySelector('#modalSeleccionarIngredientes');
    const listadoModal = container.querySelector('#listadoModalIngredientes');
    const btnCloseModal = container.querySelector('#btnCloseModalIngredientes');
    const btnCancelarModal = container.querySelector('#btnCancelarModalIngredientes');
    const btnConfirmarAñadir = container.querySelector('#btnConfirmarAñadirIngredientes');
    const btnSelectAll = container.querySelector('#btnSelectAll');
    const btnUnselectAll = container.querySelector('#btnUnselectAll');

    function obtenerProductosStorage() {
      const guardados = localStorage.getItem(`bitelife_compra_${usuarioActual.id}`);
      return guardados ? JSON.parse(guardados) : [];
    }

    function guardarProductosStorage(items) {
      localStorage.setItem(`bitelife_compra_${usuarioActual.id}`, JSON.stringify(items));
    }

    function renderizarLista() {
      itemsLista = obtenerProductosStorage();

      if (itemsLista.length === 0) {
        contenedor.innerHTML = `<p style="color: var(--text-muted); font-size: 13px; margin: 0;">La lista de la compra está vacía.</p>`;
        return;
      }

      contenedor.innerHTML = '';
      itemsLista.forEach((item, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.style.cssText = 'display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: var(--input-bg); border-radius: 12px; border: 1px solid var(--border);';
        
        itemDiv.innerHTML = `
          <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; margin: 0; font-size: 13px; font-weight: 600; flex: 1; ${item.comprado ? 'text-decoration: line-through; opacity: 0.6;' : ''}">
            <input type="checkbox" ${item.comprado ? 'checked' : ''} style="width: 18px; height: 18px; accent-color: var(--primary); margin: 0;" />
            <span>${item.nombre}</span>
          </label>
          <button class="btn-eliminar-item" style="background: none; border: none; padding: 4px; margin: 0; width: auto; color: var(--text-muted); cursor: pointer;" title="Eliminar producto">
            ${icons.trash}
          </button>
        `;

        itemDiv.querySelector('input').addEventListener('change', (e) => {
          itemsLista[index].comprado = e.target.checked;
          guardarProductosStorage(itemsLista);
          renderizarLista();
        });

        itemDiv.querySelector('.btn-eliminar-item').addEventListener('click', () => {
          itemsLista.splice(index, 1);
          guardarProductosStorage(itemsLista);
          renderizarLista();
        });

        contenedor.appendChild(itemDiv);
      });
    }

    formAdd.addEventListener('submit', (e) => {
      e.preventDefault();
      const valor = inputProducto.value.trim();
      if (!valor) return;

      itemsLista.push({ nombre: valor, comprado: false });
      guardarProductosStorage(itemsLista);
      inputProducto.value = '';
      renderizarLista();
    });

    // ABRIR MODAL CON INGREDIENTES ÚNICOS
    container.querySelector('#btnCargarPlan').addEventListener('click', async () => {
      listadoModal.innerHTML = '<p style="color: var(--text-muted); font-size: 13px;">Buscando ingredientes en tu plan...</p>';
      modalIngredientes.classList.add('visible');

      const { data: plan } = await supabase
        .from('plan_semanal')
        .select('receta_id, nota_personalizada, recetas:receta_id(nombre, ingredientes)')
        .eq('user_id', usuarioActual.id);

      if (!plan || plan.length === 0) {
        listadoModal.innerHTML = '<p style="color: var(--text-muted); font-size: 13px;">No tienes recetas o alimentos en tu plan semanal.</p>';
        return;
      }

      const conjuntoIngredientes = new Set();

      plan.forEach(item => {
        // Caso 1: Ingredientes de Recetas
        if (item.recetas && item.recetas.ingredientes) {
          const lineas = item.recetas.ingredientes.split('\n');
          lineas.forEach(l => {
            const limpio = limpiarTextoIngrediente(l);
            if (limpio) conjuntoIngredientes.add(limpio);
          });
        } 
        // Caso 2: Alimentos rápidos / notas descompuestas
        else if (item.nota_personalizada) {
          const extraidos = extraerIngredientesDeNota(item.nota_personalizada);
          extraidos.forEach(ing => conjuntoIngredientes.add(ing));
        }
      });

      ingredientesUnicosDisponibles = Array.from(conjuntoIngredientes).sort();

      if (ingredientesUnicosDisponibles.length === 0) {
        listadoModal.innerHTML = '<p style="color: var(--text-muted); font-size: 13px;">No se encontraron ingredientes desglosados en tu plan.</p>';
        return;
      }

      listadoModal.innerHTML = '';

      ingredientesUnicosDisponibles.forEach((ing, idx) => {
        const idChk = `ing_unique_chk_${idx}`;
        const yaExiste = itemsLista.some(e => e.nombre.toLowerCase() === ing.toLowerCase());

        const divItem = document.createElement('div');
        divItem.style.cssText = 'padding: 10px 14px; background: var(--input-bg); border-radius: 12px; border: 1px solid var(--border);';
        
        divItem.innerHTML = `
          <label style="display: flex; align-items: center; justify-content: space-between; font-size: 13px; font-weight: 700; cursor: pointer; margin:0; color: var(--text-main);">
            <div style="display: flex; align-items: center; gap: 10px;">
              <input type="checkbox" class="chk-plan-item" id="${idChk}" value="${ing}" style="width: 18px; height: 18px; accent-color: var(--primary); margin:0;" />
              <span>${ing}</span>
            </div>
            ${yaExiste ? '<span style="font-size: 11px; font-weight: 600; color: var(--text-muted);">(ya en tu lista)</span>' : ''}
          </label>
        `;

        listadoModal.appendChild(divItem);
      });
    });

    btnSelectAll.addEventListener('click', () => {
      listadoModal.querySelectorAll('.chk-plan-item').forEach(c => c.checked = true);
    });

    btnUnselectAll.addEventListener('click', () => {
      listadoModal.querySelectorAll('.chk-plan-item').forEach(c => c.checked = false);
    });

    btnConfirmarAñadir.addEventListener('click', () => {
      const seleccionados = [];

      listadoModal.querySelectorAll('.chk-plan-item:checked').forEach(chk => {
        seleccionados.push(chk.value);
      });

      if (seleccionados.length === 0) {
        alert('Por favor, marca al menos un ingrediente para añadir.');
        return;
      }

      const nuevos = [];
      seleccionados.forEach(nombreIng => {
        if (!itemsLista.some(i => i.nombre.toLowerCase() === nombreIng.toLowerCase())) {
          nuevos.push({ nombre: nombreIng, comprado: false });
        }
      });

      itemsLista = [...itemsLista, ...nuevos];
      guardarProductosStorage(itemsLista);
      renderizarLista();
      modalIngredientes.classList.remove('visible');
    });

    btnCloseModal.addEventListener('click', () => modalIngredientes.classList.remove('visible'));
    btnCancelarModal.addEventListener('click', () => modalIngredientes.classList.remove('visible'));
    modalIngredientes.addEventListener('click', (e) => { if (e.target === modalIngredientes) modalIngredientes.classList.remove('visible'); });

    container.querySelector('#btnLimpiarLista').addEventListener('click', () => {
      if (itemsLista.length === 0) return;
      if (confirm('¿Vaciar toda la lista de la compra?')) {
        itemsLista = [];
        guardarProductosStorage([]);
        renderizarLista();
      }
    });

    container.querySelector('#btnCompartirWA').addEventListener('click', () => {
      if (itemsLista.length === 0) return alert('La lista está vacía.');
      const texto = `🛒 *Lista de la Compra BiteLife*:\n\n` + itemsLista.map(i => `${i.comprado ? '✅' : '•'} ${i.nombre}`).join('\n');
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`, '_blank');
    });

    container.querySelector('#btnExportarPDF').addEventListener('click', () => {
      if (itemsLista.length === 0) return alert('La lista está vacía.');
      window.print();
    });

    renderizarLista();
  }, 0);

  return container;
}