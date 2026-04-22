const SECRET_KEY = 'SIM_KEPK_FKP_UNAIR_SECURE_2024';
const decStr = "ZXWV+?KF4xrddMT_?TLBCFBB+S:D^1;[[HO\\*J]DH?TLBC=RG@=6WT]%LVQMAXZ+=-9S";

let keyChars = [];
for (let i = 0; i < decStr.length; i++) {
  let valByte = decStr.charCodeAt(i);
  let keyByte = SECRET_KEY.charCodeAt((i/2) % SECRET_KEY.length); // wait, (i/2)?
  // Let's just try XORing with 'SIM_KEPK...'
  keyChars.push(String.fromCharCode(valByte ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length)));
}
console.log("XOR with real key:", keyChars.join(''));
