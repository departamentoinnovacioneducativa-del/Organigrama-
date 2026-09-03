// ===== CONFIGURACIÓN CLOUDFLARE KV & ESTADO =====
const CLOUDFLARE_API_URL = "https://org-lad-api.adrian-camelot32.workers.dev/api/org"; // Estamos usando tu mismo Worker del proyecto anterior
let isAdmin = false;

let nodesMap = {};
let nodeIdCounter = 0;

// DATOS POR DEFECTO (Estructura Instituto Juventud)
const DEFAULT_ORG_DATA = {
  title: "Dirección General",
  person: "P. José Daniel García",
  color: "green",
  children: [
    { title: "Asistente de Dirección General", person: "Sara Hernández", color: "navy" },
    {
      title: "Subdirección Académica", person: "Andrea Hernández", color: "navy",
      children: [
        {
          title: "Direcciones Técnicas", color: "yellow",
          children: [
            { title: "Preescolar", color: "lightblue" },
            { title: "Primaria", color: "lightblue" },
            { title: "Secundaria", color: "lightblue" },
            { title: "Preparatoria", color: "lightblue" }
          ]
        },
        {
          title: "Coordinaciones Institucionales", color: "yellow",
          children: [
            { title: "Inglés", color: "lightblue" },
            { title: "Psicología", color: "lightblue" },
            { title: "Educación Física", color: "lightblue" },
            { title: "Extraescolares", color: "lightblue" },
            { title: "Pastoral", color: "lightblue" },
            { title: "Francés", color: "lightblue" }
          ]
        },
        { title: "Innovación Educativa", person: "P. Adrian Rivera Juvenal", color: "lightblue" },
        { title: "Servicios Escolares", person: "Elizabeth Oceguera Palacios", color: "lightblue" }
      ]
    },
    {
      title: "Área Jurídica", person: "Iván Vázquez", color: "navy",
      children: [{ title: "Seguridad", person: "Julio César Jiménez Romero", color: "lightblue" }]
    },
    {
      title: "Comunicación y Marketing Institucional", person: "María Teresa Romero", color: "navy",
      children: [
        { title: "Admisiones", color: "lightblue" },
        { title: "Marketing MFRS", color: "lightblue" },
        { title: "Redes Sociales", person: "Jimena González y David Aguirre", color: "lightblue" }
      ]
    },
    {
      title: "Subdirección Administrativa", person: "Teresa de Jesús Feria", color: "navy",
      children: [
        {
          title: "Servicios Generales", person: "Juan Ruiz López", color: "yellow",
          children: [
            { title: "Mantenimiento y Limpieza", person: "Adrián Galindo / José Manuel Bernal", color: "lightblue" },
            { title: "Jardinería", person: "Andrés Marcelino Rodriguez", color: "lightblue" }
          ]
        },
        {
          title: "Compras", person: "Maria Elena Ibarra Alvarez", color: "yellow",
          children: [{ title: "Atención a pedidos", person: "Juan Ruiz López", color: "lightblue" }]
        },
        {
          title: "Recursos Humanos", color: "yellow",
          children: [{ title: "Relaciones Públicas", person: "Maria del Rosario Gonzaga Vera", color: "lightblue" }]
        },
        {
          title: "Control Interno", color: "yellow",
          children: [{ title: "Sistemas", person: "Alfredo Vázquez y Antonio Silva", color: "lightblue" }]
        },
        {
          title: "Tesorería", person: "Maria del Socorro Hdez", color: "yellow",
          children: [{ title: "Cajas", person: "Krishna Cuadros, Margarita Hernández", color: "lightblue" }]
        }
      ]
    }
  ]
};

// Variable Global de Datos
let orgData = JSON.parse(localStorage.getItem('org_juventud_data')) || DEFAULT_ORG_DATA;

// ===== LÓGICA CLOUDFLARE KV =====
async function loadOrgDataFromCloud() {
  try {
    const response = await fetch(CLOUDFLARE_API_URL);
    if (response.ok) {
      const cloudData = await response.json();
      orgData = cloudData;
      localStorage.setItem('org_juventud_data', JSON.stringify(cloudData));
    }
  } catch (err) {
    console.log("Offline mode: Usando datos locales.");
  } finally {
    refreshUI();
  }
}

async function saveOrgData() {
  if (!isAdmin) return;
  localStorage.setItem('org_juventud_data', JSON.stringify(orgData));
  refreshUI();
  try {
    await fetch(CLOUDFLARE_API_URL, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(orgData)
    });
  } catch (err) {
    console.log("Sincronización pendiente (offline).");
  }
}

