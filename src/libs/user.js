"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const transaction_1 = require("./transaction");
const elliptic_1 = require("elliptic");
const utils_1 = require("../utils");
class User {
    constructor(chain) {
        this.chain = chain;
        let ec = new elliptic_1.ec('secp256k1');
        this.keypair = ec.genKeyPair();
        let pkh = this.keypair.getPublic("array");
        this.addr = this.generateAddress(pkh);
    }
    get balance() {
        return this.chain.getBalance(this.addr);
    }
    generateAddress(pk) {
        let tmpb = pk.slice();
        let a = tmpb.slice(0, tmpb.length / 2);
        let b = tmpb.slice(tmpb.length / 2, tmpb.length);
        tmpb = a.map((v, i) => v ^ b[i]);
        a = tmpb.slice(0, tmpb.length / 2);
        b = tmpb.slice(tmpb.length / 2, tmpb.length);
        tmpb = a.map((v, i) => v ^ b[i]);
        return tmpb.map((v, i) => v.toString(16)).join("");
    }
    sign(data) {
        let hash = (0, utils_1.SHA256)(JSON.stringify(data));
        let sign = this.keypair.sign(hash);
        return sign.toDER("hex");
    }
    sendMoney(to, amount) {
        if (amount > this.balance.balance) {
            throw Error("amount > balnce");
        }
        let tx = new transaction_1.Transaction(this.addr, to, amount);
        tx.sign = this.sign(tx);
        let r = this.chain.addTx(tx, this.keypair.getPublic("hex"));
    }
}
exports.User = User;
