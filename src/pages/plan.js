import { supabase } from '../supabase.js';

export function renderPlanView(usuarioActual) {
  const container = document.createElement('div');
  
  const chefHatSVG = `
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M6 13.8a4.5 4.5 0 1 1 2.61-7.06 5 5 0 0 1 6.78 0A4.5 4.5 0 1 1 18 13.8"></path>
      <path d="M6 13.8h12v3a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-3z"></path>
    </svg>
  `;

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

  container.innerHTML = `
    <!-- CONTENEDOR GRID DOS COLUMNAS -->
    <div class="plan-grid-wrapper">
      
      <!-- COLUMNA IZQUIERDA: PLANIFICADOR DE COMIDAS -->
      <div>
        <div style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 12px; border-bottom: 1px solid var(--border); padding-bottom: 16px;">
          <div>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
              <span style="font-size: 20px;">📅</span>
              <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: var(--primary);" id="textMesAnio">
                ${diaSeleccionadoObj.mesNombre} ${diaSeleccionadoObj.anio}
              </h1>
            </div>
            <h3 style="margin: 0; font-size: 15px; font-weight: 600; color: var(--text-main);" id="titleDiaActual">
              ${diaSeleccionadoObj.nombreLargo}
            </h3>
          </div>

          <div style="display: flex; gap: 6px;">
            <button id="btnSemanaAnterior" class="btn-outline" style="width: auto; margin:0; padding: 6px 12px; font-size: 13px;">◀ Anterior</button>
            <button id="btnHoy" class="btn-outline" style="width: auto; margin:0; padding: 6px 12px; font-size: 13px; font-weight: 600;">Hoy</button>
            <button id="btnSemanaSiguiente" class="btn-outline" style="width: auto; margin:0; padding: 6px 12px; font-size: 13px;">Siguiente ▶</button>
          </div>
        </div>

        <!-- SELECTOR DE DÍAS HORIZONTAL -->
        <div class="days-selector-container" id="pillsContainer"></div>

        <!-- COMIDAS DEL DÍA -->
        <div id="listaComidasPlan">Cargando menú...</div>
      </div>

      <!-- COLUMNA DERECHA: CALENDARIO CENTRADO -->
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
  `;

  let miniCalFecha = new Date(diaSeleccionadoObj.fechaObj);

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

  function obtenerImagenUrl(receta) {
    if (!receta) return null;
    if (receta.imagen_url) return receta.imagen_url;
    if (receta.imagen) return receta.imagen;
    if (receta.pasos && receta.pasos.includes('[Imagen: ')) {
      const match = receta.pasos.match(/\[Imagen:\s*([^\]]+)\]/);
      if (match && match[1]) return match[1];
    }
    return null;
  }

  async function cargarMenuDia() {
    const list = container.querySelector('#listaComidasPlan');
    list.innerHTML = '<p style="color: var(--text-muted); font-size: 14px;">Cargando menú...</p>';

    const { data: misRecetas } = await supabase.from('recetas').select('*');
    
    const { data: planData } = await supabase
      .from('plan_semanal')
      .select('*')
      .or(`dia_semana.eq.${diaSeleccionadoObj.iso},dia_semana.eq.${diaSeleccionadoObj.nombreLargo.split(',')[0]}`);

    const tiposComida = [
      { id: 'Desayuno', label: 'Desayuno' },
      { id: 'Comida', label: 'Almuerzo / Comida' },
      { id: 'Merienda', label: 'Merienda' },
      { id: 'Cena', label: 'Cena' }
    ];

    list.innerHTML = '';

    tiposComida.forEach(tipo => {
      const asignacion = planData ? planData.find(p => p.comida_tipo === tipo.id) : null;
      const recetaAsignada = asignacion && misRecetas ? misRecetas.find(r => r.id === asignacion.receta_id) : null;
      
      const textoPersonalizado = asignacion && asignacion.nota_personalizada ? asignacion.nota_personalizada : '';
      const esCustom = asignacion && !asignacion.receta_id && textoPersonalizado;

      const imgUrl = obtenerImagenUrl(recetaAsignada);
      
      let opciones = `
        <option value="">+ Añadir comida...</option>
        <option value="__CUSTOM__" ${esCustom ? 'selected' : ''}>✏️ Escribir comida personalizada...</option>
      `;

      if (misRecetas && misRecetas.length > 0) {
        opciones += `<optgroup label="Mis Recetas">`;
        misRecetas.forEach(r => {
          const selected = recetaAsignada && recetaAsignada.id === r.id ? 'selected' : '';
          opciones += `<option value="${r.id}" ${selected}>📖 ${r.nombre}</option>`;
        });
        opciones += `</optgroup>`;
      }

      const card = document.createElement('div');
      card.className = 'meal-card';

      card.innerHTML = `
        <div class="meal-img-wrapper">
          ${imgUrl 
            ? `<img src="${imgUrl}" alt="${recetaAsignada ? recetaAsignada.nombre : tipo.label}" />`
            : (esCustom ? `<span style="font-size: 32px;">🍏</span>` : chefHatSVG)
          }
        </div>
        
        <div class="meal-info">
          <span class="meal-badge">${tipo.label}</span>
          
          <select class="meal-select-custom">
            ${opciones}
          </select>

          <div class="custom-input-wrapper ${esCustom ? '' : 'hidden'}" style="margin-top: 8px;">
            <input type="text" placeholder="Ej: Fruta variada, Yogur..." value="${textoPersonalizado}">
            <button class="btn-icon-save">Guardar</button>
          </div>

          <div style="font-size: 12px; color: var(--text-muted); margin-top: 6px;">
            ${recetaAsignada 
              ? `⏱️ ${recetaAsignada.tiempo_preparacion || 15} min` 
              : (esCustom ? `✏️ ${textoPersonalizado}` : 'Sin programar')
            }
          </div>
        </div>
      `;

      const select = card.querySelector('select');
      const customWrapper = card.querySelector('.custom-input-wrapper');
      const inputCustom = card.querySelector('.custom-input-wrapper input');
      const btnSaveCustom = card.querySelector('.btn-icon-save');

      select.addEventListener('change', async (e) => {
        const val = e.target.value;

        if (val === '__CUSTOM__') {
          customWrapper.classList.remove('hidden');
          inputCustom.focus();
        } else {
          customWrapper.classList.add('hidden');
          
          if (!val) {
            if (asignacion) await supabase.from('plan_semanal').delete().eq('id', asignacion.id);
          } else {
            if (asignacion) {
              await supabase.from('plan_semanal').update({ receta_id: val, nota_personalizada: null, dia_semana: diaSeleccionadoObj.iso }).eq('id', asignacion.id);
            } else {
              await supabase.from('plan_semanal').insert([{
                user_id: usuarioActual.id,
                dia_semana: diaSeleccionadoObj.iso,
                comida_tipo: tipo.id,
                receta_id: val
              }]);
            }
          }
          cargarMenuDia();
        }
      });

      btnSaveCustom.addEventListener('click', async () => {
        const txt = inputCustom.value.trim();
        if (!txt) return;

        if (asignacion) {
          await supabase.from('plan_semanal').update({ receta_id: null, nota_personalizada: txt, dia_semana: diaSeleccionadoObj.iso }).eq('id', asignacion.id);
        } else {
          await supabase.from('plan_semanal').insert([{
            user_id: usuarioActual.id,
            dia_semana: diaSeleccionadoObj.iso,
            comida_tipo: tipo.id,
            receta_id: null,
            nota_personalizada: txt
          }]);
        }
        cargarMenuDia();
      });

      list.appendChild(card);
    });
  }

  setTimeout(() => {
    container.querySelector('#btnMiniPrev').addEventListener('click', () => {
      miniCalFecha.setMonth(miniCalFecha.getMonth() - 1);
      renderMiniCal();
    });

    container.querySelector('#btnMiniNext').addEventListener('click', () => {
      miniCalFecha.setMonth(miniCalFecha.getMonth() + 1);
      renderMiniCal();
    });

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