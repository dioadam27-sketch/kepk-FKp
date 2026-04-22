const hexData = "286b282d392a22696564182931212f390c202d3c377975072b3a4a405757272c297f3f2a3b2e31666c0c2a657e707075737319610927756f0309686826797d6e2a19257b6f767b0c2a657e70700e2a637572330e370765666e167d67637f2236702530326b263e39272569180c1c0b6128";
const decodedStr = "ZXWV+?KF4xrddMT_?TLBCFBB+S:D^1;[[HO\\*J]DH?TLBC=RG@=6WT]%LVQMAXZ+=-9S";

for (let i = 0; i < 4; i++) {
  let hexByte = parseInt(hexData.substring(i*2, i*2+2), 16);
  let decByte = decodedStr.charCodeAt(i);
  console.log(`char[${i}]: hex=${hexByte}, decChar=${decodedStr[i]} code=${decByte}, XOR=${hexByte ^ decByte} ('${String.fromCharCode(hexByte ^ decByte)}')`);
}
