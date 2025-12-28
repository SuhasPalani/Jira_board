const crypto = require("crypto");

// Generate a 64-byte random secret and convert to hex
const sessionSecret = crypto.randomBytes(64).toString("hex");

console.log('SESSION_SECRET="' + sessionSecret + '"');
