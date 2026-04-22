const err = new SyntaxError("Unexpected token '\x19', \"\x19Z\" is not valid JSON");
console.log(JSON.stringify({error: err.toString()}));
