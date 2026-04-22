const hexData = '4a13575f5256081c096d51504f48457e5a4e2d560e0561484d27405456224e520053524f4f480b19744b0b190c0274490d1405436854120b6f157e6202045c5a0a51524b075344324a42146a747f66005e';
const key = "112233";

let chars = [];
for (let i = 0; i < hexData.length / 2; i++) {
  let hexByte = parseInt(hexData.substring(i*2, i*2+2), 16);
  chars.push(String.fromCharCode(hexByte ^ key.charCodeAt(i % key.length)));
}
console.log("Decoded with early key:", chars.join(''));