// ===== INICIADOR DE UI =====
function refreshUI() {
  nodesMap = {};
  nodeIdCounter = 0;
  assignIds(orgData);
  
  // Refrescar la vista actual (Por defecto es Tree)
  const activeBtn = document.querySelector('.view-btn.active');
  const view = activeBtn ? (activeBtn.getAttribute('onclick').match(/'([^']+)'/)[1] || 'tree') : 'tree';
  
  const eventMock = { currentTarget: activeBtn || document.querySelector('.view-btn') };
  switchView(view, eventMock);
}

function assignIds(node, parent = null) {
  node.id = nodeIdCounter++;
  node.parentId = parent ? parent.id : null;
  nodesMap[node.id] = node;
  if (node.children) node.children.forEach(c => assignIds(c, node));
}

// ===== RENDERING: TREE (CON BOTONES) =====
function renderTree(node, isRoot = false) {
  const hasChildren = node.children && node.children.length > 0;
  const wrapperClass = isRoot ? 'node-item root-node' : 'node-item';
  let html = `<div class="${wrapperClass}">`;
  
  const click = hasChildren ? ' onclick="toggleNode(this, event)"' : '';
  html += `<div class="node-card node-${node.color} ${hasChildren ? 'has-children' : ''}"${click}>`;
  html += hasChildren ? `<div class="toggle-icon"><i class="fas fa-chevron-down"></i></div>` : `<div class="leaf-icon"><i class="fas fa-circle"></i></div>`;
  html += `<div class="node-content"><div class="node-title">${node.title}</div>`;
  if (node.person) html += `<div class="node-person">${node.person}</div>`;
  
  // Botones de Admin
  if (isAdmin) {
    html += `<div class="node-actions" onclick="event.stopPropagation()">
      <button class="node-btn" title="Editar" onclick="editNode(${node.id})"><i class="fas fa-pen"></i></button>
      <button class="node-btn" title="Añadir subnodo" onclick="addNode(${node.id})"><i class="fas fa-plus"></i></button>
      <button class="node-btn" title="Eliminar" onclick="deleteNode(${node.id})"><i class="fas fa-trash"></i></button>
    </div>`;
  }
  html += `</div></div>`;
  
  if (hasChildren) {
    html += `<div class="children-list"><div class="children-list-inner">`;
    node.children.forEach(c => html += renderTree(c));
    html += `</div></div>`;
  }
  return html + `</div>`;
}

// ===== RENDERING: MAPS (CON BOTONES) =====
function renderMap(node, orientation = 'vertical') {
  const hasChildren = node.children && node.children.length > 0;
  let html = `<div class="map-node-wrapper">`;
  html += `<div class="map-card node-${node.color}" data-id="${node.id}">`;
  html += `<div class="map-card-title">${node.title}</div>`;
  if (node.person) html += `<div class="map-card-person">${node.person}</div>`;
  
  // Botones Admin
  if (isAdmin) {
    html += `<div class="map-actions" onclick="event.stopPropagation()">
      <button class="node-btn" onclick="editNode(${node.id})"><i class="fas fa-pen"></i></button>
      <button class="node-btn" onclick="addNode(${node.id})"><i class="fas fa-plus"></i></button>
      <button class="node-btn" onclick="deleteNode(${node.id})"><i class="fas fa-trash"></i></button>
    </div>`;
  }
  html += `</div>`;
  
  if (hasChildren) {
    html += `<div class="map-children-row">`;
    node.children.forEach(c => html += renderMap(c, orientation));
    html += `</div>`;
  }
  return html + `</div>`;
}

// ===== FUNCIONES DE EDICIÓN =====
function findNodeObj(root, id) {
  if (root.id === id) return root;
  if (root.children) {
    for (let child of root.children) {
      let found = findNodeObj(child, id);
      if (found) return found;
    }
  }
  return null;
}

function findParentObj(root, id, parent = null) {
  if (root.id === id) return parent;
  if (root.children) {
    for (let child of root.children) {
      let found = findParentObj(child, id, root);
      if (found) return found;
    }
  }
  return null;
}

function editNode(id) {
  if (!isAdmin) return;
  const node = findNodeObj(orgData, id);
  if (!node) return;
  
  const newTitle = prompt("Título del área o cargo:", node.title);
  if (newTitle === null) return;
  
  const newPerson = prompt("Nombre de la persona (deja en blanco si está vacante):", node.person || "");
  if (newPerson === null) return;
  
  const newColor = prompt("Color del nodo (green, navy, yellow, lightblue):", node.color);
  
  if (newTitle.trim() !== "") node.title = newTitle.trim();
  if (newPerson.trim() !== "") node.person = newPerson.trim();
  else delete node.person;
  
  if (['green', 'navy', 'yellow', 'lightblue'].includes(newColor)) node.color = newColor;
  
  saveOrgData();
}

