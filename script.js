let nodesMap = {};
let orgData = {};
let nodeIdCounter = 0;

// ===== MARKDOWN PARSER =====
async function loadMarkdownData() {
    try {
        const response = await fetch('data.md');
        if (!response.ok) throw new Error('No se pudo cargar data.md');
        const text = await response.text();
        
        const lines = text.split('\n').filter(l => l.trim().startsWith('-'));
        const root = { children: [] };
        const stack = [{ node: root, level: -1 }];

        lines.forEach(line => {
            const match = line.match(/^(\s*)- \[(green|navy|yellow|lightblue)\] (.+)/);
            if (!match) return;
            
            const indent = match[1].length;
            const level = Math.floor(indent / 2);
            const color = match[2];
            const rest = match[3].split('|').map(s => s.trim());
            
            const title = rest[0] || 'Sin título';
            const person = rest[1] || '';
            const note = rest[2] || '';
            const status = rest[3] || '';

            const node = { title, person, note, status, color, children: [] };

            while (stack.length > 1 && level <= stack[stack.length - 1].level) {
                stack.pop();
            }
            stack[stack.length - 1].node.children.push(node);
            stack.push({ node, level });
        });
        
        return root.children[0]; // Asumimos que el primer elemento es la raíz
    } catch (error) {
        console.error(error);
        document.getElementById('loading-screen').innerHTML = `<p class="text-red-600 font-bold">Error al cargar data.md.</p><p class="text-gray-600 text-sm mt-2">Asegúrate de subir el archivo data.md al mismo nivel que index.html en GitHub.</p>`;
        return null;
    }
}

// ===== INIT =====
async function init() {
    orgData = await loadMarkdownData();
    if (!orgData) return;

    document.getElementById('loading-screen').style.display = 'none';
    document.getElementById('app-content').style.display = 'block';
    
    assignIds(orgData);
    document.getElementById('view-container').innerHTML = renderTree(orgData, true);
}

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
    html += `<div class="node-content"><div class="node-title ${node.status === 'NO' ? 'strikethrough' : ''}">${node.title}</div>`;
    if (node.person) html += `<div class="node-person">${node.person}</div>`;
    if (node.note) html += `<div class="node-badge"><i class="fas fa-pen"></i> ${node.note}</div>`;
    if (node.status === 'NO') html += `<div class="node-no"><i class="fas fa-times-circle"></i> NO</div>`;
    html += `</div></div>`;
    
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
    html += `<div class="map-card-title ${node.status === 'NO' ? 'strikethrough' : ''}">${node.title}</div>`;
    if (node.person) html += `<div class="map-card-person">${node.person}</div>`;
    if (node.status === 'NO') html += `<div style="font-size:9px; font-weight:800; color:#dc2626; margin-top:4px;">NO</div>`;
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
        if (node.title === "Dirección General") return;
        const opt1 = document.createElement('option');
        opt1.value = node.id;
        opt1.textContent = node.title + (node.person ? ` (${node.person.split(',')[0]})` : '');
        emisorSel.appendChild(opt1);
        
        const opt2 = opt1.cloneNode(true);
        receptorSel.appendChild(opt2);
    });
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
    
    if (startId === endId) {
        document.getElementById('workflow-summary').style.display = 'block';
        document.getElementById('workflow-summary').innerHTML = `<p class="font-bold text-red-600">El emisor y el receptor son la misma área.</p>`;
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
    
    document.getElementById('workflow-summary').style.display = 'block';
    document.getElementById('workflow-summary').innerHTML = `
        <h4 class="title-font font-bold text-[#032A60] uppercase text-lg mb-2">Ruta de Información Calculada</h4>
        <div class="flex flex-wrap gap-2 mb-4">
            <span class="path-step" style="background:#009944; color:white;">Instancias: ${instances}</span>
            <span class="path-step" style="background:#032A60; color:white;">Pasos (Conexiones): ${steps}</span>
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

// Iniciar la aplicación
init();
