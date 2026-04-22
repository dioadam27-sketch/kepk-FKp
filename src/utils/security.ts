import CryptoJS from 'crypto-js';

// Global secret key (must match backend-gas.gs SECRET_KEY)
// We hardcode it here to prevent mismatch caused by local .env overrides
const SECRET_KEY = 'SIM_KEPK_FKP_UNAIR_SECURE_2024';

export const security = {
  /**
   * HEX-based XOR Obfuscation
   */
  encrypt(data: any): string {
    const stringData = typeof data === 'string' ? data : JSON.stringify(data);
    const utf8Bytes = CryptoJS.enc.Utf8.parse(stringData);
    const key = SECRET_KEY;
    let result = '';
    
    // We must XOR the actual bytes, not the hex string representation
    for (let i = 0; i < utf8Bytes.sigBytes; i++) {
        // Get the byte at index i
        const byte = (utf8Bytes.words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
        const xored = byte ^ key.charCodeAt(i % key.length);
        result += xored.toString(16).padStart(2, '0');
    }
    return result;
  },

  /**
   * HEX-based XOR De-obfuscation
   */
  decrypt(hexData: string): any {
    if (!hexData || hexData.length % 2 !== 0) return null;
    try {
      const key = SECRET_KEY;
      const bytes: number[] = [];
      for (let i = 0; i < hexData.length; i += 2) {
        bytes.push(parseInt(hexData.substring(i, i + 2), 16) ^ key.charCodeAt((i / 2) % key.length));
      }
      
      const words: number[] = [];
      for (let i = 0; i < bytes.length; i++) {
        const wordIdx = i >>> 2;
        if (words[wordIdx] === undefined) words[wordIdx] = 0;
        words[wordIdx] |= (bytes[i] & 0xff) << (24 - (i % 4) * 8);
      }
      
      const result = CryptoJS.enc.Utf8.stringify(CryptoJS.lib.WordArray.create(words, bytes.length));
      if (!result) return hexData; // Fallback to raw if decryption results in empty string

      try {
        return JSON.parse(result);
      } catch {
        return result;
      }
    } catch (error) {
      // If decryption fails, it might be a plain error message from server
      return hexData;
    }
  },

  hash(data: string): string {
    return CryptoJS.SHA256(data).toString();
  }
};
