// ===== CONFIGURACIÓN CLOUDFLARE KV & ESTADO =====
const CLOUDFLARE_API_URL = "https://org-juventud-api.adrian-camelot32.workers.dev";
let isAdmin = false;

let nodesMap = {};
let nodeIdCounter = 0;

// DATOS POR DEFECTO
const DEFAULT_ORG_DATA = {
  title: "Dirección General", person: "P. José Daniel García M.U.", color: "green",
  children: [
    { title: "Asistente Dirección General", color: "navy" },
    {
      title: "Subdirección Académica", person: "Lic. Andrea Hernández Rojas", color: "navy",
      children: [
        {
          title: "Direcciones Técnicas", color: "yellow",
          children: [
            { title: "Preescolar", person: "Lic. Ericka Romero", color: "lightblue" },
            { title: "Primaria", person: "Mtra. Laura Romero", color: "lightblue" },
            { title: "Secundaria", person: "Mtra. Dulce Cano", color: "lightblue" },
            { title: "Preparatoria", person: "Mtra. Rosana Mora", color: "lightblue" }
          ]
        },
        {
          title: "Coordinaciones", color: "yellow",
          children: [
            { title: "Inglés", color: "lightblue" },
            { title: "Psicología", color: "lightblue" },
            { title: "Deportes", color: "lightblue" },
            { title: "Extraescolares", color: "lightblue" },
            { title: "Acad. Pastoral", color: "lightblue" },
            { title: "Francés", color: "lightblue" },
            { title: "Servicios Escolares", color: "lightblue" },
            { title: "Innovación Educativa", person: "Maestro Pablo Adrian Rivera Juvenal", color: "lightblue" }
          ]
        }
      ]
    },
    { title: "Área Jurídica", person: "Lic. Iván Vázquez", color: "navy", children: [] },
    {
      title: "Comunicación y Marketing", person: "Lic. Ma. Teresa Romero", color: "navy",
      children: [
        { title: "Admisiones", color: "lightblue" },
        { title: "Marketing MFRs", color: "lightblue" },
        { title: "Redes Sociales", person: "Miss Jimena González, Prof. David Aguirre", color: "lightblue" }
      ]
    },
    {
      title: "Subdirección Administrativa", person: "C.P. Teresa de Jesús Feria Reyna", color: "navy",
      children: [
        {
          title: "Servicios Generales", person: "Juan Ruiz", color: "yellow",
          children: [
            { title: "Mantenimiento", color: "lightblue" },
            { title: "Limpieza", color: "lightblue" },
            { title: "Jardinería", color: "lightblue" }
          ]
        },
        { title: "Compras", person: "Lic. Ma. Elena Ibarra", color: "yellow", children: [] },
        { title: "Recursos Humanos", color: "lightblue" },
        { title: "Control Interno", color: "lightblue" },
        { title: "Relaciones Públicas", person: "Lic. Rosario Gonzaga", color: "lightblue" },
        { title: "Sistemas", person: "Ing. Alfredo Vázquez, Ing. Antonio Silva", color: "lightblue" },
        { title: "Cajas", person: "Miss Krishna Cuadros, Miss Margarita Hernández", color: "lightblue" }
      ]
    }
  ]
};

let orgData = JSON.parse(localStorage.getItem('org_juventud_data')) || DEFAULT_ORG_DATA;

// ===== LÓGICA CLOUDFLARE KV =====
async function loadOrgDataFromCloud() {
  if (!CLOUDFLARE_API_URL) return refreshUI();
  try {
    const response = await fetch(`${CLOUDFLARE_API_URL}?t=${new Date().getTime()}`, { cache: "no-store" });
    if (response.ok) {
      const cloudData = await response.json();
      orgData = cloudData;
      localStorage.setItem('org_juventud_data', JSON.stringify(cloudData));
    }
  } catch (err) { console.log("Offline mode"); } 
  finally { refreshUI(); }
}

async function saveOrgData() {
  if (!isAdmin) return;
  localStorage.setItem('org_juventud_data', JSON.stringify(orgData));
  refreshUI();
  if (!CLOUDFLARE_API_URL) return;
  try { await fetch(CLOUDFLARE_API_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(orgData) }); } 
  catch (err) { console.log("Offline save"); }
}

