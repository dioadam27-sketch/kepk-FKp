const jsonStr = `{"error":"SyntaxError: Unexpected token '\u0019', \\"\u0019Z\u001a\u0000\u0019\u001f\rXWV\\" is not valid JSON"}`;
try {
  JSON.parse(jsonStr);
  console.log("VALID JSON");
} catch(e) {
  console.log("INVALID JSON", e);
}
