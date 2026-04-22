/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User, Protocol, UserRole } from './types';
import { security } from './utils/security';

// Note: In this environment, PHP often won't run locally, so GAS becomes the primary working API.
// However, we implement fallback logic so the app can switch to GAS if PHP is down.
const PHP_API_URL = 'http://localhost/api.php'; // Example primary
const GAS_API_URL = 'https://script.google.com/macros/s/AKfycbz-wjq2G3uI2rUqdjSYHHpTI92HOSl2oKkrJTEX6TQCKPj1pfcZEJwF0nxWKEniDoEQig/exec';

let currentApiUrl = GAS_API_URL; // Default to GAS since it's confirmed working

async function fetchWithFallback(url: string, options: RequestInit = {}): Promise<Response> {
  try {
    const response = await fetch(url, options);
    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
    return response;
  } catch (error) {
    if (url !== GAS_API_URL) {
      console.warn('Primary API failed, falling back to Google Apps Script...', error);
      return fetch(GAS_API_URL + (url.includes('?') ? '&' + url.split('?')[1] : ''), options);
    }
    throw error;
  }
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
      const payload = security.encrypt({ email, password, role });
      const response = await fetchWithFallback(`${currentApiUrl}?action=login`, {
        method: 'POST',
        body: JSON.stringify({ data: payload }),
      });
      
      const responseText = await response.text();
      const result = security.decrypt(responseText);
      
      if (!result || typeof result !== 'object' || result.error) {
        console.error('Login failed. Server response:', responseText);
        
        let safeResultString = '';
        if (typeof result === 'string') {
           // Remove control characters to avoid breaking the console log visual
           safeResultString = result.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
        } else {
           safeResultString = JSON.stringify(result);
        }
        console.log('Decrypted result:', safeResultString);
        return null;
      }
      
      localStorage.setItem('sim_kepk_user', security.encrypt(result));
      return result;
    } catch (error) {
      console.error('Login error:', error);
      return null;
    }
  },

  async register(userData: Partial<User>): Promise<User | null> {
    try {
      const payload = security.encrypt(userData);
      const response = await fetchWithFallback(`${currentApiUrl}?action=register`, {
        method: 'POST',
        body: JSON.stringify({ data: payload }),
      });
      
      const responseText = await response.text();
      const result = security.decrypt(responseText);
      
      if (!result || typeof result !== 'object' || result.error) {
        console.error('Registration failed: Invalid data returned');
        return null;
      }
      
      localStorage.setItem('sim_kepk_user', security.encrypt(result));
      return result;
    } catch (error) {
      console.error('Registration error:', error);
      return null;
    }
  },

  async updateProfile(userData: User): Promise<User | null> {
    try {
      const payload = security.encrypt(userData);
      const response = await fetchWithFallback(`${currentApiUrl}?action=update_profile`, {
        method: 'POST',
        body: JSON.stringify({ data: payload }),
      });
      
      const responseText = await response.text();
      const result = security.decrypt(responseText);
      
      if (!result || typeof result !== 'object' || result.error) {
        console.error('Update profile failed: Invalid data returned');
        return null;
      }
      
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
        ? `${currentApiUrl}?action=get_protocols&researcher_id=${researcherId}`
        : `${currentApiUrl}?action=get_protocols`;
        
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
      const payload = security.encrypt({ action: 'assign_reviewer', protocolId, reviewerId });
      const response = await fetchWithFallback(`${currentApiUrl}?action=assign_reviewer`, {
        method: 'POST',
        body: JSON.stringify({ data: payload }),
      });
      const responseText = await response.text();
      const result = security.decrypt(responseText);
      return result && result.success;
    } catch (error) {
       console.error('Error assigning reviewer', error);
       return false;
    }
  },

  async getUsers(role?: UserRole): Promise<User[]> {
    try {
      const url = role 
        ? `${currentApiUrl}?action=get_users&role=${role}`
        : `${currentApiUrl}?action=get_users`;
        
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
      const payload = security.encrypt(protocol);
      const response = await fetchWithFallback(`${currentApiUrl}?action=save_protocol`, {
        method: 'POST',
        body: JSON.stringify({ data: payload }),
      });
      
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
      const response = await fetchWithFallback(`${currentApiUrl}?action=get_protocols&id=${id}`);
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

      const response = await fetchWithFallback(`${currentApiUrl}?action=upload_file`, {
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
