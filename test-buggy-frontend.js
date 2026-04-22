import CryptoJS from 'crypto-js';

const SECRET_KEY = 'SIM_KEPK_FKP_UNAIR_SECURE_2024';

function buggyEncrypt(data) {
    const stringData = typeof data === 'string' ? data : JSON.stringify(data);
    const hex = CryptoJS.enc.Hex.stringify(CryptoJS.enc.Utf8.parse(stringData));
    const key = SECRET_KEY;
    let result = '';
    
    for (let i = 0; i < hex.length; i += 2) {
      const byte = parseInt(hex.substring(i, i + 2), 16);
      const xored = byte ^ key.charCodeAt((i / 2) % key.length);
      result += xored.toString(16).padStart(2, '0');
    }
    return result;
}

console.log(buggyEncrypt({"email":"admin","password":"123","role":"ADMIN"}));
