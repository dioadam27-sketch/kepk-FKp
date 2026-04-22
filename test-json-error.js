const jsonStr = `{"error":"SyntaxError: Unexpected token '\x19', \\"\x19Z\\""}`;
console.log(jsonStr);
try { JSON.parse(jsonStr); } catch (e) { console.log("Failed to parse:", e); }
