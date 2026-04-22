const SECRET_KEY = 'SIM_KEPK_FKP_UNAIR_SECURE_2024';
const targetStr = '\u0019Z\u001a\u0000\u0019\u001f\rXWV+\u001a`\u000f?';
// I will just print the hex.
let X = '';
for(let i=0;i<targetStr.length;i++){
  X += (targetStr.charCodeAt(i) ^ SECRET_KEY.charCodeAt((i)%SECRET_KEY.length)).toString(16).padStart(2,'0');
}
console.log('Hex X sent by frontend:', X);
