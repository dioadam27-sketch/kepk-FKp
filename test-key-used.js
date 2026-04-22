const hexData = '4a13575f5256081c096d51504f48457e5a4e2d560e0561484d27405456224e520053524f4f480b19744b0b190c0274490d1405436854120b6f157e6202045c5a0a51524b075344324a42146a747f66005e';
const expectedStr = '{"email":"admin","password":"123","role":"ADMIN"}';

let keyChars = [];
for (let i = 0; i < expectedStr.length; i++) {
  let hexByte = parseInt(hexData.substring(i*2, i*2+2), 16);
  let valByte = expectedStr.charCodeAt(i);
  keyChars.push(String.fromCharCode(hexByte ^ valByte));
}
console.log("Key:", keyChars.join(''));
