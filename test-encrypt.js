import CryptoJS from 'crypto-js';

const SECRET_KEY = 'SIM_KEPK_FKP_UNAIR_SECURE_2024';

function frontendEncrypt(data) {
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
}

function backendDecrypt(hexData) {
  let key = SECRET_KEY;
  let bytes = [];
  for(let i=0; i<hexData.length; i+=2) {
    bytes.push(parseInt(hexData.substr(i, 2), 16) ^ key.charCodeAt((i/2) % key.length));
  }
  return Buffer.from(bytes).toString('utf8');
}

const payload = { email: "admin", password: "123", role: "ADMIN" };
const hexData = frontendEncrypt(payload);
console.log("Encrypted:", hexData);

const decrypted = backendDecrypt(hexData);
console.log("Decrypted:", decrypted);