function addNode(id) {
  if (!isAdmin) return;
  const node = findNodeObj(orgData, id);
  if (!node) return;
  
  const title = prompt("Escribe el nombre del nuevo sub-cargo o departamento:");
  if (!title || title.trim() === "") return;
  
  if (!node.children) node.children = [];
  node.children.push({
    title: title.trim(),
    color: "lightblue" // El color por defecto para nuevos nodos es el azul claro
  });
  
  saveOrgData();
}

function deleteNode(id) {
  if (!isAdmin) return;
  if (id === 0) { alert("Operación denegada: No puedes eliminar la Dirección General."); return; }
  
  const node = findNodeObj(orgData, id);
  if (!confirm(`⚠️ ¿Estás seguro de eliminar "${node.title}" y todos los departamentos que dependen de él?`)) return;
  
  const parent = findParentObj(orgData, id);
  if (parent && parent.children) {
    parent.children = parent.children.filter(c => c.id !== id);
    if (parent.children.length === 0) delete parent.children;
  }
  saveOrgData();
}


// ===== VIEW SWITCHER =====
function switchView(view, event) {
  document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
  if(event && event.currentTarget) event.currentTarget.classList.add('active');
  
  const container = document.getElementById('view-container');
  const controlsBar = document.getElementById('controls-bar');
  const wfControls = document.getElementById('workflow-controls');
  
  if(!container) return;

  controlsBar.style.display = 'none';
  wfControls.style.display = 'none';
  container.className = '';
  container.classList.remove('workflow-mode');
  
  if (view === 'tree') {
    controlsBar.style.display = 'flex';
    container.className = 'org-tree';
    container.innerHTML = renderTree(orgData, true);
  } else if (view === 'map-v') {
    container.className = 'map-container';
    container.innerHTML = `<div class="map-vertical">${renderMap(orgData, 'vertical')}</div>`;
  } else if (view === 'map-h') {
    container.className = 'map-container';
    container.innerHTML = `<div class="map-horizontal">${renderMap(orgData, 'horizontal')}</div>`;
  } else if (view === 'workflow') {
    wfControls.style.display = 'block';
    container.className = 'map-container workflow-mode';
    container.innerHTML = `<div class="map-vertical">${renderMap(orgData, 'vertical')}</div>`;
    populateDropdowns();
  }
}

// ===== WORKFLOW PATHFINDING =====
function populateDropdowns() {
  const emisorSel = document.getElementById('emisor-select');
  const receptorSel = document.getElementById('receptor-select');
  if(!emisorSel || !receptorSel) return;
  
  emisorSel.innerHTML = ''; receptorSel.innerHTML = '';
  
  Object.values(nodesMap).forEach(node => {
    if (node.id === 0) return; 
    
    const opt1 = document.createElement('option');
    opt1.value = node.id;
    opt1.textContent = node.title + (node.person ? ` (${node.person.split(',')[0]})` : "");
    emisorSel.appendChild(opt1);
    
    const opt2 = opt1.cloneNode(true);
    receptorSel.appendChild(opt2);
  });
  if(emisorSel.options.length > 1) { emisorSel.selectedIndex = 0; receptorSel.selectedIndex = 5; }
}

function getAncestors(id) {
  const path = [];
  let current = nodesMap[id];
  while (current) {
    path.push(current.id);
    current = current.parentId !== null ? nodesMap[current.parentId] : null;
  }
  return path;
}

