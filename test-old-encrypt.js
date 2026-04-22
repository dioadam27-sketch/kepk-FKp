import CryptoJS from 'crypto-js';
const SECRET_KEY = 'SIM_KEPK_FKP_UNAIR_SECURE_2024';

function oldEncrypt(data) {
    const stringData = typeof data === 'string' ? data : JSON.stringify(data);
    let result = '';
    for (let i = 0; i < stringData.length; i++) {
      result += String.fromCharCode(stringData.charCodeAt(i) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length));
    }
    return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Latin1.parse(result));
}

console.log('Old Base64 payload:', oldEncrypt({email:"admin",password:"123",role:"ADMIN"}));

