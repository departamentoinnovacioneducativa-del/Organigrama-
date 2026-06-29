let nodesMap = {};
let nodeIdCounter = 0;

// ===== DATA STRUCTURE (Actualizada) =====
const orgData = {
  title: "Dirección General",
  person: "P. José Daniel García M.U.",
  color: "green",
  children: [
    { title: "Asistente Dirección General", color: "navy" },
    {
      title: "Subdirección Académica",
      person: "Lic. Andrea Hernández Rojas",
      color: "navy",
      children: [
        { title: "Dirección de Preescolar", person: "Lic. Ericka Romero", color: "lightblue" },
        { title: "Dirección de Primaria", person: "Mtra. Laura Romero", color: "lightblue" },
        { title: "Dirección de Secundaria", person: "Mtra. Dulce Cano", color: "lightblue" },
        { title: "Dirección de Preparatoria", person: "Mtra. Rosana Mora", color: "lightblue" },
        { title: "Coordinación de Inglés", color: "lightblue" },
        { title: "Coordinación de Psicología", color: "lightblue" },
        { title: "Coordinación de Deportes", color: "lightblue" },
        { title: "Coordinación de Extraescolares", color: "lightblue" },
        { title: "Acad. Pastoral", color: "lightblue" }, 
        { title: "Coordinación de Francés", color: "lightblue" },
        { title: "Coordinación de Servicios Escolares", color: "lightblue" },
        { title: "Coordinación de Innovación Educativa", color: "lightblue" } 
      ]
    },
    {
      title: "Área Jurídica",
      person: "Lic. Iván Vázquez",
      color: "navy"
    },
    {
      title: "Comunicación y Marketing",
      person: "Lic. Ma. Teresa Romero",
      color: "navy",
      children: [
        { title: "Admisiones", color: "lightblue" },
        { title: "Marketing MFRs", color: "lightblue" },
        { title: "Redes Sociales", person: "Miss Jimena González, Prof. David Aguirre", color: "lightblue" }
      ]
    },
    {
      title: "Subdirección Administrativa",
      person: "C.P. Teresa de Jesús Feria Reyna",
      color: "navy",
      children: [
        {
          title: "Servicios Generales",
          person: "Juan Ruiz",
          color: "yellow",
          children: [
            { title: "Mantenimiento", color: "lightblue" },
            { title: "Limpieza", color: "lightblue" },
            { title: "Jardinería", color: "lightblue" }
          ]
        },
        {
          title: "Compras",
          person: "Lic. Ma. Elena Ibarra",
          color: "yellow"
        },
        { title: "Recursos Humanos", color: "lightblue" },
        {
          title: "Control Interno", // Ahora es nodo superior (amarillo)
          color: "yellow",
          children: [
            { title: "Relaciones Públicas", person: "Lic. Rosario Gonzaga", color: "lightblue" },
            { title: "Sistemas", person: "Ing. Alfredo Vázquez, Ing. Antonio Silva", color: "lightblue" },
            { title: "Cajas", person: "Miss Krishna Cuadros, Miss Margarita Hernández", color: "lightblue" }
          ]
        }
      ]
    }
  ]
};

// ===== ASSIGN IDS & BUILD MAP =====
function assignIds(node, parent = null) {
    node.id = nodeIdCounter++;
    node.parentId = parent ? parent.id : null;
    nodesMap[node.id] = node;
    if (node.children) node.children.forEach(c => assignIds(c, node));
}

// ===== RENDERING: TREE =====
function renderTree(node, isRoot = false) {
    const hasChildren = node.children && node.children.length > 0;
    const wrapperClass = isRoot ? 'node-item root-node' : 'node-item';
    let html = `<div class="${wrapperClass}">`;
    
    const click = hasChildren ? ' onclick="toggleNode(this)"' : '';
    html += `<div class="node-card node-${node.color} ${hasChildren ? 'has-children' : ''}"${click}>`;
    html += hasChildren ? `<div class="toggle-icon"><i class="fas fa-chevron-down"></i></div>` : `<div class="leaf-icon"><i class="fas fa-circle"></i></div>`;
    html += `<div class="node-content"><div class="node-title">${node.title}</div>`;
    if (node.person) html += `<div class="node-person">${node.person}</div>`;
    html += `</div></div>`; // Notas eliminadas completamente
    
    if (hasChildren) {
        html += `<div class="children-list"><div class="children-list-inner">`;
        node.children.forEach(c => html += renderTree(c));
        html += `</div></div>`;
    }
    return html + `</div>`;
}