function refreshUI() {
  nodesMap = {}; nodeIdCounter = 0;
  assignIds(orgData);
  const activeBtn = document.querySelector('.view-btn.active');
  const view = activeBtn ? (activeBtn.getAttribute('onclick').match(/'([^']+)'/)[1] || 'tree') : 'tree';
  switchView(view);
}

function assignIds(node, parent = null) {
  node.id = nodeIdCounter++; node.parentId = parent ? parent.id : null;
  nodesMap[node.id] = node;
  if (node.children) node.children.forEach(c => assignIds(c, node));
  if (node._children) node._children.forEach(c => assignIds(c, node));
}

// ==========================================
// ===== D3.JS: ÁRBOL ORTOGONAL (VERTICAL Y HORIZONTAL) 
// ==========================================
function renderD3Tree(orientation = 'vertical') {
  const container = document.getElementById('view-container');
  container.innerHTML = ''; 
  
  if (typeof d3 === 'undefined') {
    container.innerHTML = `<p class="text-center text-red-500 font-bold p-10">D3.js no cargó. Revisa el HTML.</p>`;
    return;
  }

  const width = container.clientWidth || 1000;
  const height = 650;
  
  const svg = d3.select('#view-container').append('svg')
      .attr('width', '100%').attr('height', '75vh')
      .style('cursor', 'grab').style('border-radius', '16px');

  const g = svg.append('g');
  const zoom = d3.zoom().scaleExtent([0.1, 3]).on('zoom', e => g.attr('transform', e.transform));
  svg.call(zoom);

  const root = d3.hierarchy(orgData, d => d.children);
  
  // Tamaño de separación entre nodos dependiendo de la orientación
  const treeLayout = d3.tree().nodeSize(
      orientation === 'horizontal' ? [180, 350] : [300, 250]
  );
  treeLayout(root);

  // Creador de líneas (Links) con ángulos de 90 grados
  g.append("g").attr("class", "links")
      .selectAll(".link").data(root.links()).join("path")
      .attr("class", "link")
      .attr("fill", "none")
      .attr("stroke", "var(--line)")
      .attr("stroke-width", "3px")
      .attr("d", d => {
          if (orientation === 'horizontal') {
              const startX = d.source.y + 130;
              const startY = d.source.x;
              const endX = d.target.y - 130;
              const endY = d.target.x;
              const midX = (startX + endX) / 2;
              return `M${startX},${startY} H${midX} V${endY} H${endX}`;
          } else {
              const startX = d.source.x;
              const startY = d.source.y + 110;
              const endX = d.target.x;
              const endY = d.target.y - 50; 
              const midY = (startY + endY) / 2;
              return `M${startX},${startY} V${midY} H${endX} V${endY}`;
          }
      });

  const nodeGroup = g.append("g").attr("class", "nodes")
      .selectAll(".node").data(root.descendants()).join("g")
      .attr("class", "node")
      .attr("transform", d => orientation === 'horizontal' ? `translate(${d.y},${d.x})` : `translate(${d.x},${d.y})`);

  nodeGroup.append("foreignObject")
      .attr("x", -130).attr("y", -50)
      .attr("width", 260).attr("height", 240)
      .style("overflow", "visible")
      .append("xhtml:div")
      .html(d => generateCardHTML(d.data, orientation));

  // Posicionar la cámara (zoom inicial) según la vista
  if (orientation === 'horizontal') {
      svg.call(zoom.transform, d3.zoomIdentity.translate(150, height / 2).scale(0.85));
  } else {
      svg.call(zoom.transform, d3.zoomIdentity.translate(width / 2, 80).scale(0.85));
  }
}

