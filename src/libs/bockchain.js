"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Blockchain = void 0;
const crypto_1 = require("crypto");
const block_1 = require("./block");
const transaction_1 = require("./transaction");
const STORGE = "storage";
const me = "it's me";
const minerReward = 100;
class Blockchain {
    constructor(diff = 2) {
        this.diff = diff;
        this.chain = [];
        this.users = {};
        this.mempool = [];
        this.addTx(this.createGenesis(), "");
    }
    createGenesis() {
        return new transaction_1.Transaction(STORGE, me, 0, "this is genesis block");
    }
    getLastBlock() {
        return this.chain[this.chain.length - 1];
    }
    pow(blk) {
        console.log("Mining...");
        const d = new Array(this.diff + 1).join("0");
        while (true) {
            let hash = blk.hash;
            if (hash.slice(0, this.diff) == d) {
                console.log(hash);
                console.log("Solve: ", blk.nonce);
                break;
            }
            blk.nonce++;
        }
        return blk;
    }
    addBlock(miner) {
        let phash = this.getLastBlock() ? this.getLastBlock().hash : "";
        let block = new block_1.Block(phash, this.mempool.slice());
        block = this.pow(block);
        this.mempool = this.mempool.filter((tx) => {
            for (let i of block.data) {
                if (i.hash === tx.hash)
                    return false;
            }
            return false;
        });
        for (let tx of block.data) {
            this.users[tx.from].lockedOut -= tx.amount;
            this.users[tx.to].lockedIn -= tx.amount;
            this.users[tx.to].balance += tx.amount;
        }
        this.addTx(new transaction_1.Transaction(STORGE, miner, minerReward, "REWARD"), "");
        this.chain.push(block);
    }
    verifySign(data, sign, key) {
        const verify = (0, crypto_1.createVerify)('SHA256');
        verify.update(data.toString());
        return verify.verify(key, sign);
    }
    addTx(tx, key) {
        if (!this.users[tx.from]) {
            this.users[tx.from] = {
                addr: tx.from,
                balance: 0,
                lockedIn: 0,
                lockedOut: 0
            };
        }
        if (!this.users[tx.to]) {
            this.users[tx.to] = {
                addr: tx.to,
                balance: 0,
                lockedIn: 0,
                lockedOut: 0
            };
        }
        if (tx.from != STORGE && this.users[tx.from].balance < tx.amount) {
            throw Error("tx.amount  > from.balance");
        }
        if (tx.from != STORGE && this.verifySign(tx, tx.sign, key)) {
            throw Error("sing not vaild");
        }
        this.users[tx.from].balance -= tx.amount;
        this.users[tx.from].lockedOut += tx.amount;
        this.users[tx.to].lockedIn += tx.amount;
        this.mempool.push(tx);
    }
    getBalance(addr) {
        if (!this.users[addr])
            return 0;
        return this.users[addr].balance;
    }
    toString(str = "") {
        let chain = [];
        for (let blk of this.chain) {
            chain.push(blk.toObj());
        }
        return JSON.stringify(chain, undefined, str);
    }
    toObj() {
        let chain = [];
        for (let blk of this.chain) {
            chain.push(blk.toObj());
        }
        return chain;
    }
}
exports.Blockchain = Blockchain;
