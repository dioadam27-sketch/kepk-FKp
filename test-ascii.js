const SECRET_KEY = 'SIM_KEPK_FKP_UNAIR_SECURE_2024';
const payload = '{"email":"admin","password":"123","role":"ADMIN"}';
for(let i=0; i<payload.length; i++) {
  let byte = payload.charCodeAt(i);
  let xored = byte ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length);
  if (xored > 127) {
    console.log(`Pos ${i}: ${payload[i]} (${byte}) ^ ${SECRET_KEY[i % SECRET_KEY.length]} (${SECRET_KEY.charCodeAt(i % SECRET_KEY.length)}) = ${xored}`);
  }
}
