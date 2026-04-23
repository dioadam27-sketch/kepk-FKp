/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User, Protocol, UserRole } from './types';
import { security } from './utils/security';

// Note: In this environment, PHP often won't run locally, so GAS becomes the primary working API.
// However, we implement fallback logic so the app can switch to GAS if PHP is down.
// Use Multiple Backends for reliability
const PHP_API_URL = 'https://pkkii.pendidikan.unair.ac.id/fkp/api.php';
const GAS_API_URL = 'https://script.google.com/macros/s/AKfycbz-wjq2G3uI2rUqdjSYHHpTI92HOSl2oKkrJTEX6TQCKPj1pfcZEJwF0nxWKEniDoEQig/exec';
const API_KEY = 'UNAIR_FKP_2024_PREMIUM';
const PHP_TIMEOUT = 1500; // 1.5 seconds timeout for primary PHP

function getAuthToken(): string {
  try {
    const data = localStorage.getItem('sim_kepk_user');
    if (!data || data.trim().startsWith('{')) return '';
    const dec = security.decrypt(data);
    return (dec && typeof dec === 'object' && dec.token) ? dec.token : '';
  } catch {
    return '';
  }
}

async function fetchWithTimeout(resource: string, options: RequestInit & { timeout?: number } = {}) {
  const { timeout = PHP_TIMEOUT } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(resource, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

async function fetchWithFallback(url: string, options: RequestInit = {}): Promise<Response> {
  // Try PHP First with Timeout
  try {
    const token = getAuthToken();
    const headers: any = {
      ...options.headers,
      'X-API-KEY': API_KEY,
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const phpUrl = url.startsWith('http') ? url : `${PHP_API_URL}${url.includes('?') ? url : '?' + url}`;
    const phpOptions = {
      ...options,
      headers
    };
    const response = await fetchWithTimeout(phpUrl, phpOptions);
    if (response.ok) return response;
    throw new Error('PHP Backend returned non-200');
  } catch (error) {
    console.warn('PHP Backend failed or timed out, falling back to GAS:', error);
    
    // Fallback to GAS if PHP fails (No strict timeout for GAS as it is backup)
    const token = getAuthToken();
    const gasFullUrl = url.startsWith('http') ? url : `${GAS_API_URL}${url.includes('?') ? url : '?' + url}${url.includes('?') || url.startsWith('http') ? '&' : '?'}token=${token || ''}`;
    const response = await fetch(gasFullUrl, options);
    if (!response.ok) throw new Error(`GAS Backend also failed: ${response.status}`);
    return response;
  }
}

// Logic to write to BOTH backends to keep them in sync
async function dualWrite(urlAction: string, payload: any): Promise<Response | null> {
  const body = JSON.stringify({ data: security.encrypt(payload) });
  const token = getAuthToken();
  const headers: any = {
    'X-API-KEY': API_KEY,
    'Content-Type': 'application/json'
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  // 1. Write to PHP (Primary) with Timeout
  let phpResponse: Response | null = null;
  try {
    phpResponse = await fetchWithTimeout(`${PHP_API_URL}${urlAction}`, {
      method: 'POST',
      headers,
      body
    });
  } catch (e) {
    console.error('DualWrite: PHP Failed or Timed Out. Data will be saved to GAS backup.', e);
  }

  // 2. Write to GAS (Backup) - Background sync
  try {
    const gasUrl = `${GAS_API_URL}${urlAction}${urlAction.includes('?') ? '&' : '?'}token=${token || ''}`;
    fetch(gasUrl, {
      method: 'POST',
      body
    }).catch(e => console.error('DualWrite: GAS Background Sync Failed', e));
  } catch (e) {}

  // If PHP failed, we must have a response to show the user (get it from GAS)
  if (!phpResponse || !phpResponse.ok) {
     return await fetch(`${GAS_API_URL}${urlAction}`, { method: 'POST', body });
  }

  return phpResponse;
}

export const dbService = {
  async getCurrentUser(): Promise<User | null> {
    const data = localStorage.getItem('sim_kepk_user');
    if (!data) return null;
    
    // Safety: If data starts with '{', it's old unencrypted JSON
    if (data.trim().startsWith('{')) {
      localStorage.removeItem('sim_kepk_user');
      return null;
    }

    const decrypted = security.decrypt(data);
    if (!decrypted || typeof decrypted !== 'object' || !decrypted.role) {
      if (decrypted) localStorage.removeItem('sim_kepk_user');
      return null;
    }
    
    return decrypted;
  },

  async login(email: string, password: string, role: UserRole): Promise<User | null> {
    try {
      const payload = { email, password, role };
      const response = await fetchWithFallback(`?action=login`, {
        method: 'POST',
        body: JSON.stringify({ data: security.encrypt(payload) }),
      });
      
      const responseText = await response.text();
      const result = security.decrypt(responseText);
      
      if (!result || typeof result !== 'object' || result.error) {
        console.error('Login failed. Server response:', responseText);
        return null;
      }
      
      localStorage.setItem('sim_kepk_user', security.encrypt(result));
      return result;
    } catch (error) {
      console.error('Login error:', error);
      return null;
    }
  },

  async loginWithGoogle(email: string, name: string, role: UserRole): Promise<User | null> {
    try {
      const payload = { email, name, role };
      const response = await fetchWithFallback(`?action=google_login`, {
        method: 'POST',
        body: JSON.stringify({ data: security.encrypt(payload) }),
      });

      const responseText = await response.text();
      const result = security.decrypt(responseText);

      if (!result || typeof result !== 'object') {
        throw new Error('Server returned invalid data format during Google Login');
      }

      if (result.error) {
        throw new Error(result.error);
      }

      localStorage.setItem('sim_kepk_user', security.encrypt(result));
      return result;
    } catch (error: any) {
      console.error('Google Login internal error:', error);
      // Re-throw with descriptive message
      throw error;
    }
  },

  async register(userData: Partial<User>, skipLogin: boolean = false): Promise<User | null> {
    try {
      const response = await dualWrite(`?action=register`, userData);
      if (!response) throw new Error('Dual write failed');
      
      const responseText = await response.text();
      const result = security.decrypt(responseText);
      
      if (!result || typeof result !== 'object' || result.error) {
        console.error('Registration failed: Invalid data returned');
        return null;
      }
      
      if (!skipLogin) {
        localStorage.setItem('sim_kepk_user', security.encrypt(result));
      }
      return result;
    } catch (error) {
      console.error('Registration error:', error);
      return null;
    }
  },

  async updateProfile(userData: User): Promise<User | null> {
    try {
      const response = await dualWrite(`?action=update_profile`, userData);
      if (!response) throw new Error('Dual write failed');
      
      const responseText = await response.text();
      const result = security.decrypt(responseText);
      
      if (!result || typeof result !== 'object' || result.error) {
        console.error('Update profile failed: Invalid data returned');
        return null;
      }

      // Preserve existing token
      const existingToken = getAuthToken();
      if (existingToken && !result.token) result.token = existingToken;

      localStorage.setItem('sim_kepk_user', security.encrypt(result));
      return result;
    } catch (error) {
      console.error('Update profile error:', error);
      return null;
    }
  },

  logout() {
    localStorage.removeItem('sim_kepk_user');
  },

  async getProtocols(researcherId?: string): Promise<Protocol[]> {
    try {
      const url = researcherId 
        ? `?action=get_protocols&researcher_id=${researcherId}`
        : `?action=get_protocols`;
        
      const response = await fetchWithFallback(url);
      const responseText = await response.text();
      const result = security.decrypt(responseText);
      
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('Fetch protocols error:', error);
      return [];
    }
  },

  async assignReviewer(protocolId: string, reviewerId: string): Promise<boolean> {
    try {
      const response = await dualWrite(`?action=assign_reviewer`, { protocolId, reviewerId });
      if (!response) return false;
      const responseText = await response.text();
      const result = security.decrypt(responseText);
      return result && result.success;
    } catch (error) {
      console.error('Error assigning reviewer', error);
      return false;
    }
  },

  async unassignReviewer(protocolId: string, reviewerId: string): Promise<boolean> {
    try {
      const response = await dualWrite(`?action=unassign_reviewer`, { protocolId, reviewerId });
      if (!response) return false;
      const responseText = await response.text();
      const result = security.decrypt(responseText);
      return result && result.success;
    } catch (error) {
      console.error('Error unassigning reviewer', error);
      return false;
    }
  },

  async changePassword(userId: string, newPassword: string): Promise<boolean> {
    try {
      const response = await dualWrite(`?action=change_password`, { userId, newPassword });
      if (!response) return false;
      const responseText = await response.text();
      const result = security.decrypt(responseText);
      return result && result.success;
    } catch (error) {
      console.error('Error changing password', error);
      return false;
    }
  },

  async getUsers(role?: UserRole): Promise<User[]> {
    try {
      const url = role 
        ? `?action=get_users&role=${role}`
        : `?action=get_users`;
        
      const response = await fetchWithFallback(url);
      const responseText = await response.text();
      const result = security.decrypt(responseText);
      
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('Fetch users error:', error);
      return [];
    }
  },

  async saveProtocol(protocol: Protocol): Promise<boolean> {
    try {
      const response = await dualWrite(`?action=save_protocol`, protocol);
      if (!response) return false;
      
      const responseText = await response.text();
      const result = security.decrypt(responseText);
      
      return result && result.success;
    } catch (error) {
      console.error('Save protocol error:', error);
      return false;
    }
  },

  async getProtocolById(id: string): Promise<Protocol | undefined> {
    try {
      const response = await fetchWithFallback(`?action=get_protocols&id=${id}`);
      const responseText = await response.text();
      const result = security.decrypt(responseText);
      
      return result || undefined;
    } catch (error) {
      console.error('Fetch protocol by ID error:', error);
      return undefined;
    }
  },

  async uploadFile(file: File): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(file);
      const base64 = await base64Promise;

      const payload = security.encrypt({
        action: 'upload_file',
        fileName: file.name,
        mimeType: file.type,
        base64: base64
      });

      const response = await fetchWithFallback(`?action=upload_file`, {
        method: 'POST',
        body: JSON.stringify({ data: payload }),
      });

      const responseText = await response.text();
      const result = security.decrypt(responseText);

      if (result && result.success) {
        return { success: true, url: result.fileUrl };
      } else {
        return { success: false, error: result?.error || 'Unknown upload error' };
      }
    } catch (error) {
      console.error('Upload file error:', error);
      return { success: false, error: String(error) };
    }
  },

  resetDatabase() {
    // This would typically clear the remote DB, but for now we just clear local session
    this.logout();
    window.location.reload();
  }
};
