const errStr = "SyntaxError: Unexpected token '\x19', \"\x19Z\"";
const jsonStr = JSON.stringify({error: errStr});
console.log(jsonStr);
try {
  JSON.parse(jsonStr);
  console.log("VALID!");
} catch(e) {
  console.log("INVALID!", e);
}
