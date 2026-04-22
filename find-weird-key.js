const hexData = "286b282d392a22696564182931212f390c202d3c377975072b3a4a405757272c297f3f2a3b2e31666c0c2a657e707075737319610927756f0309686826797d6e2a19257b6f767b0c2a657e70700e2a637572330e370765666e167d67637f2236702530326b263e39272569180c1c0b6128";
const decodedStr = "\u0019Z\u001a\u0000\u0019\u0013XWV+\u001a\u0000\u0010\u001d\u000b?\u0013\u001cr\u0005KF4\u001a\bxrdd\u0016\u001d\u001bM\f\u0019\n\u001f\u0003T_?\u001bTLBC=\u001bRG@\u0000=\u0006WT]%LVQM\u0011\u0005A\u0014\u0002\u0000X\u0015\u000fb\u0015\u0017Z+=-9S\u001b";

let keyChars = [];
for(let i=0; i<decodedStr.length; i++) {
  let hexByte = parseInt(hexData.substring(i*2, i*2+2), 16);
  let decChar = decodedStr.charCodeAt(i);
  keyChars.push(String.fromCharCode(hexByte ^ decChar));
}
console.log("The frontend key is:", keyChars.join(''));
