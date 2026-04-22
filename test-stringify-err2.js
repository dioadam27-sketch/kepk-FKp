const err = new SyntaxError("Unexpected token '\x19', \"\x19Z\" is not valid JSON");
const jsn = JSON.stringify({error: err.toString()});
console.log(JSON.parse(jsn));