function generateCardHTML(data, orientation) {
  const hasChildren = (data.children && data.children.length > 0) || (data._children && data._children.length > 0);
  const isCollapsed = !data.children && data._children;
  
  let html = `<div class="node-card node-${data.color}" data-id="${data.id}" style="margin: 0; width: 100%;">`;
  
  html += `<div class="node-content text-center w-full"><div class="node-title">${data.title}</div>`;
  if (data.person) html += `<div class="node-person">${data.person}</div>`;
  
  if (isAdmin) {
    html += `<div class="node-actions" onclick="event.stopPropagation()">
      <button class="node-btn" title="Editar" onclick="editNode(${data.id})"><i class="fas fa-pen"></i></button>
      <button class="node-btn" title="Añadir" onclick="addNode(${data.id})"><i class="fas fa-plus"></i></button>
      <button class="node-btn" title="Eliminar" onclick="deleteNode(${data.id})"><i class="fas fa-trash"></i></button>
    </div>`;
  }
  
  // Botón expandir adaptado (abajo para vertical, a la derecha para horizontal)
  if (hasChildren) {
    const icon = isCollapsed ? 'fa-plus' : 'fa-minus';
    const btnPosition = orientation === 'horizontal'
        ? `right: -14px; top: 50%; transform: translateY(-50%);`
        : `bottom: -14px; left: 50%; transform: translateX(-50%);`;
        
    html += `<div onclick="toggleD3Node(${data.id})" style="position: absolute; ${btnPosition} cursor: pointer; background: var(--navy); color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; z-index: 10; font-size: 12px; box-shadow: 0 2px 5px rgba(0,0,0,0.3); border: 2px solid white;"><i class="fas ${icon}"></i></div>`;
  }
  
  html += `</div></div>`;
  return html;
}

function toggleD3Node(id) {
  const node = findNodeObj(orgData, id);
  if (!node) return;
  if (node.children) { node._children = node.children; delete node.children; } 
  else if (node._children) { node.children = node._children; delete node._children; }
  saveOrgData(); 
}

function expandAll() { traverseAndExpand(orgData); saveOrgData(); }
function traverseAndExpand(n) {
  if (n._children) { n.children = n._children; delete n._children; }
  if (n.children) n.children.forEach(traverseAndExpand);
}
function collapseAll() { if(orgData.children) orgData.children.forEach(traverseAndCollapse); saveOrgData(); }
function traverseAndCollapse(n) {
  if (n.children) { n._children = n.children; delete n.children; n._children.forEach(traverseAndCollapse); }
}

// ===== FUNCIONES DE EDICIÓN =====
function findNodeObj(root, id) {
  if (root.id === id) return root;
  const children = root.children || root._children;
  if (children) { for (let child of children) { let found = findNodeObj(child, id); if (found) return found; } }
  return null;
}

function findParentObj(root, id, parent = null) {
  if (root.id === id) return parent;
  const children = root.children || root._children;
  if (children) { for (let child of children) { let found = findParentObj(child, id, root); if (found) return found; } }
  return null;
}

function editNode(id) {
  if (!isAdmin) return;
  const node = findNodeObj(orgData, id);
  if (!node) return;
  const newTitle = prompt("Título del área o cargo:", node.title); if (newTitle === null) return;
  const newPerson = prompt("Nombre de la persona (vacío si no hay):", node.person || ""); if (newPerson === null) return;
  const newColor = prompt("Color (green, navy, yellow, lightblue):", node.color);
  
  if (newTitle.trim() !== "") node.title = newTitle.trim();
  if (newPerson.trim() !== "") node.person = newPerson.trim(); else delete node.person;
  if (['green', 'navy', 'yellow', 'lightblue'].includes(newColor)) node.color = newColor;
  saveOrgData();
}

function addNode(id) {
  if (!isAdmin) return;
  const node = findNodeObj(orgData, id);
  if (!node) return;
  const title = prompt("Escribe el nombre del nuevo cargo:"); if (!title || title.trim() === "") return;
  if (!node.children && !node._children) node.children = [];
  const target = node.children ? node.children : node._children;
  target.push({ title: title.trim(), color: "lightblue" });
  saveOrgData();
}

function deleteNode(id) {
  if (!isAdmin) return;
  if (id === 0) { alert("Operación denegada."); return; }
  const node = findNodeObj(orgData, id);
  if (!confirm(`⚠️ ¿Eliminar "${node.title}" y sus dependientes?`)) return;
  const parent = findParentObj(orgData, id);
  if (parent) {
    if (parent.children) parent.children = parent.children.filter(c => c.id !== id);
    if (parent._children) parent._children = parent._children.filter(c => c.id !== id);
    if (parent.children && parent.children.length === 0) delete parent.children;
    if (parent._children && parent._children.length === 0) delete parent._children;
  }
  saveOrgData();
}