function calculatePath() {
  const startId = parseInt(document.getElementById('emisor-select').value);
  const endId = parseInt(document.getElementById('receptor-select').value);
  
  document.querySelectorAll('.map-card').forEach(c => {
    c.classList.remove('path-active', 'path-start', 'path-end');
    const num = c.querySelector('.path-number');
    if (num) num.remove();
  });
  
  const summaryDiv = document.getElementById('workflow-summary');
  if (startId === endId) {
    summaryDiv.style.display = 'block';
    summaryDiv.innerHTML = `<p class="font-bold text-red-600">Emisor y receptor son la misma área.</p>`;
    return;
  }
  
  const pathStart = getAncestors(startId);
  const pathEnd = getAncestors(endId);
  const setEnd = new Set(pathEnd);
  const lcaId = pathStart.find(id => setEnd.has(id));
  
  const route = [];
  for (let id of pathStart) { route.push(id); if (id === lcaId) break; }
  const downPath = [];
  for (let id of pathEnd) { if (id === lcaId) break; downPath.push(id); }
  downPath.reverse();
  route.push(...downPath);
  
  route.forEach((id, index) => {
    const el = document.querySelector(`.map-card[data-id="${id}"]`);
    if (el) {
      el.classList.add('path-active');
      if (id === startId) el.classList.add('path-start');
      if (id === endId) el.classList.add('path-end');
      const num = document.createElement('div');
      num.className = 'path-number'; num.textContent = index + 1;
      el.appendChild(num);
    }
  });
  
  const instances = route.length;
  const steps = instances - 1;
  let routeHtml = route.map((id, i) => {
    const node = nodesMap[id];
    let label = node.title;
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

// ===== TREE INTERACTIONS =====
function toggleNode(element, event) { 
  if (event && event.target && event.target.closest('.node-actions')) return; // No colapsar si se da clic en un botón de acción
  element.closest('.node-item').classList.toggle('collapsed'); 
}
function expandAll() { document.querySelectorAll('.node-item').forEach(i => i.classList.remove('collapsed')); }
function collapseAll() {
  const root = document.querySelector('.root-node');
  if (root) root.querySelectorAll('.node-item').forEach(i => { if(!i.classList.contains('root-node')) i.classList.add('collapsed'); });
}

// ===== DARK MODE =====
function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
  const isDarkMode = document.body.classList.contains('dark-mode');
  const icon = document.querySelector('#dark-mode-toggle i');
  const text = document.getElementById('dark-mode-text');
  
  if (isDarkMode) {
    if(icon) icon.classList.replace('fa-moon', 'fa-sun');
    if(text) text.textContent = 'Modo Claro';
    localStorage.setItem('theme', 'dark');
  } else {
    if(icon) icon.classList.replace('fa-sun', 'fa-moon');
    if(text) text.textContent = 'Modo Oscuro';
    localStorage.setItem('theme', 'light');
  }
}

if (localStorage.getItem('theme') === 'dark') {
  document.body.classList.add('dark-mode');
  document.addEventListener('DOMContentLoaded', () => {
    const icon = document.querySelector('#dark-mode-toggle i');
    const text = document.getElementById('dark-mode-text');
    if(icon) icon.classList.replace('fa-moon', 'fa-sun');
    if(text) text.textContent = 'Modo Claro';
  });
}

// ===== SERVICE WORKER REGISTRATION =====
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(err => console.log('Error SW:', err));
  });
}

// ===== EVENT LISTENERS: LOGIN Y AJUSTES =====
document.addEventListener('DOMContentLoaded', () => {
  const guestBtn = document.getElementById('btn-guest-login');
  const adminBtn = document.getElementById('btn-admin-login');
  const closeModal = document.getElementById('close-modal');
  const exportBtn = document.getElementById('btn-export-json');
  const importBtn = document.getElementById('btn-import-json');
  const resetBtn = document.getElementById('btn-reset-org');
  const importFile = document.getElementById('import-file-input');
  
  if(guestBtn) guestBtn.addEventListener('click', () => {
    isAdmin = false;
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('settings-btn').classList.add('hidden');
    loadOrgDataFromCloud();
  });

  if(adminBtn) adminBtn.addEventListener('click', () => {
    const pass = document.getElementById('admin-pass-input').value;
    if (pass === "psique33") { // Usamos la misma clave del proyecto anterior
      isAdmin = true;
      document.getElementById('auth-screen').classList.add('hidden');
      document.getElementById('settings-btn').classList.remove('hidden');
      loadOrgDataFromCloud();
    } else alert("Contraseña incorrecta. Intenta de nuevo.");
  });

  if(closeModal) closeModal.addEventListener('click', () => {
    document.getElementById('settings-modal').classList.add('hidden');
  });

  if(exportBtn) exportBtn.addEventListener('click', () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(orgData, null, 2));
    const link = document.createElement('a'); link.href = dataStr; link.download = "Juventud_Respaldo.json";
    link.click();
  });

  if(importBtn && importFile) {
    importBtn.addEventListener('click', () => importFile.click());
    importFile.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function(evt) {
        try {
          orgData = JSON.parse(evt.target.result);
          saveOrgData();
          document.getElementById('settings-modal').classList.add('hidden');
          alert("Organigrama restaurado con éxito.");
        } catch (err) { alert("Error: Archivo JSON no válido."); }
      };
      reader.readAsText(file);
    });
  }

  if(resetBtn) resetBtn.addEventListener('click', () => {
    if (confirm("⚠️ ¿Restaurar el organigrama a la versión de fábrica? Se perderán los datos en la nube de Cloudflare.")) {
      localStorage.removeItem('org_juventud_data');
      orgData = JSON.parse(JSON.stringify(DEFAULT_ORG_DATA));
      saveOrgData();
      document.getElementById('settings-modal').classList.add('hidden');
    }
  });

  // Arrancar vista inicial tras cargar el DOM (Aún sin login, en segundo plano)
  refreshUI();
});
