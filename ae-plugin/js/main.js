//UI LOGİC 

// ae-plugin/js/main.js

class PluginManager {
  constructor() {
    this.currentProject = null;
    this.currentAssets = [];
    this.selectedTemplate = null;
    this.isAfterEffectsAvailable = false;
    
    // Initialize when DOM loads
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
  }

  async init() {
    this.setupEventListeners();
    this.setupTabs();
    await this.loadInitialData();
    this.checkAfterEffectsAvailability();
  }

  // Check if After Effects is available
  checkAfterEffectsAvailability() {
    if (typeof CSInterface !== 'undefined') {
      this.isAfterEffectsAvailable = true;
      console.log('After Effects integration available');
    } else {
      this.isAfterEffectsAvailable = false;
      console.log('Running in browser mode - After Effects functions disabled');
    }
  }

  // Setup tab navigation
  setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        // Remove active class from all tabs
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));

        // Add active class to clicked tab
        button.classList.add('active');
        const targetTab = document.getElementById(button.dataset.tab);
        if (targetTab) {
          targetTab.classList.add('active');
        }
      });
    });
  }

  // Setup event listeners
  setupEventListeners() {
    // Project selection
    document.getElementById('projectSelect').addEventListener('change', (e) => {
      this.onProjectSelect(e.target.value);
    });

    // Master composition creation
    document.getElementById('createSquareMaster').addEventListener('click', () => {
      this.createSquareMaster();
    });

    document.getElementById('createCustomMaster').addEventListener('click', () => {
      this.createCustomMaster();
    });

    // Asset addition buttons
    document.getElementById('addShoe').addEventListener('click', () => {
      this.addAssetToComposition('3D_shoe');
    });

    document.getElementById('add2DLogo').addEventListener('click', () => {
      this.addAssetToComposition('2D_logo');
    });

    document.getElementById('add3DLogo').addEventListener('click', () => {
      this.addAssetToComposition('3D_logo');
    });

    document.getElementById('addSolid').addEventListener('click', () => {
      this.addSolidColor();
    });

    document.getElementById('addTextMachine').addEventListener('click', () => {
      this.addTextMachine();
    });

    // Template application
    document.getElementById('applyTemplate').addEventListener('click', () => {
      this.applySelectedTemplate();
    });

    // Tools
    document.getElementById('scaleChecker').addEventListener('click', () => {
      this.addScaleChecker();
    });

    document.getElementById('motionTile').addEventListener('click', () => {
      this.addMotionTile();
    });

    document.getElementById('duplicateRotate').addEventListener('click', () => {
      this.duplicateRotate();
    });

    // Utilities
    document.getElementById('colorReference').addEventListener('click', () => {
      this.addColorReference();
    });

    document.getElementById('linesMachine').addEventListener('click', () => {
      this.linesMachine();
    });

    document.getElementById('removeDuplicates').addEventListener('click', () => {
      this.removeDuplicates();
    });

    // Selection tools
    document.getElementById('selectScreens').addEventListener('click', () => {
      this.selectSpecialScreens();
    });

    document.getElementById('selectByProperty').addEventListener('click', () => {
      this.selectByProperty();
    });

    // Render queue
    document.getElementById('createRenderQueue').addEventListener('click', () => {
      this.createRenderQueue();
    });
  }

  // Load initial data from API
  async loadInitialData() {
    await this.loadProjects();
    await this.loadTemplates();
  }

  // Load projects from API
  async loadProjects() {
    try {
      this.showLoading(true);
      const projects = await window.api.getProjects();
      const projectSelect = document.getElementById('projectSelect');
      
      projectSelect.innerHTML = '<option value="">Select a project...</option>';
      
      projects.forEach(project => {
        const option = document.createElement('option');
        option.value = project.projectID;
        option.textContent = `${project.projectName} (${project.projectType})`;
        projectSelect.appendChild(option);
      });

      console.log(`Loaded ${projects.length} projects`);
    } catch (error) {
      console.error('Failed to load projects:', error);
      this.showError('Failed to load projects from API');
    } finally {
      this.showLoading(false);
    }
  }

  // Handle project selection
  async onProjectSelect(projectId) {
    if (!projectId) {
      this.currentProject = null;
      this.currentAssets = [];
      this.hideProjectInfo();
      this.disableProjectButtons();
      return;
    }

    try {
      this.showLoading(true);
      
      // Load project assets
      const assets = await window.api.getProjectAssets(projectId);
      this.currentProject = projectId;
      this.currentAssets = assets;
      
      this.displayProjectInfo(assets);
      this.enableProjectButtons();
      
      console.log(`Selected project ${projectId} with ${assets.length} assets`);
    } catch (error) {
      console.error('Failed to load project assets:', error);
      this.showError('Failed to load project assets');
    } finally {
      this.showLoading(false);
    }
  }

  // Display project assets
  displayProjectInfo(assets) {
    const projectInfo = document.getElementById('projectInfo');
    const assetList = document.getElementById('assetList');
    
    assetList.innerHTML = '';
    
    if (assets.length === 0) {
      assetList.innerHTML = '<p style="color: #999; font-size: 11px;">No assets found</p>';
    } else {
      assets.forEach(asset => {
        const assetDiv = document.createElement('div');
        assetDiv.className = 'asset-item';
        
        assetDiv.innerHTML = `
          <span class="asset-type">${asset.assetType.replace('_', ' ')}</span>
          <span class="asset-name">${asset.assetName}</span>
        `;
        
        assetList.appendChild(assetDiv);
      });
    }
    
    projectInfo.classList.remove('hidden');
  }

  // Hide project info
  hideProjectInfo() {
    const projectInfo = document.getElementById('projectInfo');
    projectInfo.classList.add('hidden');
  }

  // Enable/disable project buttons
  enableProjectButtons() {
    const buttons = [
      'createSquareMaster', 'createCustomMaster',
      'addShoe', 'add2DLogo', 'add3DLogo', 'addSolid', 'addTextMachine'
    ];
    
    buttons.forEach(id => {
      const button = document.getElementById(id);
      if (button) button.disabled = false;
    });
  }

  disableProjectButtons() {
    const buttons = [
      'createSquareMaster', 'createCustomMaster',
      'addShoe', 'add2DLogo', 'add3DLogo', 'addSolid', 'addTextMachine'
    ];
    
    buttons.forEach(id => {
      const button = document.getElementById(id);
      if (button) button.disabled = true;
    });
  }

  // Load templates from API
  async loadTemplates() {
    try {
      const templates = await window.api.getTemplates();
      const templateList = document.getElementById('templateList');
      
      templateList.innerHTML = '';
      
      if (templates.length === 0) {
        templateList.innerHTML = '<p style="color: #999;">No templates available</p>';
        return;
      }

      templates.forEach(template => {
        const templateDiv = document.createElement('div');
        templateDiv.className = 'template-item';
        templateDiv.dataset.templateId = template.templateID;
        
        templateDiv.innerHTML = `
          <div class="template-info">
            <div class="template-name">${template.templateName}</div>
            <div class="template-type">${template.templateType.replace('_', ' ')}</div>
          </div>
          <div class="template-duration">${template.duration}s</div>
        `;
        
        templateDiv.addEventListener('click', () => {
          this.selectTemplate(template, templateDiv);
        });
        
        templateList.appendChild(templateDiv);
      });

      console.log(`Loaded ${templates.length} templates`);
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  }

  // Select template
  selectTemplate(template, element) {
    // Remove selection from all templates
    document.querySelectorAll('.template-item').forEach(item => {
      item.classList.remove('selected');
    });
    
    // Select current template
    element.classList.add('selected');
    this.selectedTemplate = template;
    
    // Enable apply button
    document.getElementById('applyTemplate').disabled = false;
    
    console.log('Selected template:', template.templateName);
  }

  // After Effects Functions (will only work when AE is available)
  createSquareMaster() {
    if (!this.isAfterEffectsAvailable) {
      this.showError('After Effects not available - running in browser mode');
      return;
    }

    if (!this.currentProject) {
      this.showError('Please select a project first');
      return;
    }

    this.showLoading(true);
    
    const script = `
      createSquareMaster("${this.currentProject}", ${JSON.stringify(this.currentAssets)});
    `;
    
    // Execute After Effects script
    if (typeof CSInterface !== 'undefined') {
      new CSInterface().evalScript(script, (result) => {
        this.showLoading(false);
        if (result === 'success') {
          this.showSuccess('Square master composition created!');
        } else {
          this.showError('Failed to create composition: ' + result);
        }
      });
    }
  }

  createCustomMaster() {
    if (!this.isAfterEffectsAvailable) {
      this.showError('After Effects not available');
      return;
    }

    // This would open a dialog for custom size input
    const width = prompt('Enter width (px):', '1920');
    const height = prompt('Enter height (px):', '1080');
    
    if (width && height) {
      this.showLoading(true);
      
      const script = `
        createCustomMaster("${this.currentProject}", ${width}, ${height}, ${JSON.stringify(this.currentAssets)});
      `;
      
      if (typeof CSInterface !== 'undefined') {
        new CSInterface().evalScript(script, (result) => {
          this.showLoading(false);
          if (result === 'success') {
            this.showSuccess(`Custom composition created (${width}x${height})!`);
          } else {
            this.showError('Failed to create composition: ' + result);
          }
        });
      }
    }
  }

  addAssetToComposition(assetType) {
    if (!this.isAfterEffectsAvailable) {
      this.showError('After Effects not available');
      return;
    }

    const asset = this.currentAssets.find(a => a.assetType === assetType);
    if (!asset) {
      this.showError(`No ${assetType.replace('_', ' ')} found in current project`);
      return;
    }

    this.showLoading(true);
    
    const script = `
      addAssetToComp("${asset.filePath}", "${asset.assetType}", "${asset.assetName}");
    `;
    
    if (typeof CSInterface !== 'undefined') {
      new CSInterface().evalScript(script, (result) => {
        this.showLoading(false);
        if (result === 'success') {
          this.showSuccess(`${asset.assetName} added to composition!`);
        } else {
          this.showError('Failed to add asset: ' + result);
        }
      });
    }
  }

  addSolidColor() {
    if (!this.isAfterEffectsAvailable) {
      this.showError('After Effects not available');
      return;
    }

    const script = 'addSolidColor();';
    
    if (typeof CSInterface !== 'undefined') {
      new CSInterface().evalScript(script, (result) => {
        if (result === 'success') {
          this.showSuccess('Solid color layer added!');
        } else {
          this.showError('Failed to add solid: ' + result);
        }
      });
    }
  }

  addTextMachine() {
    if (!this.isAfterEffectsAvailable) {
      this.showError('After Effects not available');
      return;
    }

    const script = 'addTextMachine();';
    
    if (typeof CSInterface !== 'undefined') {
      new CSInterface().evalScript(script, (result) => {
        if (result === 'success') {
          this.showSuccess('Text machine added!');
        } else {
          this.showError('Failed to add text machine: ' + result);
        }
      });
    }
  }

  applySelectedTemplate() {
    if (!this.selectedTemplate) {
      this.showError('Please select a template first');
      return;
    }

    if (!this.isAfterEffectsAvailable) {
      this.showError('After Effects not available');
      return;
    }

    this.showLoading(true);
    
    const script = `
      applyTemplate("${this.selectedTemplate.templateType}", ${this.selectedTemplate.duration});
    `;
    
    if (typeof CSInterface !== 'undefined') {
      new CSInterface().evalScript(script, (result) => {
        this.showLoading(false);
        if (result === 'success') {
          this.showSuccess(`Template "${this.selectedTemplate.templateName}" applied!`);
        } else {
          this.showError('Failed to apply template: ' + result);
        }
      });
    }
  }

  // Tool functions
  addScaleChecker() {
    if (!this.isAfterEffectsAvailable) {
      this.showError('After Effects not available');
      return;
    }

    const script = 'addScaleChecker();';
    if (typeof CSInterface !== 'undefined') {
      new CSInterface().evalScript(script);
    }
  }

  addMotionTile() {
    if (!this.isAfterEffectsAvailable) {
      this.showError('After Effects not available');
      return;
    }

    const script = 'addMotionTile();';
    if (typeof CSInterface !== 'undefined') {
      new CSInterface().evalScript(script);
    }
  }

  duplicateRotate() {
    if (!this.isAfterEffectsAvailable) {
      this.showError('After Effects not available');
      return;
    }

    const script = 'duplicateRotate();';
    if (typeof CSInterface !== 'undefined') {
      new CSInterface().evalScript(script);
    }
  }

  addColorReference() {
    if (!this.isAfterEffectsAvailable) {
      this.showError('After Effects not available');
      return;
    }

    const script = 'addColorReference();';
    if (typeof CSInterface !== 'undefined') {
      new CSInterface().evalScript(script);
    }
  }

  linesMachine() {
    if (!this.isAfterEffectsAvailable) {
      this.showError('After Effects not available');
      return;
    }

    const script = 'linesMachine();';
    if (typeof CSInterface !== 'undefined') {
      new CSInterface().evalScript(script);
    }
  }

  removeDuplicates() {
    if (!this.isAfterEffectsAvailable) {
      this.showError('After Effects not available');
      return;
    }

    const script = 'removeDuplicates();';
    if (typeof CSInterface !== 'undefined') {
      new CSInterface().evalScript(script);
    }
  }

  selectSpecialScreens() {
    if (!this.isAfterEffectsAvailable) {
      this.showError('After Effects not available');
      return;
    }

    const script = 'selectSpecialScreens();';
    if (typeof CSInterface !== 'undefined') {
      new CSInterface().evalScript(script);
    }
  }

  selectByProperty() {
    if (!this.isAfterEffectsAvailable) {
      this.showError('After Effects not available');
      return;
    }

    const script = 'selectByProperty();';
    if (typeof CSInterface !== 'undefined') {
      new CSInterface().evalScript(script);
    }
  }

  createRenderQueue() {
    if (!this.isAfterEffectsAvailable) {
      this.showError('After Effects not available');
      return;
    }

    const script = 'createRenderQueue();';
    if (typeof CSInterface !== 'undefined') {
      new CSInterface().evalScript(script, (result) => {
        if (result === 'success') {
          this.showSuccess('Render queue created!');
        } else {
          this.showError('Failed to create render queue: ' + result);
        }
      });
    }
  }

  // UI Helper functions
  showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (show) {
      overlay.classList.remove('hidden');
    } else {
      overlay.classList.add('hidden');
    }
  }

  showSuccess(message) {
    console.log('SUCCESS:', message);
    // Could add a toast notification here
    alert('Success: ' + message);
  }

  showError(message) {
    console.error('ERROR:', message);
    // Could add a toast notification here
    alert('Error: ' + message);
  }
}

