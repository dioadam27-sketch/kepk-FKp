const SECRET_KEY = 'SIM_KEPK_FKP_UNAIR_SECURE_2024';
const errorString = '\\u0019Z\\u001a\\u0000\\u0019\\u001f\\rXWV';
// Actually, let's just XOR the characters of the decrypted string with the key!
const decryptedStr = '\u0019Z\u001a\u0000\u0019\u001f\rXWV';
let originalStr = '';
for(let i=0; i<decryptedStr.length; i++) {
  originalStr += String.fromCharCode(decryptedStr.charCodeAt(i) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length));
}
console.log("Original string sent by frontend:", originalStr);
