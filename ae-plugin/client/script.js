class LEDPanelManager {
  constructor() {
    this.apiClient = new APIClient();
    this.projects = [];
    this.leds = [];
    this.selectedProject = null;
    this.selectedLEDs = [];
    
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadInitialData();
  }

  setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.switchTab(e.target.dataset.tab);
      });
    });

    // Auto-connect on load
    this.connectToAPI();
  }

  switchTab(tabName) {
    // Update buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');

    // Load tab-specific data
    this.loadTabData(tabName);
  }

  async loadTabData(tabName) {
    switch(tabName) {
      case 'projects':
        await this.loadProjects();
        break;
      case 'leds':
        await this.loadLEDs();
        break;
      case 'render':
        this.loadRenderQueue();
        break;
    }
  }

  async connectToAPI() {
    const apiUrl = document.getElementById('apiUrl').value;
    const connected = await this.apiClient.connect(apiUrl);
    
    const statusIndicator = document.querySelector('.status-indicator');
    const statusText = document.querySelector('.connection-status span:last-child');
    
    if (connected) {
      statusIndicator.classList.add('online');
      statusText.textContent = 'Connected';
      this.loadInitialData();
    } else {
      statusIndicator.classList.remove('online');
      statusText.textContent = 'Connection Failed';
    }
  }

  async loadInitialData() {
    await this.loadProjects();
    await this.loadLEDs();
  }

  async loadProjects() {
    try {
      const response = await this.apiClient.getProjects();
      this.projects = response.data || [];
      this.renderProjects();
      this.populateProjectSelect();
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  }

  renderProjects() {
    const projectsList = document.getElementById('projectsList');
    projectsList.innerHTML = '';

    this.projects.forEach(project => {
      const item = document.createElement('div');
      item.className = 'list-item';
      item.onclick = () => this.selectProject(project);
      
      item.innerHTML = `
        <h4>${project.projectName}</h4>
        <p>${project.projectType} • ${project.assetCount || 0} assets</p>
      `;
      
      projectsList.appendChild(item);
    });
  }

  populateProjectSelect() {
    const select = document.getElementById('projectSelect');
    select.innerHTML = '<option value="">Select Project...</option>';
    
    this.projects.forEach(project => {
      const option = document.createElement('option');
      option.value = project.projectID;
      option.textContent = project.projectName;
      select.appendChild(option);
    });
  }

  selectProject(project) {
    this.selectedProject = project;
    
    // Update UI selection
    document.querySelectorAll('.list-item').forEach(item => {
      item.classList.remove('selected');
    });
    event.target.classList.add('selected');
  }

  async loadLEDs() {
    try {
      const response = await this.apiClient.getLEDs();
      this.leds = response.data || [];
      this.renderLEDs(this.leds);
      this.populateFilters();
    } catch (error) {
      console.error('Failed to load LEDs:', error);
    }
  }

  renderLEDs(ledsToRender = this.leds) {
    const ledsList = document.getElementById('ledsList');
    ledsList.innerHTML = '';

    ledsToRender.slice(0, 50).forEach(led => { // Limit for performance
      const item = document.createElement('div');
      item.className = 'list-item';
      item.onclick = () => this.toggleLEDSelection(led);
      
      item.innerHTML = `
        <h4>${led.ledKodu}</h4>
        <p>${led.enPx}x${led.boyPx} • ${led.tip || 'No type'} • ${led.sehir || 'No city'}</p>
      `;
      
      ledsList.appendChild(item);
    });
  }

  populateFilters() {
    // City filter
    const cities = [...new Set(this.leds.map(led => led.sehir).filter(Boolean))];
    const cityFilter = document.getElementById('cityFilter');
    cities.forEach(city => {
      const option = document.createElement('option');
      option.value = city;
      option.textContent = city;
      cityFilter.appendChild(option);
    });

    // Type filter
    const types = [...new Set(this.leds.map(led => led.tip).filter(Boolean))];
    const typeFilter = document.getElementById('typeFilter');
    types.forEach(type => {
      const option = document.createElement('option');
      option.value = type;
      option.textContent = type;
      typeFilter.appendChild(option);
    });
  }

  toggleLEDSelection(led) {
    const index = this.selectedLEDs.findIndex(l => l.ledID === led.ledID);
    if (index === -1) {
      this.selectedLEDs.push(led);
    } else {
      this.selectedLEDs.splice(index, 1);
    }
    
    // Update UI
    event.target.classList.toggle('selected');
  }

  searchLEDs() {
    const query = document.getElementById('ledSearch').value.toLowerCase();
    const filtered = this.leds.filter(led => 
      led.ledKodu.toLowerCase().includes(query) ||
      (led.tip && led.tip.toLowerCase().includes(query)) ||
      (led.sehir && led.sehir.toLowerCase().includes(query))
    );
    this.renderLEDs(filtered);
  }

  applyLEDFilters() {
    const cityFilter = document.getElementById('cityFilter').value;
    const typeFilter = document.getElementById('typeFilter').value;
    
    let filtered = this.leds;
    
    if (cityFilter) {
      filtered = filtered.filter(led => led.sehir === cityFilter);
    }
    
    if (typeFilter) {
      filtered = filtered.filter(led => led.tip === typeFilter);
    }
    
    this.renderLEDs(filtered);
  }

  loadRenderQueue() {
    // Simulated render queue
    const renderQueue = document.getElementById('renderQueue');
    renderQueue.innerHTML = `
      <div class="render-item">
        <strong>Comp_001_1920x1080</strong><br>
        Status: Queued • Duration: 10s
      </div>
      <div class="render-item">
        <strong>Comp_002_1080x1920</strong><br>
        Status: Rendering... • Progress: 45%
      </div>
    `;
  }
}

