const HEX = '4a13575f5256081c096d51504f48457e5a4e2d560e0561484d27405456224e520053524f4f480b19744b0b190c0274490d1405436854120b6f157e6202045c5a0a51524b075344324a42146a747f66005e';
// What did the user actually put in `localStorage.setItem('sim_kepk_user', ...)`?
// Or did they send it via `.encrypt(user)`?
// Let's decode it using the frontend's CURRENT (fixed) decrypt function to see what data they sent! Wait, no, they sent it using the OLD buggy encrypt function!
const SECRET_KEY = "SIM_KEPK_FKP_UNAIR_SECURE_2024";

// Inverse of OLD buggy encrypt:
function inverseOldEncrypt(hexData) {
    let result = '';
    for (let i = 0; i < hexData.length; i += 2) {
      const byte = parseInt(hexData.substring(i, i + 2), 16);
      const xored = byte ^ SECRET_KEY.charCodeAt((i / 2) % SECRET_KEY.length);
      result += String.fromCharCode(xored); // This was the old way
    }
    return result;
}
console.log(inverseOldEncrypt(HEX));