// ===== VIEW SWITCHER =====
function switchView(view, event) {
  document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
  if(event && event.currentTarget) event.currentTarget.classList.add('active');
  else { const btn = document.querySelector(`.view-btn[onclick*="${view}"]`); if(btn) btn.classList.add('active'); }
  
  const container = document.getElementById('view-container');
  const controlsBar = document.getElementById('controls-bar');
  const wfControls = document.getElementById('workflow-controls');
  
  if(!container) return;

  controlsBar.style.display = 'none'; wfControls.style.display = 'none';
  container.className = 'org-tree'; container.classList.remove('workflow-mode');
  
  if (view === 'tree') {
    controlsBar.style.display = 'flex';
    renderD3Tree('vertical');
  } else if (view === 'map-h') {
    renderD3Tree('horizontal');
  } else if (view === 'workflow') {
    wfControls.style.display = 'block';
    container.classList.add('workflow-mode');
    renderD3Tree('horizontal'); // Flujo luce mejor en modo horizontal
    populateDropdowns();
  }
}

// ===== WORKFLOW PATHFINDING (Actualizado para las tarjetas D3) =====
function populateDropdowns() {
  const emisorSel = document.getElementById('emisor-select');
  const receptorSel = document.getElementById('receptor-select');
  if(!emisorSel || !receptorSel) return;
  emisorSel.innerHTML = ''; receptorSel.innerHTML = '';
  Object.values(nodesMap).forEach(node => {
    if (node.id === 0) return; 
    const opt = document.createElement('option');
    opt.value = node.id;
    opt.textContent = node.title + (node.person ? ` (${node.person.split(',')[0]})` : "");
    emisorSel.appendChild(opt);
    receptorSel.appendChild(opt.cloneNode(true));
  });
  if(emisorSel.options.length > 1) { emisorSel.selectedIndex = 0; receptorSel.selectedIndex = 5; }
}

function getAncestors(id) {
  const path = []; let current = nodesMap[id];
  while (current) { path.push(current.id); current = current.parentId !== null ? nodesMap[current.parentId] : null; }
  return path;
}

function calculatePath() {
  const startId = parseInt(document.getElementById('emisor-select').value);
  const endId = parseInt(document.getElementById('receptor-select').value);
  
  document.querySelectorAll('.node-card').forEach(c => {
    c.classList.remove('path-active', 'path-start', 'path-end');
    const num = c.querySelector('.path-number'); if (num) num.remove();
  });
  
  const summaryDiv = document.getElementById('workflow-summary');
  if (startId === endId) {
    summaryDiv.style.display = 'block'; summaryDiv.innerHTML = `<p class="font-bold text-red-600">Emisor y receptor son la misma área.</p>`; return;
  }
  
  const pathStart = getAncestors(startId); const pathEnd = getAncestors(endId);
  const setEnd = new Set(pathEnd); const lcaId = pathStart.find(id => setEnd.has(id));
  
  const route = [];
  for (let id of pathStart) { route.push(id); if (id === lcaId) break; }
  const downPath = [];
  for (let id of pathEnd) { if (id === lcaId) break; downPath.push(id); }
  downPath.reverse(); route.push(...downPath);
  
  route.forEach((id, index) => {
    const el = document.querySelector(`.node-card[data-id="${id}"]`);
    if (el) {
      el.classList.add('path-active');
      if (id === startId) el.classList.add('path-start');
      if (id === endId) el.classList.add('path-end');
      const num = document.createElement('div');
      num.className = 'path-number'; num.textContent = index + 1;
      el.appendChild(num);
    }
  });
  
  const instances = route.length; const steps = instances - 1;
  let routeHtml = route.map((id, i) => {
    const node = nodesMap[id]; let label = node.title;
    if (id === startId) label = `<strong style="color:#009944;">⬆ ${label}</strong>`;
    if (id === endId) label = `<strong style="color:#032A60;">⬇ ${label}</strong>`;
    return `<div class="path-step">${i+1}. ${label}</div>${i < route.length-1 ? '<i class="fas fa-arrow-right path-arrow"></i>' : ''}`;
  }).join('');
  
  summaryDiv.style.display = 'block';
  summaryDiv.innerHTML = `
    <h4 class="title-font font-bold uppercase text-base sm:text-lg mb-2">Ruta Calculada</h4>
    <div class="flex flex-wrap gap-2 mb-4">
      <span class="path-step" style="background:#009944; color:white;">Instancias: ${instances}</span>
      <span class="path-step" style="background:#032A60; color:white;">Pasos: ${steps}</span>
    </div>
    <div class="flex flex-wrap items-center mt-2 border-t pt-4">${routeHtml}</div>
  `;
}

