"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const crypto_1 = require("crypto");
const transaction_1 = require("./transaction");
class User {
    constructor(chain) {
        this.chain = chain;
        let keypair = (0, crypto_1.generateKeyPairSync)('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
        });
        this.keypair = {
            public: keypair.publicKey.toString(),
            private: keypair.privateKey.toString()
        };
        this.addr = this.generateAddress();
    }
    get balance() {
        return this.chain.getBalance(this.addr);
    }
    generateAddress() {
        let tmp = this.keypair.public.split("\n");
        tmp.pop();
        tmp.shift();
        let tmpb = Buffer.from(tmp.join(""), "base64");
        let a = tmpb.slice(0, tmpb.length / 2);
        let b = tmpb.slice(tmpb.length / 2, tmpb.length);
        tmpb = Buffer.from(a.map((v, i) => v ^ b[i]));
        for (let i = 0; i < 2; i++) {
            a = tmpb.slice(0, tmpb.length / 2);
            b = tmpb.slice(tmpb.length / 2, tmpb.length);
            tmpb = Buffer.from(a.map((v, i) => v ^ b[i]));
        }
        return tmpb.toString("hex");
    }
    sing(data) {
        let sing = (0, crypto_1.createSign)("SHA256");
        sing.update(data.toString());
        return sing.sign(this.keypair.private).toString("hex");
    }
    sendMoney(to, amount) {
        if (amount > this.balance) {
            throw Error("amount > balnce");
        }
        let tx = new transaction_1.Transaction(this.addr, to, amount);
        tx.sign = this.sing(tx);
        this.chain.addTx(tx, this.keypair.public);
    }
}
exports.User = User;