// After Effects Integration Functions
function createSquareMaster() {
  const projectId = document.getElementById('projectSelect').value;
  if (!projectId) {
    alert('Please select a project first');
    return;
  }
  
  // Call After Effects script
  window.cep.evalScript('createSquareMaster(' + projectId + ')', (result) => {
    if (result) {
      alert('Square master composition created successfully!');
    } else {
      alert('Failed to create composition');
    }
  });
}

function addSolid() {
  window.cep.evalScript('addSolidLayer()', (result) => {
    console.log('Add solid result:', result);
  });
}

function addShoe() {
  // Get selected project assets and add shoe asset
  window.cep.evalScript('addShoeAsset()', (result) => {
    console.log('Add shoe result:', result);
  });
}

function add2DLogo() {
  window.cep.evalScript('add2DLogoAsset()', (result) => {
    console.log('Add 2D logo result:', result);
  });
}

function add3DLogo() {
  window.cep.evalScript('add3DLogoAsset()', (result) => {
    console.log('Add 3D logo result:', result);
  });
}

function add3DShoe() {
  window.cep.evalScript('add3DShoeAsset()', (result) => {
    console.log('Add 3D shoe result:', result);
  });
}

function addTextMachine() {
  window.cep.evalScript('addTextMachine()', (result) => {
    console.log('Add text machine result:', result);
  });
}

function addColorReference() {
  window.cep.evalScript('addColorReference()', (result) => {
    console.log('Add color reference result:', result);
  });
}

function scaleChecker() {
  window.cep.evalScript('addScaleChecker()', (result) => {
    console.log('Scale checker result:', result);
  });
}

function addMotionTile() {
  window.cep.evalScript('addMotionTile()', (result) => {
    console.log('Motion tile result:', result);
  });
}

function duplicateRotate() {
  window.cep.evalScript('duplicateRotate()', (result) => {
    console.log('Duplicate rotate result:', result);
  });
}

function applyShoeInOut() {
  window.cep.evalScript('applyTemplate("shoe_in_out")', (result) => {
    console.log('Shoe in/out template result:', result);
  });
}

function applyTransition() {
  window.cep.evalScript('applyTemplate("transition")', (result) => {
    console.log('Transition template result:', result);
  });
}

function applyLogoIntro() {
  window.cep.evalScript('applyTemplate("logo_intro")', (result) => {
    console.log('Logo intro template result:', result);
  });
}

function applyLogoOutro() {
  window.cep.evalScript('applyTemplate("logo_outro")', (result) => {
    console.log('Logo outro template result:', result);
  });
}

function createRenderQueue() {
  window.cep.evalScript('createRenderQueue()', (result) => {
    console.log('Render queue result:', result);
  });
}

function removeDuplicates() {
  window.cep.evalScript('removeDuplicateComps()', (result) => {
    console.log('Remove duplicates result:', result);
  });
}

function selectSpecialScreens() {
  window.cep.evalScript('selectSpecialScreens()', (result) => {
    console.log('Select special screens result:', result);
  });
}

function selectByProperty() {
  window.cep.evalScript('selectByProperty()', (result) => {
    console.log('Select by property result:', result);
  });
}

// Initialize the application
let panelManager;
document.addEventListener('DOMContentLoaded', () => {
  panelManager = new LEDPanelManager();
});

// CEP Event Handlers
if (typeof window.cep !== 'undefined') {
  // Panel loaded
  window.cep.addEventListener('com.adobe.csxs.events.ApplicationBeforeQuit', () => {
    console.log('After Effects is closing');
  });
}