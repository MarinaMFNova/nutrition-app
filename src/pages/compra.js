import { supabase } from '../supabase.js';

export function renderCompraView(usuarioActual) {
  const container = document.createElement('div');
  container.className = 'container';

  const whatsappSVG = `
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.38 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
    </svg>
  `;

  const pdfSVG = `
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
      <polyline points="10 9 9 9 8 9"></polyline>
    </svg>
  `;

  const desgloseAlimentosRapidos = {
    'Café solo / con leche': ['Café', 'Leche / Bebida vegetal'],
    'Tostada con tomate y aceite': ['Pan integral', 'Tomates maduros', 'Aceite de oliva'],
    'Tostada con aguacate y huevo': ['Pan integral', 'Aguacates', 'Huevos'],
    'Porridge de avena con fruta': ['Avena', 'Leche / Bebida vegetal', 'Fruta de temporada'],
    'Huevos revueltos con aguacate': ['Huevos', 'Aguacates'],
    'Pechuga de pollo a la plancha con verduras': ['Pechuga de pollo', 'Verduras variadas'],
    'Salmón a la plancha con espárragos': ['Lomos de salmón', 'Espárragos verdes'],
    'Pasta integral boloñesa': ['Pasta integral', 'Carne picada', 'Salsa de tomate'],
    'Arroz integral con salteado de verduras y pavo': ['Arroz integral', 'Verduras variadas', 'Pavo'],
    'Lentejas guisadas con verduras': ['Lentejas', 'Verduras para guiso'],
    'Plátano con almendras': ['Plátanos', 'Almendras'],
    'Manzana con canela': ['Manzanas', 'Canela'],
    'Yogur proteico con arándanos': ['Yogur proteico', 'Arándanos'],
    'Batido de proteínas de vainilla': ['Proteína en polvo', 'Leche / Bebida vegetal'],
    'Tortilla francesa con ensalada': ['Huevos', 'Bolsa de ensalada variada'],
    'Crema de calabacín y quesitos': ['Calabacines', 'Quesitos suaves'],
    'Ensalada mixta con atún y huevo cocido': ['Lechuga', 'Latita de atún', 'Huevos'],
    'Gazpacho fresco con virutas de jamón': ['Gazpacho', 'Jamón serrano']
  };

  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
      <div>
        <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: var(--primary);">🛒 Lista de la Compra</h1>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: var(--text-muted);">Gestiona tus artículos y productos pendientes</p>
      </div>

      <div style="display: flex; gap: 8px; flex-wrap: wrap;">
        <button id="btnImportarMenu" class="btn-outline" style="width: auto; padding: 8px 14px; margin: 0; font-size: 13px; font-weight: 600;">
          📥 Cargar ingredientes de la semana
        </button>
        <button id="btnExportarPDF" class="btn-outline" style="width: auto; padding: 8px 14px; margin: 0; font-size: 13px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px;">
          ${pdfSVG} Descargar PDF
        </button>
        <button id="btnEnviarWhatsApp" class="btn-primary" style="width: auto; padding: 8px 16px; margin: 0; font-size: 13px; font-weight: 700; background: #25D366; border: none; color: white; display: inline-flex; align-items: center; gap: 6px;">
          ${whatsappSVG} Enviar por WhatsApp
        </button>
      </div>
    </div>

    <div class="card" style="margin-bottom: 20px;">
      <h3 style="margin-top: 0; margin-bottom: 12px; font-size: 16px; color: var(--primary);">➕ Añadir Producto</h3>
      <div style="display: flex; gap: 8px;">
        <input type="text" id="compraItemInput" placeholder="Ej: Leche, Huevos, Manzanas..." style="margin: 0; height: 42px;">
        <button id="btnAgregarItemCompra" style="width: auto; padding: 0 18px; margin: 0; white-space: nowrap;">Añadir a la lista</button>
      </div>
    </div>

    <div class="card">
      <h3 style="margin-top: 0; margin-bottom: 14px; font-size: 16px;">Mi Lista</h3>
      <div id="listaCompraContenido">Cargando lista...</div>
    </div>

    <!-- MODAL DE SELECCIÓN DE INGREDIENTES SEMANALES -->
    <div id="modalSeleccionarIngredientes" class="sidebar-overlay">
      <div class="card" style="max-width: 480px; width: 92%; margin: 50px auto; max-height: 80vh; padding: 20px; display: flex; flex-direction: column;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <h3 style="margin: 0; font-size: 18px; color: var(--primary); font-weight: 800;">Selecciona ingredientes</h3>
          <button id="btnCloseModalIngredientes" style="width: auto; background: none; border: none; font-size: 20px; color: var(--text-muted); cursor: pointer; padding: 0; margin: 0;">✕</button>
        </div>
        
        <p style="font-size: 13px; color: var(--text-muted); margin: 0 0 12px 0;">Marca los ingredientes desglosados que te hagan falta:</p>

        <div id="listadoIngredientesSeleccionables" style="display: flex; flex-direction: column; gap: 8px; max-height: 50vh; overflow-y: auto; flex: 1; margin-bottom: 16px;"></div>

        <div style="display: flex; gap: 10px; justify-content: flex-end;">
          <button id="btnCancelarImportacion" class="btn-outline" style="width: auto; padding: 8px 16px; margin: 0;">Cancelar</button>
          <button id="btnConfirmarImportacion" class="btn-primary" style="width: auto; padding: 8px 20px; margin: 0;">Añadir Seleccionados</button>
        </div>
      </div>
    </div>
  `;

  let itemsActuales = [];

  async function cargarListaCompra() {
    const list = container.querySelector('#listaCompraContenido');
    const { data, error } = await supabase
      .from('lista_compra')
      .select('*')
      .eq('user_id', usuarioActual.id)
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      itemsActuales = [];
      list.innerHTML = '<p style="color: var(--text-muted); font-size: 14px;">La lista de la compra está vacía.</p>';
      return;
    }

    itemsActuales = data;
    list.innerHTML = '';

    data.forEach(i => {
      const div = document.createElement('div');
      div.className = `checklist-item ${i.comprado ? 'done' : ''}`;
      div.style.cssText = 'display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; border-bottom: 1px solid var(--border);';
      
      div.innerHTML = `
        <span style="cursor: pointer; flex: 1; font-weight: 600; ${i.comprado ? 'text-decoration: line-through; opacity: 0.5;' : ''}">${i.item}</span>
        <button class="btn-danger btn-delete-item" style="width:auto; padding: 4px 10px; font-size: 12px; margin: 0; border-radius: 6px;">✕</button>
      `;

      div.querySelector('span').addEventListener('click', async () => {
        await supabase.from('lista_compra').update({ comprado: !i.comprado }).eq('id', i.id);
        cargarListaCompra();
      });

      div.querySelector('.btn-delete-item').addEventListener('click', async (e) => {
        e.stopPropagation();
        await supabase.from('lista_compra').delete().eq('id', i.id);
        cargarListaCompra();
      });

      list.appendChild(div);
    });
  }

  async function abrirModalSeleccionIngredientes() {
    const modal = container.querySelector('#modalSeleccionarIngredientes');
    const listado = container.querySelector('#listadoIngredientesSeleccionables');

    listado.innerHTML = '<p style="color: var(--text-muted); font-size: 13px;">Desglosando ingredientes...</p>';
    modal.classList.add('visible');

    try {
      const d = new Date();
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const lunes = new Date(d.setDate(diff));

      const fechasSemana = [];
      for (let i = 0; i < 7; i++) {
        const fechaIter = new Date(lunes);
        fechaIter.setDate(lunes.getDate() + i);
        fechasSemana.push(fechaIter.toISOString().split('T')[0]);
      }

      const { data: plan } = await supabase
        .from('plan_semanal')
        .select('*')
        .eq('user_id', usuarioActual.id)
        .in('dia_semana', fechasSemana);

      const { data: recetas } = await supabase
        .from('recetas')
        .select('*')
        .eq('user_id', usuarioActual.id);

      let ingredientesExtraidos = [];

      if (plan && plan.length > 0) {
        plan.forEach(item => {
          if (item.receta_id && recetas) {
            const rec = recetas.find(r => r.id === item.receta_id);
            if (rec && rec.ingredientes) {
              rec.ingredientes.split('\n').forEach(ing => {
                if (ing.trim()) ingredientesExtraidos.push(ing.trim());
              });
            } else if (rec) {
              ingredientesExtraidos.push(rec.nombre);
            }
          } else if (item.nota_personalizada) {
            const nombrePlato = item.nota_personalizada;
            const desglose = desgloseAlimentosRapidos[nombrePlato];

            if (desglose) {
              ingredientesExtraidos.push(...desglose);
            } else {
              ingredientesExtraidos.push(nombrePlato);
            }
          }
        });
      }

      const unicos = [...new Set(ingredientesExtraidos)];
      const existentesNombres = itemsActuales.map(i => i.item.toLowerCase());

      const candidatos = unicos.filter(ing => !existentesNombres.includes(ing.toLowerCase()));

      if (candidatos.length === 0) {
        listado.innerHTML = '<p style="color: var(--text-muted); font-size: 13px; text-align: center; padding: 20px 0;">No hay nuevos ingredientes que añadir de la semana.</p>';
        return;
      }

      listado.innerHTML = candidatos.map(ing => `
        <label style="display: flex; align-items: center; gap: 10px; padding: 8px 12px; background: var(--input-bg); border-radius: 10px; border: 1px solid var(--border); cursor: pointer; font-size: 14px; font-weight: 600;">
          <input type="checkbox" class="chk-importar-item" value="${ing}" checked style="width: 16px; height: 16px; accent-color: var(--primary);" />
          <span>${ing}</span>
        </label>
      `).join('');

    } catch (err) {
      console.error("Error al desglosar ingredientes:", err);
    }
  }

  async function confirmarImportacion() {
    const seleccionados = [];
    container.querySelectorAll('.chk-importar-item:checked').forEach(chk => {
      seleccionados.push(chk.value);
    });

    if (seleccionados.length > 0) {
      const payload = seleccionados.map(ing => ({ user_id: usuarioActual.id, item: ing, comprado: false }));
      await supabase.from('lista_compra').insert(payload);
      cargarListaCompra();
    }

    container.querySelector('#modalSeleccionarIngredientes').classList.remove('visible');
  }

  // 1. MANDAR LISTA POR WHATSAPP
  function exportarAWhatsApp() {
    if (itemsActuales.length === 0) {
      alert("La lista de la compra está vacía.");
      return;
    }

    const textoWhatsApp = `🛒 *Lista de la Compra - BiteLife*\n\n` + 
      itemsActuales.map(i => `${i.comprado ? '✅' : '•'} ${i.item}`).join('\n') +
      `\n\n_Generado con BiteLife_`;

    const urlWhatsApp = `https://api.whatsapp.com/send?text=${encodeURIComponent(textoWhatsApp)}`;
    window.open(urlWhatsApp, '_blank');
  }

