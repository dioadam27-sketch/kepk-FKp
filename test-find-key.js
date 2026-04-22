const hexData = '286b282d392a22696564182931212f390c202d3c377975072b3a4a405757272c297f3f2a3b2e31666c0c2a657e707075737319610927756f0309686826797d6e2a19257b6f767b0c2a657e70700e2a637572330e370765666e167d67637f2236702530326b263e39272569180c1c0b6128';
const expectedStr = '\u0019Z\u001a\u0000\u0019\u001f\rXWV';
let keyBytes = [];
for (let i = 0; i < expectedStr.length; i++) {
  let hexByte = parseInt(hexData.substring(i*2, i*2+2), 16);
  let expectedByte = expectedStr.charCodeAt(i);
  keyBytes.push(hexByte ^ expectedByte);
}
console.log("Found key bytes:", Buffer.from(keyBytes).toString('utf8'));
