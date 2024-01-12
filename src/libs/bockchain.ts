import { createVerify } from "crypto"
import { Blk, Block } from "./block"
import { Transaction } from "./transaction"
import { IUser } from "./user"
import { ec as EC } from "elliptic"
import { SHA256 } from "../utils"
import { Model, Sequelize } from "sequelize"
import { BlockModel, initDB } from "./db"
import { error } from "console"

let ec = new EC('secp256k1')

const STORGE = "storage"
const STORGE_BALANCE = 1000000000
const me = "it's me"
const minerReward = 100

const STORGE_WALLET = {
    addr: STORGE,
    balance: STORGE_BALANCE,
    lockedIn: 0,
    lockedOut: 0
}

export class Blockchain {
    public chain: Block = new Block("", [], 0)
    public users: { [index: string]: IUser } = { [STORGE]: STORGE_WALLET }
    private mempool: Transaction[] = []
    private db: Sequelize

    constructor(public diff: number = 2) {
        this.db = initDB('sqlite:chain.sqlite')
    }

    async init(cb: () => void) {
        this.db.sync({ force: true }).then(() => {
            this.db.models.Block.findOne({
                order: [['createdAt', 'DESC']]
            }).then(async (d) => {
                if (d != null) {
                    let blk = await this.restoreBlock(d)

                    if (blk != null) { this.chain = blk }
                    { this.createGenesis() }
                } else {
                    this.createGenesis()
                }
                cb()
            }).catch(console.log)
        }).catch(console.log)
    }

    private createGenesis() {
        this.addTx(new Transaction(STORGE, me, 100, "this is genesis block"), "")
    }

    public getLastBlock() {
        return this.chain
    }

    public pow(blk: Block) {
        console.log("Mining...")

        const d = new Array(this.diff + 1).join("0")

        while (true) {
            let hash = blk.hash
            if (hash.slice(0, this.diff) == d) {
                console.log(hash)
                console.log("Solve: ", blk.nonce)
                break
            }
            blk.nonce++
        }

        return blk
    }

    public async addBlock(miner: string) {
        let phash = this.getLastBlock().hash
        let block = new Block(
            phash,
            this.mempool.slice(),
            this.getLastBlock().index + 1
        )

        block = this.pow(block)

        for (let tx of block.data) {
            this.users[tx.from].lockedOut -= tx.amount
            this.users[tx.to].lockedIn -= tx.amount
            this.users[tx.to].balance += tx.amount
        }

        this.chain = block

        let blk = await this.db.models.Block.create({
            index: block.index,
            nonce: block.nonce,
            merkleRoot: block.merkleRoot,
            prevHash: block.prevHash,
            timestamp: block.timestamp,
            hash: block.hash
        })

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
                        BlockId: blk.dataValues.id,
                        hash: tx.hash,
                        seed: tx.seed
                    }).then((d) => { }).catch((e) => { console.log("tx add err", e) })
                    return false
                }
            }
            return true
        })
        this.addReward(miner)
    }

    private addReward(miner: string) {
        this.addTx(new Transaction(
            STORGE,
            miner,
            minerReward,
            "REWARD"
        ), "")
    }

    public verifySign(data: any, sign: string, pub: string) {
        let key = ec.keyFromPublic(pub, 'hex')
        let hash = SHA256(JSON.stringify(data))
        return key.verify(hash, sign)
    }

    public addTx(tx: Transaction, key: string) {
        if (!this.users[tx.from]) {
            this.users[tx.from] = {
                addr: tx.from,
                balance: 0,
                lockedIn: 0,
                lockedOut: 0
            }
        }
        if (!this.users[tx.to]) {
            this.users[tx.to] = {
                addr: tx.to,
                balance: 0,
                lockedIn: 0,
                lockedOut: 0
            }
        }
        if (tx.from != STORGE && this.users[tx.from].balance < tx.amount) {
            throw Error("tx.amount  > from.balance")
        }

        if (tx.from != STORGE && this.verifySign(tx, tx.sign, key)) {
            throw Error("sing not vaild")
        }

        this.users[tx.from].balance -= tx.amount
        this.users[tx.from].lockedOut += tx.amount
        this.users[tx.to].lockedIn += tx.amount

        this.mempool.push(tx)
    }

    public getBalance(addr: string): IUser {
        if (!this.users[addr]) return { balance: 0, lockedOut: 0, lockedIn: 0, addr }
        return this.users[addr]
    }

    private async restoreBlock(b: Model<BlockModel>) {
        let blk: Block | null = null
        blk = new Block(
            b.dataValues.prevHash,
            [],
            b.dataValues.index,
            b.dataValues.timestamp
        )
        let txsd = await this.db.models.Transaction.findAll({
            where: {
                BlockId: b.dataValues.id
            }
        })

        if (txsd == null) {
            blk = null
        } else {
            let txs: Transaction[] = []
            for (let tx of txsd) {
                txs.push(new Transaction(
                    tx.dataValues.from,
                    tx.dataValues.to,
                    tx.dataValues.amount,
                    tx.dataValues.data,
                    tx.dataValues.timestamp
                ))
                txs[txs.length - 1].sign = tx.dataValues.sign
                txs[txs.length - 1].seed = tx.dataValues.seed
            }
            if (blk != null) blk.data = txs
        }

        return blk
    }

    public async toString(str: string = "") {
        try {
            let chain = await this.toObj()

            if (chain instanceof Error) throw chain

            return JSON.stringify(chain, undefined, str)
        } catch (error) {
            return error
        }
    }
    public async toObj() {
        let chain = []

        try {
            let _chain = await this.db.models.Block.findAll()

            if (_chain == null) throw Error("No such blocks")

            for (let blk of _chain) {
                chain.push(await this.restoreBlock(blk))
            }

            return chain
        } catch (error) {
            return error
        }
    }
}