function exportarAPDF() {
    if (itemsActuales.length === 0) {
      alert("La lista de la compra está vacía.");
      return;
    }

    const ventana = window.open('', '_blank');
    
    const itemsHtml = itemsActuales.map(i => `
      <div class="item-row ${i.comprado ? 'comprado' : ''}">
        <div class="item-left">
          <span class="checkbox-box">${i.comprado ? '✓' : ''}</span>
          <span class="item-text">${i.item}</span>
        </div>
        <span class="status-badge ${i.comprado ? 'status-done' : 'status-pending'}">
          ${i.comprado ? 'Comprado' : 'Pendiente'}
        </span>
      </div>
    `).join('');

    ventana.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title></title>
        <style>
          @page { 
            size: A4; 
            margin: 15mm; 
          }
          body {
            font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
            color: #1f2937;
            background-color: #fff;
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .pdf-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #0d9488;
            padding-bottom: 16px;
            margin-bottom: 24px;
          }
          .brand-title {
            font-size: 26px;
            font-weight: 800;
            color: #0d9488;
            margin: 0;
          }
          .meta-info {
            font-size: 12px;
            color: #6b7280;
            text-align: right;
          }
          .list-container {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
          .item-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 10px 14px;
            background-color: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 10px;
          }
          .item-row.comprado {
            background-color: #f3f4f6;
            opacity: 0.65;
          }
          .item-left {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .checkbox-box {
            width: 18px;
            height: 18px;
            border: 2px solid #0d9488;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
            color: #0d9488;
            background-color: #fff;
          }
          .item-text {
            font-size: 14px;
            font-weight: 600;
            color: #111827;
          }
          .item-row.comprado .item-text {
            text-decoration: line-through;
          }
          .status-badge {
            font-size: 11px;
            font-weight: 700;
            padding: 3px 8px;
            border-radius: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .status-pending {
            background-color: #fef3c7;
            color: #d97706;
          }
          .status-done {
            background-color: #d1fae5;
            color: #059669;
          }
          .pdf-footer {
            margin-top: 30px;
            padding-top: 12px;
            border-top: 1px solid #f3f4f6;
            font-size: 11px;
            color: #9ca3af;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="pdf-header">
          <div>
            <h1 class="brand-title">🛒 BiteLife</h1>
            <span style="font-size: 13px; color: #4b5563; font-weight: 600;">Lista de la Compra</span>
          </div>
          <div class="meta-info">
            <div>Fecha: <strong>${new Date().toLocaleDateString('es-ES')}</strong></div>
            <div>Total artículos: <strong>${itemsActuales.length}</strong></div>
          </div>
        </div>

        <div class="list-container">
          ${itemsHtml}
        </div>

        <div class="pdf-footer">
          Generado automáticamente con BiteLife App
        </div>

        <script>
          window.onload = function() {
            document.title = "";
            window.print();
            window.close();
          }
        </script>
      </body>
      </html>
    `);
    ventana.document.close();
  }
  setTimeout(() => {
    container.querySelector('#btnAgregarItemCompra').addEventListener('click', async () => {
      const input = container.querySelector('#compraItemInput');
      const item = input.value.trim();
      if (!item) return;

      await supabase.from('lista_compra').insert([{ user_id: usuarioActual.id, item, comprado: false }]);
      input.value = '';
      cargarListaCompra();
    });

    container.querySelector('#btnImportarMenu').addEventListener('click', abrirModalSeleccionIngredientes);
    container.querySelector('#btnConfirmarImportacion').addEventListener('click', confirmarImportacion);
    
    container.querySelector('#btnCancelarImportacion').addEventListener('click', () => {
      container.querySelector('#modalSeleccionarIngredientes').classList.remove('visible');
    });

    container.querySelector('#btnCloseModalIngredientes').addEventListener('click', () => {
      container.querySelector('#modalSeleccionarIngredientes').classList.remove('visible');
    });

    container.querySelector('#modalSeleccionarIngredientes').addEventListener('click', (e) => {
      if (e.target.id === 'modalSeleccionarIngredientes') {
        container.querySelector('#modalSeleccionarIngredientes').classList.remove('visible');
      }
    });

    container.querySelector('#btnEnviarWhatsApp').addEventListener('click', exportarAWhatsApp);
    container.querySelector('#btnExportarPDF').addEventListener('click', exportarAPDF);

    cargarListaCompra();
  }, 0);

  return container;
}