// ae-plugin/js/main.js içine eklenecek güncellemeler

class PluginManager {
  constructor() {
    // ... mevcut constructor kodları
    this.advancedFilter = null;
  }

  async init() {
    this.setupEventListeners();
    this.setupTabs();
    await this.loadInitialData();
    this.checkAfterEffectsAvailability();
    
    // Advanced filter initialize et
    this.initializeAdvancedFilter();
  }

  // Advanced filter initialization
  initializeAdvancedFilter() {
    // Advanced filter script'ini import et
    const script = document.createElement('script');
    script.src = 'js/advanced-filters.js';
    document.head.appendChild(script);
    
    script.onload = () => {
      this.advancedFilter = new AdvancedLEDFilter(window.api);
      this.advancedFilter.initializeFilterUI();
      
      // Tools tab'ine advanced filter button ekle
      this.addAdvancedFilterButton();
    };
  }

  addAdvancedFilterButton() {
    const toolsContent = document.getElementById('tools');
    const advancedFilterSection = `
      <div class="section">
        <h3>Gelişmiş LED Filtreleme</h3>
        <div class="button-group vertical">
          <button id="toggleAdvancedFilter" class="btn-primary">Gelişmiş Filtreleri Aç</button>
          <button id="quickFilter1920x1080" class="btn-tool">Hızlı: 1920x1080</button>
          <button id="quickFilter1080x1920" class="btn-tool">Hızlı: 1080x1920</button>
          <button id="quickFilterSquare" class="btn-tool">Hızlı: Kare Formatlar</button>
        </div>
      </div>
    `;
    
    // Animation Tools section'dan önce ekle
    const animationSection = toolsContent.querySelector('.section');
    animationSection.insertAdjacentHTML('beforebegin', advancedFilterSection);
    
    // Event listeners
    document.getElementById('toggleAdvancedFilter').addEventListener('click', () => {
      this.advancedFilter.toggleAdvancedFilters();
      
      // Button text'ini güncelle
      const button = document.getElementById('toggleAdvancedFilter');
      const isHidden = document.getElementById('advancedFilters').classList.contains('hidden');
      button.textContent = isHidden ? 'Gelişmiş Filtreleri Aç' : 'Gelişmiş Filtreleri Kapat';
    });

    // Quick filter buttons
    document.getElementById('quickFilter1920x1080').addEventListener('click', () => {
      this.applyQuickFilter(1920, 1080);
    });

    document.getElementById('quickFilter1080x1920').addEventListener('click', () => {
      this.applyQuickFilter(1080, 1920);
    });

    document.getElementById('quickFilterSquare').addEventListener('click', () => {
      this.applyQuickFilter('square');
    });
  }

