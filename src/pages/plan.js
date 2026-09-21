import { supabase } from '../supabase.js';

export function renderPlanView(usuarioActual) {
  const container = document.createElement('div');

  const bookSVG = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
    </svg>
  `;

  const searchSVG = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  `;

  const trashSVG = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
  `;

  const sparklerSVG = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"></path>
    </svg>
  `;

  let cacheMisRecetas = null;
  let cacheCatalogo = null;

  let fechaActual = new Date();

  function getLunesActual(fecha) {
    const d = new Date(fecha);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }

  let lunesSemana = getLunesActual(fechaActual);

  function generarDiasSemana(lunes) {
    const nombresCortos = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const nombresLargos = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    const nombresMesesCompletos = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const nombresMesesCortos = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    const dias = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(lunes);
      d.setDate(lunes.getDate() + i);
      const isoDate = d.toISOString().split('T')[0];
      const esHoy = new Date().toISOString().split('T')[0] === isoDate;

      dias.push({
        iso: isoDate,
        fechaObj: d,
        nombreLargo: `${nombresLargos[i]}, ${d.getDate()} de ${nombresMesesCortos[d.getMonth()]}`,
        nombreCorto: nombresCortos[i],
        numero: d.getDate(),
        mesNombre: nombresMesesCompletos[d.getMonth()],
        anio: d.getFullYear(),
        esHoy
      });
    }
    return dias;
  }

  let diasCalculados = generarDiasSemana(lunesSemana);
  let diaSeleccionadoObj = diasCalculados.find(d => d.esHoy) || diasCalculados[0];
  let tipoComidaSeleccionado = 'Desayuno';

  container.innerHTML = `
    <div class="plan-grid-wrapper">
      <div>
        <div style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 12px; border-bottom: 1px solid var(--border); padding-bottom: 16px;">
          <div>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
              <span style="font-size: 18px; color: var(--primary);">📅</span>
              <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: var(--primary);" id="textMesAnio">
                ${diaSeleccionadoObj.mesNombre} ${diaSeleccionadoObj.anio}
              </h1>
            </div>
            <h3 style="margin: 0; font-size: 15px; font-weight: 600; color: var(--text-main);" id="titleDiaActual">
              ${diaSeleccionadoObj.nombreLargo}
            </h3>
          </div>

          <div style="display: flex; gap: 6px; flex-wrap: wrap; align-items: center;">
            <button id="btnAutoPlan" class="btn-primary" style="width: auto; margin:0; padding: 7px 14px; font-size: 13px; font-weight: 700; display: inline-flex; align-items: center; gap: 6px; background: var(--primary-gradient); box-shadow: var(--shadow);">
              ${sparklerSVG} Generar Menú Diario
            </button>
            <button id="btnLimpiarPlan" class="btn-outline" style="width: auto; margin:0; padding: 7px 12px; font-size: 13px; color: var(--danger);" title="Vaciar día actual">
              ${trashSVG} Limpiar Día
            </button>
            <button id="btnSemanaAnterior" class="btn-outline" style="width: auto; margin:0; padding: 6px 12px; font-size: 13px;">◀</button>
            <button id="btnHoy" class="btn-outline" style="width: auto; margin:0; padding: 6px 12px; font-size: 13px; font-weight: 600;">Hoy</button>
            <button id="btnSemanaSiguiente" class="btn-outline" style="width: auto; margin:0; padding: 6px 12px; font-size: 13px;">▶</button>
          </div>
        </div>

        <div class="days-selector-container" id="pillsContainer"></div>
        <div id="listaComidasPlan">Cargando menú...</div>
      </div>

      <div class="card" style="padding: 18px; border-radius: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
          <h4 style="margin: 0; font-size: 15px; font-weight: 700;" id="miniCalTitle">Calendario</h4>
          <div style="display: flex; gap: 4px;">
            <button id="btnMiniPrev" style="width: 28px; height: 28px; padding: 0; margin: 0; background: var(--input-bg); color: var(--text-main); border-radius: 8px;">‹</button>
            <button id="btnMiniNext" style="width: 28px; height: 28px; padding: 0; margin: 0; background: var(--input-bg); color: var(--text-main); border-radius: 8px;">›</button>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(7, 1fr); text-align: center; font-size: 11px; font-weight: 700; color: var(--text-muted); margin-bottom: 8px;">
          <div>L</div><div>M</div><div>X</div><div>J</div><div>V</div><div>S</div><div>D</div>
        </div>

        <div id="miniCalGrid" style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; text-align: center;"></div>
      </div>
    </div>

    <!-- MODAL SELECCIÓN DE RECETA -->
    <div id="modalSelectReceta" class="sidebar-overlay">
      <div class="card" style="max-width: 450px; width: 90%; margin: 60px auto; max-height: 80vh; overflow-y: auto;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h3 style="margin: 0; font-size: 18px; color: var(--primary);">Mis Recetas</h3>
          <button id="btnCloseModalRecetas" style="width: auto; background: none; border: none; font-size: 20px; color: var(--text-muted); cursor: pointer; padding: 0; margin: 0;">✕</button>
        </div>
        <div id="listadoModalRecetas" style="display: flex; flex-direction: column; gap: 10px;"></div>
      </div>
    </div>

    <!-- MODAL BUSCADOR DE ALIMENTOS -->
    <div id="modalSearchAlimento" class="sidebar-overlay">
      <div class="card" style="max-width: 480px; width: 92%; margin: 50px auto; max-height: 85vh; padding: 20px; display: flex; flex-direction: column;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <h3 style="margin: 0; font-size: 18px; color: var(--primary); font-weight: 800;">🔍 Buscar Alimento o Comida</h3>
          <button id="btnCloseModalSearch" style="width: auto; background: none; border: none; font-size: 20px; color: var(--text-muted); cursor: pointer; padding: 0; margin: 0;">✕</button>
        </div>

        <input type="text" id="inputSearchAlimento" placeholder="Empieza a escribir (ej: 'Açai', 'Pasta')..." style="margin-top: 0; margin-bottom: 10px; height: 44px;" />

        <div id="listadoSugerencias" style="display: flex; flex-direction: column; gap: 8px; max-height: 50vh; overflow-y: auto; flex: 1;"></div>
      </div>
    </div>

    <!-- MODAL DE CONFIRMACIÓN -->
    <div id="modalConfirmacion" class="sidebar-overlay">
      <div class="card" style="max-width: 400px; width: 90%; margin: 120px auto; padding: 24px; text-align: center;">
        <h3 id="confirmTitle" style="margin-top: 0; font-size: 18px; font-weight: 800; color: var(--text-main);">¿Confirmar acción?</h3>
        <p id="confirmMsg" style="font-size: 14px; color: var(--text-muted); margin-bottom: 24px; line-height: 1.5;"></p>
        <div style="display: flex; gap: 10px; justify-content: center;">
          <button id="btnCancelConfirm" class="btn-outline" style="width: auto; padding: 8px 18px; margin: 0;">Cancelar</button>
          <button id="btnAcceptConfirm" class="btn-primary" style="width: auto; padding: 8px 22px; margin: 0;">Aceptar</button>
        </div>
      </div>
    </div>
  `;

  let miniCalFecha = new Date(diaSeleccionadoObj.fechaObj);

  function pedirConfirmacion(titulo, mensaje, callbackAceptar) {
    const modal = container.querySelector('#modalConfirmacion');
    const title = container.querySelector('#confirmTitle');
    const msg = container.querySelector('#confirmMsg');
    const btnCancel = container.querySelector('#btnCancelConfirm');
    const btnAccept = container.querySelector('#btnAcceptConfirm');

    title.innerText = titulo;
    msg.innerText = mensaje;

    modal.classList.add('visible');

    const cerrar = () => {
      modal.classList.remove('visible');
      btnAccept.onclick = null;
      btnCancel.onclick = null;
    };

    btnCancel.onclick = cerrar;
    btnAccept.onclick = () => {
      cerrar();
      callbackAceptar();
    };
  }

  function renderMiniCal() {
    const grid = container.querySelector('#miniCalGrid');
    const title = container.querySelector('#miniCalTitle');
    const nombresMeses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    
    const anio = miniCalFecha.getFullYear();
    const mes = miniCalFecha.getMonth();

    title.innerText = `${nombresMeses[mes]} ${anio}`;

    const primerDiaMes = new Date(anio, mes, 1);
    const ultimoDiaMes = new Date(anio, mes + 1, 0);

    let startDay = primerDiaMes.getDay() - 1;
    if (startDay === -1) startDay = 6;

    const totalDias = ultimoDiaMes.getDate();
    const hoyIso = new Date().toISOString().split('T')[0];

    grid.innerHTML = '';

    for (let i = 0; i < startDay; i++) {
      grid.innerHTML += `<div></div>`;
    }

    for (let d = 1; d <= totalDias; d++) {
      const fechaIter = new Date(anio, mes, d);
      const isoIter = fechaIter.toISOString().split('T')[0];

      const esHoy = isoIter === hoyIso;
      const esSeleccionado = isoIter === diaSeleccionadoObj.iso;

      let style = `padding: 6px 0; font-size: 12px; font-weight: 600; border-radius: 10px; cursor: pointer; transition: all 0.2s;`;
      
      if (esSeleccionado) {
        style += ` background-color: var(--primary); color: white;`;
      } else if (esHoy) {
        style += ` background-color: var(--primary-light); color: var(--primary); border: 1px solid var(--primary);`;
      } else {
        style += ` color: var(--text-main);`;
      }

      const cell = document.createElement('div');
      cell.style.cssText = style;
      cell.innerText = d;

      cell.addEventListener('click', () => {
        lunesSemana = getLunesActual(fechaIter);
        diasCalculados = generarDiasSemana(lunesSemana);
        diaSeleccionadoObj = diasCalculados.find(di => di.iso === isoIter);
        
        actualizarEncabezado();
        renderPills();
        renderMiniCal();
        cargarMenuDia();
      });

      grid.appendChild(cell);
    }
  }

  function actualizarEncabezado() {
    container.querySelector('#textMesAnio').innerText = `${diaSeleccionadoObj.mesNombre} ${diaSeleccionadoObj.anio}`;
    container.querySelector('#titleDiaActual').innerText = diaSeleccionadoObj.nombreLargo;
  }

  function renderPills() {
    const containerPills = container.querySelector('#pillsContainer');
    containerPills.innerHTML = diasCalculados.map(d => `
      <div class="day-pill ${d.iso === diaSeleccionadoObj.iso ? 'active' : ''}" data-iso="${d.iso}">
        <div class="day-name">${d.nombreCorto}</div>
        <div class="day-number">${d.numero}</div>
      </div>
    `).join('');

    containerPills.querySelectorAll('.day-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        const iso = pill.getAttribute('data-iso');
        diaSeleccionadoObj = diasCalculados.find(d => d.iso === iso);
        miniCalFecha = new Date(diaSeleccionadoObj.fechaObj);
        actualizarEncabezado();
        renderPills();
        renderMiniCal();
        cargarMenuDia();
      });
    });
  }

  async function cargarMenuDia() {
    const list = container.querySelector('#listaComidasPlan');

    const promesas = [
      supabase.from('plan_semanal').select('*').eq('user_id', usuarioActual.id).eq('dia_semana', diaSeleccionadoObj.iso)
    ];

    if (!cacheMisRecetas) {
      promesas.push(supabase.from('recetas').select('*').eq('user_id', usuarioActual.id));
    }
    if (!cacheCatalogo) {
      promesas.push(supabase.from('catalogo_alimentos').select('*'));
    }

    const resultados = await Promise.all(promesas);
    const planData = resultados[0].data || [];

    let idxPromesa = 1;
    if (!cacheMisRecetas) {
      cacheMisRecetas = resultados[idxPromesa]?.data || [];
      idxPromesa++;
    }
    if (!cacheCatalogo) {
      cacheCatalogo = resultados[idxPromesa]?.data || [];
    }

    const misRecetas = cacheMisRecetas;
    const catalogo = cacheCatalogo;

    const tiposComida = [
      { id: 'Desayuno', label: 'Desayuno' },
      { id: 'Comida', label: 'Almuerzo / Comida' },
      { id: 'Merienda', label: 'Merienda' },
      { id: 'Cena', label: 'Cena' }
    ];

    list.innerHTML = '';

    tiposComida.forEach(tipo => {
      const asignaciones = planData.filter(p => p.comida_tipo === tipo.id);

      const card = document.createElement('div');
      card.className = 'card';
      card.style.cssText = 'padding: 16px; border-radius: 18px; margin-bottom: 16px; border: 1px solid var(--border);';

      let itemsHtml = '';

      if (asignaciones.length === 0) {
        itemsHtml = `<div style="font-size: 13px; color: var(--text-muted); margin: 8px 0;">Sin asignar</div>`;
      } else {
        itemsHtml = asignaciones.map(asig => {
          const recetaAsignada = asig.receta_id ? misRecetas.find(r => r.id === asig.receta_id) : null;
          const texto = recetaAsignada ? recetaAsignada.nombre : asig.nota_personalizada;
          
          let imgUrl = recetaAsignada ? recetaAsignada.imagen_url : null;
          
          if (!imgUrl && asig.nota_personalizada) {
            const matchCat = catalogo.find(c => c.nombre.toLowerCase().trim() === asig.nota_personalizada.toLowerCase().trim());
            if (matchCat && matchCat.imagen_url) imgUrl = matchCat.imagen_url;
          }

          const imgBadgeHtml = imgUrl 
            ? `<img src="${imgUrl}" style="width: 38px; height: 38px; border-radius: 10px; object-fit: cover;" />`
            : `<div style="width: 38px; height: 38px; border-radius: 10px; background: var(--primary-light); display: flex; align-items: center; justify-content: center; font-size: 20px;">👨‍🍳</div>`;

          return `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background: var(--input-bg); border-radius: 12px; margin-bottom: 8px; border: 1px solid var(--border);">
              <div style="display: flex; align-items: center; gap: 10px;">
                ${imgBadgeHtml}
                <div>
                  <div style="font-size: 14px; font-weight: 700; color: var(--text-main);">${texto}</div>
                  <div style="font-size: 11px; color: var(--text-muted);">${recetaAsignada ? `⏱️ ${recetaAsignada.tiempo_preparacion || 15} min` : 'Alimento rápido'}</div>
                </div>
              </div>
              <button class="btn-delete-subitem btn-outline" data-id="${asig.id}" style="width: 28px; height: 28px; padding:0; margin:0; border-radius: 6px; color: var(--danger); display: inline-flex; align-items: center; justify-content: center;">${trashSVG}</button>
            </div>
          `;
        }).join('');
      }

      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <span class="meal-badge" style="margin:0;">${tipo.label}</span>
          
          <div style="display: flex; gap: 6px;">
            <button type="button" class="btn-add-receta btn-outline" style="width: auto; padding: 5px 10px; margin: 0; font-size: 12px; border-radius: 8px; display: inline-flex; align-items: center; gap: 4px;">
              ${bookSVG} + Receta
            </button>
            <button type="button" class="btn-add-alimento btn-outline" style="width: auto; padding: 5px 10px; margin: 0; font-size: 12px; border-radius: 8px; display: inline-flex; align-items: center; gap: 4px;">
              ${searchSVG} + Alimento
            </button>
          </div>
        </div>

        <div class="items-list-container">
          ${itemsHtml}
        </div>
      `;

      card.querySelector('.btn-add-receta').addEventListener('click', () => {
        tipoComidaSeleccionado = tipo.id;
        const modal = container.querySelector('#modalSelectReceta');
        const listado = container.querySelector('#listadoModalRecetas');

        listado.innerHTML = '';

        if (!misRecetas || misRecetas.length === 0) {
          listado.innerHTML = `<p style="text-align:center; color: var(--text-muted); font-size:14px; padding: 20px 0;">No tienes recetas aún.</p>`;
        } else {
          misRecetas.forEach(r => {
            const item = document.createElement('div');
            item.className = 'card';
            item.style.cssText = 'padding: 10px 14px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; border: 1px solid var(--border); transition: all 0.2s;';
            item.innerHTML = `
              <div>
                <div style="font-weight: 700; font-size: 14px;">${r.nombre}</div>
                <div style="font-size: 11px; color: var(--text-muted);">⏱️ ${r.tiempo_preparacion || 15} min</div>
              </div>
              <span style="color: var(--primary); font-size: 18px;">+</span>
            `;

            item.addEventListener('click', async () => {
              await supabase.from('plan_semanal').insert([{
                user_id: usuarioActual.id,
                dia_semana: diaSeleccionadoObj.iso,
                comida_tipo: tipoComidaSeleccionado,
                receta_id: r.id,
                nota_personalizada: null
              }]);
              modal.classList.remove('visible');
              cargarMenuDia();
            });

            listado.appendChild(item);
          });
        }

        modal.classList.add('visible');
      });

      card.querySelector('.btn-add-alimento').addEventListener('click', () => {
        tipoComidaSeleccionado = tipo.id;
        const modal = container.querySelector('#modalSearchAlimento');
        const input = container.querySelector('#inputSearchAlimento');
        const listado = container.querySelector('#listadoSugerencias');

        input.value = '';

        async function buscarSugerenciasEnSupabase(query = '') {
          const q = query.trim().toLowerCase();

          let sugerencias = catalogo.filter(c => c.nombre.toLowerCase().includes(q)).slice(0, 10);

          listado.innerHTML = '';

          if (q.length > 0) {
            const itemCustom = document.createElement('div');
            itemCustom.className = 'card';
            itemCustom.style.cssText = 'padding: 10px 14px; cursor: pointer; border: 1px solid var(--primary); background: var(--primary-light); font-weight: 700; color: var(--primary); font-size: 14px; display: flex; align-items: center; gap: 8px;';
            itemCustom.innerHTML = `<span>+</span> <span>Añadir "${q}"</span>`;
            itemCustom.addEventListener('click', async () => await guardarYSeleccionarAlimento(q));
            listado.appendChild(itemCustom);
          }

          if (sugerencias.length > 0) {
            sugerencias.forEach(itemObj => {
              const item = document.createElement('div');
              item.className = 'card';
              item.style.cssText = 'padding: 10px 14px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; border: 1px solid var(--border); font-size: 14px; font-weight: 600;';
              
              const imgHtml = itemObj.imagen_url 
                ? `<img src="${itemObj.imagen_url}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;" />`
                : `<div style="width: 32px; height: 32px; border-radius: 50%; background: var(--primary-light); display: flex; align-items: center; justify-content: center; font-size: 16px;">👨‍🍳</div>`;

              item.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px;">
                  ${imgHtml}
                  <div>
                    <div>${itemObj.nombre}</div>
                    <div style="font-size: 10px; color: var(--text-muted);">${itemObj.categoria || 'Alimento'}</div>
                  </div>
                </div>
                <span style="color: var(--primary); font-size: 16px;">+</span>
              `;

              item.addEventListener('click', async () => await guardarYSeleccionarAlimento(itemObj.nombre, itemObj.imagen_url));
              listado.appendChild(item);
            });
          }
        }

        async function guardarYSeleccionarAlimento(texto, imagenOpt = null) {
          const limpio = texto.trim();
          if (!limpio) return;

          await supabase.from('plan_semanal').insert([{
            user_id: usuarioActual.id,
            dia_semana: diaSeleccionadoObj.iso,
            comida_tipo: tipoComidaSeleccionado,
            receta_id: null,
            nota_personalizada: limpio
          }]);

          const { data: nuevoCat } = await supabase.from('catalogo_alimentos').insert([{
            nombre: limpio,
            categoria: tipoComidaSeleccionado,
            imagen_url: imagenOpt
          }]).select();

          if (nuevoCat && nuevoCat.length > 0) {
            cacheCatalogo.push(nuevoCat[0]);
          }

          modal.classList.remove('visible');
          cargarMenuDia();
        }

        input.oninput = () => buscarSugerenciasEnSupabase(input.value);

        buscarSugerenciasEnSupabase();
        modal.classList.add('visible');
        setTimeout(() => input.focus(), 100);
      });

      card.querySelectorAll('.btn-delete-subitem').forEach(btn => {
        btn.addEventListener('click', async () => {
          const idBorrar = btn.getAttribute('data-id');
          await supabase.from('plan_semanal').delete().eq('id', idBorrar);
          cargarMenuDia();
        });
      });

      list.appendChild(card);
    });
  }

  // GENERAR MENÚ SOLO PARA EL DÍA SELECCIONADO
  function iniciarGeneracionMenuDiario() {
    pedirConfirmacion(
      `Generar Menú para el ${diaSeleccionadoObj.nombreLargo}`,
      "Se planificarán automáticamente las comidas de este día.",
      async () => {
        const btnAuto = container.querySelector('#btnAutoPlan');
        btnAuto.disabled = true;
        btnAuto.innerText = 'Generando día...';

        try {
          function mezclar(array) {
            let arr = [...array];
            for (let i = arr.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [arr[i], arr[j]] = [arr[j], arr[i]];
            }
            return arr;
          }

          const tiposComida = ['Desayuno', 'Comida', 'Merienda', 'Cena'];
          let asignadosHoy = [];

          for (const tipo of tiposComida) {
            // Filtrar recetas aptas que encajen en el tipo de comida y no se hayan asignado hoy
            const aptas = (cacheMisRecetas || []).filter(r => 
              (r.categorias || '').includes(tipo) && !asignadosHoy.includes(r.id)
            );

            // Comprobar si ya existe asignación en este día para ese tipo de comida
            const { data: existe } = await supabase
              .from('plan_semanal')
              .select('id')
              .eq('user_id', usuarioActual.id)
              .eq('dia_semana', diaSeleccionadoObj.iso)
              .eq('comida_tipo', tipo);

            if (!existe || existe.length === 0) {
              if (aptas.length > 0) {
                const recetaElegida = mezclar(aptas)[0];
                asignadosHoy.push(recetaElegida.id);

                await supabase.from('plan_semanal').insert([{
                  user_id: usuarioActual.id,
                  dia_semana: diaSeleccionadoObj.iso,
                  comida_tipo: tipo,
                  receta_id: recetaElegida.id,
                  nota_personalizada: null
                }]);
              } else {
                // Usar catálogo de respaldo
                const deCat = (cacheCatalogo || []).filter(c => c.categoria === tipo).map(c => c.nombre);
                const disponibles = deCat.filter(o => !asignadosHoy.includes(o));
                const alimentoElegido = disponibles.length > 0 ? mezclar(disponibles)[0] : (deCat.length > 0 ? mezclar(deCat)[0] : 'Comida rápida');

                asignadosHoy.push(alimentoElegido);

                await supabase.from('plan_semanal').insert([{
                  user_id: usuarioActual.id,
                  dia_semana: diaSeleccionadoObj.iso,
                  comida_tipo: tipo,
                  receta_id: null,
                  nota_personalizada: alimentoElegido
                }]);
              }
            }
          }

          cargarMenuDia();
        } catch (err) {
          console.error("Error al generar menú diario:", err);
        } finally {
          btnAuto.disabled = false;
          btnAuto.innerHTML = `${sparklerSVG} Generar Menú Diario`;
        }
      }
    );
  }

  // VACIAR ÚNICAMENTE EL DÍA SELECCIONADO
  function iniciarLimpiezaMenuDiario() {
    pedirConfirmacion(
      "Vaciar Día",
      `¿Deseas eliminar las asignaciones del ${diaSeleccionadoObj.nombreLargo}?`,
      async () => {
        await supabase
          .from('plan_semanal')
          .delete()
          .eq('user_id', usuarioActual.id)
          .eq('dia_semana', diaSeleccionadoObj.iso);

        cargarMenuDia();
      }
    );
  }

  setTimeout(() => {
    container.querySelector('#btnAutoPlan').addEventListener('click', iniciarGeneracionMenuDiario);
    container.querySelector('#btnLimpiarPlan').addEventListener('click', iniciarLimpiezaMenuDiario);

    container.querySelector('#btnCloseModalRecetas').addEventListener('click', () => container.querySelector('#modalSelectReceta').classList.remove('visible'));
    container.querySelector('#btnCloseModalSearch').addEventListener('click', () => container.querySelector('#modalSearchAlimento').classList.remove('visible'));
    
    container.querySelector('#modalSelectReceta').addEventListener('click', (e) => { if (e.target.id === 'modalSelectReceta') container.querySelector('#modalSelectReceta').classList.remove('visible'); });
    container.querySelector('#modalSearchAlimento').addEventListener('click', (e) => { if (e.target.id === 'modalSearchAlimento') container.querySelector('#modalSearchAlimento').classList.remove('visible'); });
    container.querySelector('#modalConfirmacion').addEventListener('click', (e) => { if (e.target.id === 'modalConfirmacion') container.querySelector('#modalConfirmacion').classList.remove('visible'); });

    container.querySelector('#btnMiniPrev').addEventListener('click', () => { miniCalFecha.setMonth(miniCalFecha.getMonth() - 1); renderMiniCal(); });
    container.querySelector('#btnMiniNext').addEventListener('click', () => { miniCalFecha.setMonth(miniCalFecha.getMonth() + 1); renderMiniCal(); });

    container.querySelector('#btnSemanaAnterior').addEventListener('click', () => {
      lunesSemana.setDate(lunesSemana.getDate() - 7);
      diasCalculados = generarDiasSemana(lunesSemana);
      diaSeleccionadoObj = diasCalculados[0];
      miniCalFecha = new Date(diaSeleccionadoObj.fechaObj);
      actualizarEncabezado();
      renderPills();
      renderMiniCal();
      cargarMenuDia();
    });

    container.querySelector('#btnSemanaSiguiente').addEventListener('click', () => {
      lunesSemana.setDate(lunesSemana.getDate() + 7);
      diasCalculados = generarDiasSemana(lunesSemana);
      diaSeleccionadoObj = diasCalculados[0];
      miniCalFecha = new Date(diaSeleccionadoObj.fechaObj);
      actualizarEncabezado();
      renderPills();
      renderMiniCal();
      cargarMenuDia();
    });

    container.querySelector('#btnHoy').addEventListener('click', () => {
      lunesSemana = getLunesActual(new Date());
      diasCalculados = generarDiasSemana(lunesSemana);
      diaSeleccionadoObj = diasCalculados.find(d => d.esHoy) || diasCalculados[0];
      miniCalFecha = new Date(diaSeleccionadoObj.fechaObj);
      actualizarEncabezado();
      renderPills();
      renderMiniCal();
      cargarMenuDia();
    });

    renderPills();
    renderMiniCal();
    cargarMenuDia();
  }, 0);

  return container;
}