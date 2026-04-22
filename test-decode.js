const SECRET_KEY = 'SIM_KEPK_FKP_UNAIR_SECURE_2024';
const hexStr = '4a13575f525a5d130810';
let decrypted = '';
for(let i=0; i<hexStr.length; i+=2) {
  let byte = parseInt(hexStr.substring(i, i+2), 16);
  decrypted += String.fromCharCode(byte ^ SECRET_KEY.charCodeAt((i/2) % SECRET_KEY.length));
}
console.log('Decrypted with frontend alg:', decrypted);
