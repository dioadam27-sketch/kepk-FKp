const SECRET_KEY = 'SIM_KEPK_FKP_UNAIR_SECURE_2024';

function backendDecrypt(hexData) {
  let key = SECRET_KEY;
  let bytes = [];
  for(let i=0; i<hexData.length; i+=2) {
    let hex = hexData.substring(i, i+2);
    let xored = parseInt(hex, 16) ^ key.charCodeAt((i/2) % key.length);
    if(xored > 127) xored -= 256;
    bytes.push(xored);
  }
  // Simulate Utilities.newBlob(bytes).getDataAsString()
  // Wait, Google Apps Script uses UTF-8 decoding for getDataAsString().
  // Let's use Buffer to decode as utf8
  return Buffer.from(bytes).toString('utf8');
}

console.log(backendDecrypt("286b28322a2c3c6965642a34323c206365702f323630223d373b100a1005617a6f7369373f273a6471721e110308077022"));