  async applyQuickFilter(width, height) {
    try {
      this.showLoading(true);
      
      const leds = await window.api.getLEDs();
      let filteredLEDs;
      
      if (width === 'square') {
        // Kare formatlar (aspect ratio 0.8 - 1.2 arası)
        filteredLEDs = leds.filter(led => {
          const aspect = led.enPx / led.boyPx;
          return aspect >= 0.8 && aspect <= 1.2;
        });
      } else {
        // Specific dimension
        filteredLEDs = leds.filter(led => 
          led.enPx === width && led.boyPx === height
        );
      }
      
      this.showFilterResults(filteredLEDs, width, height);
      
    } catch (error) {
      this.showError('Hızlı filtreleme başarısız: ' + error.message);
    } finally {
      this.showLoading(false);
    }
  }

  showFilterResults(filteredLEDs, width, height) {
    const filterType = width === 'square' ? 'Kare formatlar' : `${width}x${height}`;
    
    if (filteredLEDs.length === 0) {
      this.showError(`${filterType} için LED bulunamadı`);
      return;
    }

    let message = `${filterType} için ${filteredLEDs.length} LED bulundu:\n\n`;
    filteredLEDs.slice(0, 5).forEach(led => {
      message += `• ${led.ledKodu} - ${led.enPx}x${led.boyPx}px\n`;
    });
    
    if (filteredLEDs.length > 5) {
      message += `... ve ${filteredLEDs.length - 5} tane daha\n`;
    }

    message += '\nBu LED\'leri After Effects\'e eklemek ister misiniz?';
    
    if (confirm(message)) {
      this.addFilteredLEDsToAE(filteredLEDs);
    }
  }

  async addFilteredLEDsToAE(filteredLEDs) {
    if (!this.isAfterEffectsAvailable) {
      this.showError('After Effects bağlantısı bulunamadı');
      return;
    }

    try {
      this.showLoading(true);
      
      const script = `
        createCompositionFromFilteredLEDs(${JSON.stringify(filteredLEDs)});
      `;
      
      if (typeof CSInterface !== 'undefined') {
        new CSInterface().evalScript(script, (result) => {
          this.showLoading(false);
          
          if (result === 'success') {
            this.showSuccess(`${filteredLEDs.length} LED After Effects'e eklendi`);
          } else {
            this.showError('After Effects ekleme başarısız: ' + result);
          }
        });
      }
    } catch (error) {
      this.showLoading(false);
      this.showError('After Effects entegrasyonu başarısız');
    }
  }

  // ... mevcut diğer metodlar
}



// Initialize plugin when DOM is ready
const pluginManager = new PluginManager();