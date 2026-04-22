const hexData = "286b282d392a22696564182931212f390c202d3c377975072b3a4a405757272c297f3f2a3b2e31666c0c2a657e707075737319610927756f0309686826797d6e2a19257b6f767b0c2a657e70700e2a637572330e370765666e167d67637f2236702530326b263e39272569180c1c0b6128";
const key = "SIM_KEPK_FKP_UNAIR_SECURE_2024";

let chars = [];
for (let i = 0; i < hexData.length / 2; i++) {
  let hexByte = parseInt(hexData.substring(i*2, i*2+2), 16);
  chars.push(String.fromCharCode(hexByte ^ key.charCodeAt(i % key.length)));
}
console.log("Decrypted with SIM_KEPK:", chars.join(''));
