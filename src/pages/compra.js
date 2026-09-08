import { supabase } from '../supabase.js';

export function renderCompraView(usuarioActual) {
  const container = document.createElement('div');
  container.className = 'container';
  container.innerHTML = `
    <div class="card">
      <h3>🛒 Añadir Producto</h3>
      <input type="text" id="compraItemInput" placeholder="Ej: Leche, Huevos, Manzanas...">
      <button id="btnAgregarItemCompra">Añadir a la lista</button>
    </div>

    <div class="card">
      <h3>Lista de la Compra</h3>
      <div id="listaCompraContenido">Cargando lista...</div>
    </div>
  `;

  async function cargarListaCompra() {
    const list = container.querySelector('#listaCompraContenido');
    const { data, error } = await supabase.from('lista_compra').select('*').order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      list.innerHTML = '<p style="color: var(--text-muted); font-size: 14px;">La lista de la compra está vacía.</p>';
      return;
    }

    list.innerHTML = '';
    data.forEach(i => {
      const div = document.createElement('div');
      div.className = `checklist-item ${i.comprado ? 'done' : ''}`;
      div.innerHTML = `
        <span>${i.item}</span>
        <button class="btn-danger" style="width:auto; padding: 4px 8px; font-size: 12px; margin: 0;">X</button>
      `;
      div.querySelector('span').addEventListener('click', async () => {
        await supabase.from('lista_compra').update({ comprado: !i.comprado }).eq('id', i.id);
        cargarListaCompra();
      });
      div.querySelector('button').addEventListener('click', async () => {
        await supabase.from('lista_compra').delete().eq('id', i.id);
        cargarListaCompra();
      });
      list.appendChild(div);
    });
  }

  setTimeout(() => {
    container.querySelector('#btnAgregarItemCompra').addEventListener('click', async () => {
      const item = container.querySelector('#compraItemInput').value.trim();
      if (!item) return;

      await supabase.from('lista_compra').insert([{ user_id: usuarioActual.id, item }]);
      container.querySelector('#compraItemInput').value = '';
      cargarListaCompra();
    });

    cargarListaCompra();
  }, 0);

  return container;
}