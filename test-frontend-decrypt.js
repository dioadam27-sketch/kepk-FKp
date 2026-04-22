import CryptoJS from 'crypto-js';
const SECRET_KEY = 'SIM_KEPK_FKP_UNAIR_SECURE_2024';
const hexData = '286b282d392a22696564182931212f390c202d3c377975072b3a4a405757272c297f3f2a3b2e31666c0c2a657e707075737319610927756f0309686826797d6e2a19257b6f767b0c2a657e70700e2a637572330e370765666e167d67637f2236702530326b263e39272569180c1c0b6128';

const key = SECRET_KEY;
const bytes = [];
for (let i = 0; i < hexData.length; i += 2) {
  bytes.push(parseInt(hexData.substring(i, i + 2), 16) ^ key.charCodeAt((i / 2) % key.length));
}

const words = [];
for (let i = 0; i < bytes.length; i++) {
  const wordIdx = i >>> 2;
  if (words[wordIdx] === undefined) words[wordIdx] = 0;
  words[wordIdx] |= (bytes[i] & 0xff) << (24 - (i % 4) * 8);
}

const result = CryptoJS.enc.Utf8.stringify(CryptoJS.lib.WordArray.create(words, bytes.length));
console.log("DECRYPTED BY FRONTEND:", result);
