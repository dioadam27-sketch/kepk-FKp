const errJson = '{"error":"SyntaxError: Unexpected token \'\\u0019\', \\"\\u0019Z\\u001a\\u0000\\u0019\\u001f\\rXWV\\" is not valid JSON"}';
const stripped = errJson.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
console.log(stripped);
