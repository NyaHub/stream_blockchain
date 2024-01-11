"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.delay = exports.sha256 = void 0;
const crypto_1 = require("crypto");
function sha256(data) {
    const hash = (0, crypto_1.createHash)('SHA256');
    hash.update(data).end();
    return hash.digest('hex');
}
exports.sha256 = sha256;
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
exports.delay = delay;
