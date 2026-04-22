const SECRET_KEY = 'SIM_KEPK_FKP_UNAIR_SECURE_2024';
const badResult = '\u0019Z\u001a\u0000\u0019\u001f\rXWV';

let hexStr = '';
for(let i=0; i<badResult.length; i++) {
  let originalByte = badResult.charCodeAt(i) ^ SECRET_KEY.charCodeAt((i) % SECRET_KEY.length);
  hexStr += originalByte.toString(16).padStart(2, '0');
}
console.log('Hex sent by frontend:', hexStr);