// ===== RENDERING: MAPS =====
function renderMap(node, orientation = 'vertical') {
    const hasChildren = node.children && node.children.length > 0;
    let html = `<div class="map-node-wrapper">`;
    html += `<div class="map-card node-${node.color}" data-id="${node.id}">`;
    html += `<div class="map-card-title">${node.title}</div>`;
    if (node.person) html += `<div class="map-card-person">${node.person}</div>`;
    html += `</div>`;
    
    if (hasChildren) {
        html += `<div class="map-children-row">`;
        node.children.forEach(c => html += renderMap(c, orientation));
        html += `</div>`;
    }
    return html + `</div>`;
}

// ===== VIEW SWITCHER =====
function switchView(view, event) {
    document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
    event.currentTarget.classList.add('active');
    
    const container = document.getElementById('view-container');
    const controlsBar = document.getElementById('controls-bar');
    const wfControls = document.getElementById('workflow-controls');
    
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
    emisorSel.innerHTML = '';
    receptorSel.innerHTML = '';
    
    Object.values(nodesMap).forEach(node => {
        if (node.id === 0) return; 
        
        const opt1 = document.createElement('option');
        opt1.value = node.id;
        let text = node.title;
        if (node.person) {
            text += ` (${node.person.split(',')[0]})`;
        }
        opt1.textContent = text;
        emisorSel.appendChild(opt1);
        
        const opt2 = opt1.cloneNode(true);
        receptorSel.appendChild(opt2);
    });
    
    if(emisorSel.options.length > 1) {
        emisorSel.selectedIndex = 0;
        receptorSel.selectedIndex = 5;
    }
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
        summaryDiv.innerHTML = `<p class="font-bold text-red-600">El emisor y el receptor son la misma área.</p>`;
        return;
    }
    
    const pathStart = getAncestors(startId);
    const pathEnd = getAncestors(endId);
    const setEnd = new Set(pathEnd);
    const lcaId = pathStart.find(id => setEnd.has(id));
    
    const route = [];
    for (let id of pathStart) {
        route.push(id);
        if (id === lcaId) break;
    }
    const downPath = [];
    for (let id of pathEnd) {
        if (id === lcaId) break;
        downPath.push(id);
    }
    downPath.reverse();
    route.push(...downPath);
    
    route.forEach((id, index) => {
        const el = document.querySelector(`.map-card[data-id="${id}"]`);
        if (el) {
            el.classList.add('path-active');
            if (id === startId) el.classList.add('path-start');
            if (id === endId) el.classList.add('path-end');
            
            const num = document.createElement('div');
            num.className = 'path-number';
            num.textContent = index + 1;
            el.appendChild(num);
        }
    });
    
    const instances = route.length;
    const steps = instances - 1;
    let routeHtml = route.map((id, i) => {
        const node = nodesMap[id];
        let label = node.title;
        if (id === startId) label = `<strong style="color:#009944;">⬆ ${label} (Emisor)</strong>`;
        if (id === endId) label = `<strong style="color:#032A60;">⬇ ${label} (Receptor)</strong>`;
        return `<div class="path-step">${i+1}. ${label}</div>${i < route.length-1 ? '<i class="fas fa-arrow-right path-arrow"></i>' : ''}`;
    }).join('');
    
    summaryDiv.style.display = 'block';
    summaryDiv.innerHTML = `
        <h4 class="title-font font-bold uppercase text-base sm:text-lg mb-2">Ruta de Información Calculada</h4>
        <div class="flex flex-wrap gap-2 mb-4">
            <span class="path-step" style="background:#009944; color:white;">Instancias: ${instances}</span>
            <span class="path-step" style="background:#032A60; color:white;">Pasos: ${steps}</span>
        </div>
        <div class="flex flex-wrap items-center mt-2 border-t pt-4">
            ${routeHtml}
        </div>
    `;
}

// ===== TREE INTERACTIONS =====
function toggleNode(card) { card.closest('.node-item').classList.toggle('collapsed'); }
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
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
        if(text) text.textContent = 'Modo Claro';
        localStorage.setItem('theme', 'dark');
    } else {
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
        if(text) text.textContent = 'Modo Oscuro';
        localStorage.setItem('theme', 'light');
    }
}

// ===== INITIALIZATION =====
// Apply saved theme before rendering
if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-mode');
    // Update button icon if exists
    document.addEventListener('DOMContentLoaded', () => {
        const icon = document.querySelector('#dark-mode-toggle i');
        const text = document.getElementById('dark-mode-text');
        if(icon) { icon.classList.remove('fa-moon'); icon.classList.add('fa-sun'); }
        if(text) text.textContent = 'Modo Claro';
    });
}

assignIds(orgData);
document.getElementById('view-container').innerHTML = renderTree(orgData, true);