// ===== EVENTOS Y DARK MODE ======
function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
  const isDarkMode = document.body.classList.contains('dark-mode');
  const icon = document.querySelector('#dark-mode-toggle i');
  const text = document.getElementById('dark-mode-text');
  if (isDarkMode) { if(icon) icon.classList.replace('fa-moon', 'fa-sun'); if(text) text.textContent = 'Modo Claro'; localStorage.setItem('theme', 'dark'); } 
  else { if(icon) icon.classList.replace('fa-sun', 'fa-moon'); if(text) text.textContent = 'Modo Oscuro'; localStorage.setItem('theme', 'light'); }
}

if (localStorage.getItem('theme') === 'dark') {
  document.body.classList.add('dark-mode');
  document.addEventListener('DOMContentLoaded', () => {
    const icon = document.querySelector('#dark-mode-toggle i');
    const text = document.getElementById('dark-mode-text');
    if(icon) icon.classList.replace('fa-moon', 'fa-sun'); if(text) text.textContent = 'Modo Claro';
  });
}

if ('serviceWorker' in navigator) { window.addEventListener('load', () => { navigator.serviceWorker.register('./sw.js').catch(err => console.log('Error SW:', err)); }); }

document.addEventListener('DOMContentLoaded', () => {
  const guestBtn = document.getElementById('btn-guest-login');
  const adminBtn = document.getElementById('btn-admin-login');
  const closeModal = document.getElementById('close-modal');
  const exportBtn = document.getElementById('btn-export-json');
  const importBtn = document.getElementById('btn-import-json');
  const resetBtn = document.getElementById('btn-reset-org');
  const importFile = document.getElementById('import-file-input');
  
  if(guestBtn) guestBtn.addEventListener('click', () => {
    isAdmin = false; document.getElementById('auth-screen').classList.add('hidden'); document.getElementById('settings-btn').classList.add('hidden');
    loadOrgDataFromCloud();
  });

  if(adminBtn) adminBtn.addEventListener('click', () => {
    if (document.getElementById('admin-pass-input').value === "psique33") { 
      isAdmin = true; document.getElementById('auth-screen').classList.add('hidden'); document.getElementById('settings-btn').classList.remove('hidden');
      loadOrgDataFromCloud();
    } else alert("Contraseña incorrecta. Intenta de nuevo.");
  });

  if(closeModal) closeModal.addEventListener('click', () => document.getElementById('settings-modal').classList.add('hidden'));

  if(exportBtn) exportBtn.addEventListener('click', () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(orgData, null, 2));
    const link = document.createElement('a'); link.href = dataStr; link.download = "Juventud_Respaldo.json"; link.click();
  });

  if(importBtn && importFile) {
    importBtn.addEventListener('click', () => importFile.click());
    importFile.addEventListener('change', (e) => {
      const file = e.target.files[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = function(evt) {
        try { orgData = JSON.parse(evt.target.result); saveOrgData(); document.getElementById('settings-modal').classList.add('hidden'); alert("Restaurado con éxito."); } 
        catch (err) { alert("Error: Archivo JSON no válido."); }
      };
      reader.readAsText(file);
    });
  }

  if(resetBtn) resetBtn.addEventListener('click', () => {
    if (confirm("⚠️ ¿Restaurar el organigrama a la versión de fábrica? Se perderán los datos en la nube.")) {
      localStorage.removeItem('org_juventud_data'); orgData = JSON.parse(JSON.stringify(DEFAULT_ORG_DATA));
      saveOrgData(); document.getElementById('settings-modal').classList.add('hidden');
    }
  });
});
