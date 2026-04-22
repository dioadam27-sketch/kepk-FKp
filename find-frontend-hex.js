const decStr = "\u0019Z\u001a\u0000\u0019\u0013XWV+\u001a\u0000\u0010\u001d\u000b?\u0013\u001cr\u0005KF4\u001a\bxrdd\u0016\u001d\u001bM\f\u0019\n\u001f\u0003T_?\u001bTLBC=\u001bRG@\u0000=\u0006WT]%LVQM\u0011\u0005A\u0014\u0002\u0000X\u0015\u000fb\u0015\u0017Z+=-9S\u001b";
const SECRET_KEY = "SIM_KEPK_FKP_UNAIR_SECURE_2024";

let hexStr = '';
for(let i=0; i<decStr.length; i++) {
  let valByte = decStr.charCodeAt(i);
  let keyByte = SECRET_KEY.charCodeAt((i/2) % SECRET_KEY.length); // backend's bug! (Wait, backend uses (i/2)? No! backend uses i % key.length!)
  // Wait, does backend use i % key.length? Let's check!
  let xored = valByte ^ SECRET_KEY.charCodeAt((i) % SECRET_KEY.length);
  hexStr += xored.toString(16).padStart(2, '0');
}
console.log("Original Hex Sent by Frontend:", hexStr);
