//API calls

// ae-plugin/js/api.js

class WebPanelAPI {
  constructor() {
    this.baseURL = 'http://localhost:3001/api';
    this.token = null;
    this.isConnected = false;
  }

  // Connection test
  async testConnection() {
  try {
    const response = await fetch('http://localhost:3001/'); // /api kaldırıldı
    const data = await response.json();
    this.isConnected = response.ok;
    return response.ok;
  } catch (error) {
    console.error('Connection test failed:', error);
    this.isConnected = false;
    return false;
  }
}

  // Get auth token (demo credentials)
  async authenticate() {
    try {
      const response = await fetch(`${this.baseURL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@test.com',
          password: 'password'
        })
      });

      const data = await response.json();
      if (response.ok) {
        this.token = data.token;
        return true;
      } else {
        throw new Error(data.error || 'Authentication failed');
      }
    } catch (error) {
      console.error('Authentication failed:', error);
      return false;
    }
  }

  // Get request with auth
  async get(endpoint) {
    if (!this.token) {
      const authenticated = await this.authenticate();
      if (!authenticated) throw new Error('Authentication required');
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired, retry once
        this.token = null;
        const reauth = await this.authenticate();
        if (reauth) return this.get(endpoint);
      }
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }

  // Post request with auth
  async post(endpoint, data = {}) {
    if (!this.token) {
      const authenticated = await this.authenticate();
      if (!authenticated) throw new Error('Authentication required');
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      if (response.status === 401) {
        this.token = null;
        const reauth = await this.authenticate();
        if (reauth) return this.post(endpoint, data);
      }
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }

  // Projects
  async getProjects() {
    try {
      const data = await this.get('/projects');
      return data.data || [];
    } catch (error) {
      console.error('Failed to get projects:', error);
      return [];
    }
  }

  async getProjectAssets(projectId) {
    try {
      const data = await this.get(`/assets/project/${projectId}`);
      return data || [];
    } catch (error) {
      console.error('Failed to get project assets:', error);
      return [];
    }
  }

  // Templates
  async getTemplates() {
    try {
      const data = await this.get('/templates');
      return data.data || [];
    } catch (error) {
      console.error('Failed to get templates:', error);
      return [];
    }
  }

  // LED Panels (for reference)
  async getLEDs() {
    try {
      const data = await this.get('/leds');
      return data || [];
    } catch (error) {
      console.error('Failed to get LEDs:', error);
      return [];
    }
  }

  // Render Queue (future implementation)
  async getRenderQueue() {
    try {
      const data = await this.get('/render-queue');
      return data.queue || [];
    } catch (error) {
      console.error('Failed to get render queue:', error);
      return [];
    }
  }

  async addToRenderQueue(composition, settings = {}) {
    try {
      const data = await this.post('/render-queue', {
        compositionName: composition.name,
        compositionId: composition.id,
        settings: settings,
        timestamp: new Date().toISOString()
      });
      return data;
    } catch (error) {
      console.error('Failed to add to render queue:', error);
      return null;
    }
  }

  // Log AE actions for debugging
  async logAction(action, details = {}) {
    try {
      await this.post('/ae/log', {
        action: action,
        details: details,
        timestamp: new Date().toISOString(),
        plugin_version: '1.0.0'
      });
    } catch (error) {
      // Silent fail for logging
      console.warn('Failed to log action:', error);
    }
  }
}

// Global API instance
window.api = new WebPanelAPI();

// Connection status checker
function updateConnectionStatus() {
  const statusElement = document.getElementById('connectionStatus');
  const apiStatusElement = document.getElementById('apiStatus');
  const statusDot = statusElement.querySelector('.status-dot');
  
  api.testConnection().then(connected => {
    if (connected) {
      statusDot.className = 'status-dot online';
      statusElement.querySelector('span:last-child').textContent = 'Connected';
      apiStatusElement.textContent = 'Connected';
      apiStatusElement.className = 'connected';
    } else {
      statusDot.className = 'status-dot offline';
      statusElement.querySelector('span:last-child').textContent = 'Disconnected';
      apiStatusElement.textContent = 'Disconnected';
      apiStatusElement.className = '';
    }
  });
}

// Auto-check connection every 10 seconds
setInterval(updateConnectionStatus, 10000);

// Initial connection check
setTimeout(updateConnectionStatus, 1000);