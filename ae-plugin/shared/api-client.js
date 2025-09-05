class APIClient {
  constructor() {
    this.baseURL = 'http://localhost:3001/api';
    this.token = null;
    this.isConnected = false;
  }

  async connect(baseURL) {
    this.baseURL = baseURL;
    try {
      // Test connection
      const response = await this.makeRequest('GET', '/', null, false);
      this.isConnected = true;
      console.log('API Connected:', response.message);
      return true;
    } catch (error) {
      this.isConnected = false;
      console.error('API Connection failed:', error);
      return false;
    }
  }

  async authenticate(email, password) {
    try {
      const response = await this.makeRequest('POST', '/auth/login', {
        email: email,
        password: password
      }, false);
      
      if (response.token) {
        this.token = response.token;
        return { success: true, user: response.user };
      }
      return { success: false, error: 'No token received' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async makeRequest(method, endpoint, data = null, requireAuth = true) {
    const url = this.baseURL + endpoint;
    const headers = {
      'Content-Type': 'application/json'
    };

    if (requireAuth && this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const config = {
      method: method,
      headers: headers
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      config.body = JSON.stringify(data);
    }

    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  // Project Methods
  async getProjects() {
    return await this.makeRequest('GET', '/projects');
  }

  async createProject(projectData) {
    return await this.makeRequest('POST', '/projects', projectData);
  }

  async getProjectAssets(projectId) {
    return await this.makeRequest('GET', `/projects/${projectId}/assets`);
  }

  // LED Methods
  async getLEDs() {
    return await this.makeRequest('GET', '/leds');
  }

  async createLED(ledData) {
    return await this.makeRequest('POST', '/leds', ledData);
  }

  // Scraper Methods
  async scrapeURL(url, selectors) {
    return await this.makeRequest('POST', '/scraper/scrape', { url, selectors });
  }

  async getScraperPresets() {
    return await this.makeRequest('GET', '/scraper/presets');
  }

  // Template Methods
  async getTemplates() {
    return await this.makeRequest('GET', '/templates');
  }

  // Export Methods
  async exportLEDs(filters) {
    return await this.makeRequest('POST', '/reports/export-csv', filters);
  }

  // After Effects Integration Methods
  async createComposition(ledData) {
    // This will be implemented in After Effects script
    return { success: true, message: 'Composition created', ledData };
  }

  async addAssetToComp(assetType, assetData) {
    // This will be implemented in After Effects script
    return { success: true, message: 'Asset added', assetType, assetData };
  }
}

// Make it globally available for CEP
if (typeof window !== 'undefined') {
  window.APIClient = APIClient;
}
// ExtendScript for After Effects Integration

// Create square master composition
