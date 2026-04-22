const SECRET_KEY = 'SIM_KEPK_FKP_UNAIR_SECURE_2024';
const sentHex = '4a13575f525a5d130810604a3f5a71'; // ...
let plain = '';
for(let i=0; i<sentHex.length; i+=2) {
  plain += String.fromCharCode(parseInt(sentHex.substring(i, i+2), 16) ^ SECRET_KEY.charCodeAt((i/2) % SECRET_KEY.length));
}
console.log("XOR decrypted string:", plain);
