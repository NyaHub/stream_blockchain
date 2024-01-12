"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Transaction = void 0;
const utils_1 = require("../utils");
class Transaction {
    constructor(from, to, amount, data = "", timestamp = new Date().getTime()) {
        this.from = from;
        this.to = to;
        this.amount = amount;
        this.data = data;
        this.timestamp = timestamp;
        this.sign = "";
    }
    get hash() {
        return (0, utils_1.SHA256)(JSON.stringify({
            from: this.from,
            to: this.to,
            amount: this.amount,
            data: this.data,
        }));
    }
    toString() {
        return this.hash;
    }
}
exports.Transaction = Transaction;
