"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Blockchain = void 0;
const block_1 = require("./block");
const transaction_1 = require("./transaction");
const elliptic_1 = require("elliptic");
const utils_1 = require("../utils");
const db_1 = require("./db");
let ec = new elliptic_1.ec('secp256k1');
const STORGE = "storage";
const me = "it's me";
const minerReward = 100;
class Blockchain {
    constructor(diff = 2) {
        this.diff = diff;
        this.chain = [];
        this.users = {};
        this.mempool = [];
        this.db = (0, db_1.initDB)('sqlite:chain.sqlite');
        this.db.sync();
        this.db.models.Block.findOne({
            order: [['createdAt', 'DESC']]
        }).then((d) => {
            if (d != null) {
                let blk = new block_1.Block(d.dataValues.prevHash, [], d.dataValues.index, d.dataValues.timestamp);
            }
            else {
                this.addTx(this.createGenesis(), "");
            }
        });
    }
    createGenesis() {
        return new transaction_1.Transaction(STORGE, me, 0, "this is genesis block");
    }
    getLastBlock() {
        if (this.chain.length == 0) {
            return new block_1.Block("", [], 0);
        }
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
        let block = new block_1.Block(phash, this.mempool.slice(), this.getLastBlock().index + 1);
        block = this.pow(block);
        this.db.models.Block.create({
            index: block.index,
            nonce: block.nonce,
            mekleRoot: block.mekleRoot,
            prevHash: block.prevHash,
            timestamp: block.timestamp,
        }).then(blk => {
            this.mempool = this.mempool.filter((tx) => {
                for (let i of block.data) {
                    if (i.hash === tx.hash) {
                        this.db.models.Transaction.create({
                            sign: tx.sign,
                            from: tx.from,
                            to: tx.to,
                            amount: tx.amount,
                            data: tx.data,
                            timestamp: tx.timestamp,
                            BlockId: blk.dataValues.id
                        });
                        return false;
                    }
                }
                return false;
            });
        });
        for (let tx of block.data) {
            this.users[tx.from].lockedOut -= tx.amount;
            this.users[tx.to].lockedIn -= tx.amount;
            this.users[tx.to].balance += tx.amount;
        }
        this.addTx(new transaction_1.Transaction(STORGE, miner, minerReward, "REWARD"), "");
        this.chain.push(block);
    }
    verifySign(data, sign, pub) {
        let key = ec.keyFromPublic(pub, 'hex');
        let hash = (0, utils_1.SHA256)(JSON.stringify(data));
        return key.verify(hash, sign);
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
            return { balance: 0, lockedOut: 0, lockedIn: 0, addr };
        return this.users[addr];
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
