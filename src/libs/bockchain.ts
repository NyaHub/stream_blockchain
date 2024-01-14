import { Block, IBlock } from "./block"
import { ITransaction, Transaction } from "./transaction"
import { IUser } from "./user"
import { ec as EC } from "elliptic"
import { SHA256 } from "../utils"
import { Model, Sequelize } from "sequelize"
import { BlockModel, TransactionModel, initDB } from "./db"
import { Event } from "./event"

let ec = new EC('secp256k1')

const STORGE = "storage"
const STORGE_BALANCE = 1000000000
const ME = "it's me"
const MINER_REWARD = 100
const TXS_LIMIT = 5
const DEFAULT_FEE = .0005

const STORGE_WALLET = {
    addr: STORGE,
    balance: STORGE_BALANCE,
    lockedIn: 0,
    lockedOut: 0
}

export class Blockchain {
    public chain: Block = new Block("", [], 0, 0)
    public users: { [index: string]: IUser } = { [STORGE]: STORGE_WALLET }
    private mempool: Transaction[] = []
    private db: Sequelize
    private _fee: number[] = [DEFAULT_FEE]

    constructor(public event: Event, public diff: number = 2) {
        this.db = initDB('sqlite:chain.sqlite')
        event.on("answerChain", this.addNetBlock.bind(this))
        event.on("answerTx", this.addTx.bind(this))
    }

    async init(cb: () => void) {
        this.db.sync({ force: !true }).then(() => {
            this.db.models.Block.findAll()
                .then(async (d) => {
                    if (d.length != 0) {
                        for (let b of d) {
                            let blk = await this.restoreBlock(b)

                            if (blk != null) {
                                if (blk.prevHash != this.chain.hash) {
                                    for (let tx of blk.data) {
                                        this.users[tx.from].balance += (tx.amount + tx.fee)
                                        this.users[tx.to].balance -= tx.amount
                                        this.users[STORGE].balance -= tx.fee
                                        this.db.models.Transaction.destroy({
                                            where: {
                                                hash: tx.hash
                                            }
                                        })
                                    }
                                    await b.destroy()
                                }
                                this.chain = blk
                            }
                            else { this.createGenesis(); return cb() }
                        }
                    } else {
                        this.createGenesis()
                    }
                    cb()
                }).catch(console.log)
        }).catch(console.log)
    }

    private createGenesis() {
        this.addTx(new Transaction(STORGE, ME, 100, 100, "this is genesis block"), "")
    }

    public getLastBlock() {
        return this.chain
    }

    getFee() {
        this._fee = []
        this.mempool.forEach((v) => {
            if (v.from != STORGE) {
                this._fee.push(v.fee)
            }
        })

        if (this._fee.length == 0) return [DEFAULT_FEE, DEFAULT_FEE, DEFAULT_FEE]

        this._fee.sort((a, b) => b - a)
        this._fee = this._fee.slice(0, TXS_LIMIT)

        let avg = 0
        this._fee.forEach(e => {
            avg += e
        })
        avg /= this._fee.length

        return [
            this._fee[0],
            avg,
            this._fee[this._fee.length - 1]
        ]
    }

    private getTxs() {
        let storage = false
        this.mempool.sort((a, b) => {
            storage = storage || a.from == STORGE || b.from == STORGE
            if (a.fee > b.fee) {
                return -1;
            }
            if (b.fee > a.fee) {
                return 1;
            }
            return 0;
        })

        let max_txs = TXS_LIMIT + (storage ? 1 : 0)
        max_txs = this.mempool.length > max_txs ? max_txs : this.mempool.length
        return this.mempool.slice(0, max_txs)
    }

    public createBlock() {
        let phash = this.getLastBlock().hash
        return new Block(
            phash,
            this.getTxs(),
            this.getLastBlock().index + 1
        )
    }

    public async checkNetBlock(hash: string) {
        let dbBlock = await this.db.models.Block.findOne({
            where: {
                hash
            }
        })

        if (dbBlock != null) return false

        return true
    }

    public async addNetBlock(chain: IBlock[]) {
        let blkHashes: string[] = []
        let blocks: Block[] = []

        if (chain[0].hash != this.chain.hash) return

        chain.shift()

        this.event.emit("toggleMiner", null)

        for (let blk of chain) {
            let b = Block.create(blk)

            if (b.hash === blk.hash && b.prevHash === this.chain.hash) {
                this.chain = b
                await this.addBlock(b)
            }
        }

        this.event.emit("toggleMiner", null)
    }

    public async addBlock(block: Block) {

        for (let tx of block.data) {
            if (this.mempool.find(t => tx.hash == t.hash)) {
                this.users[tx.from].lockedOut -= (tx.amount + tx.fee)
                this.users[tx.to].lockedIn -= tx.amount
            } else {
                this.users[tx.from].balance -= (tx.amount + tx.fee)
            }
            this.users[tx.to].balance += tx.amount
            this.users[STORGE].balance += tx.fee
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
                        fee: tx.fee,
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
    }

    public async addMinedBock(block: Block, miner: string) {
        this.addBlock(block)
        this.addReward(miner)
    }

    private addReward(miner: string) {
        if (this.users[STORGE].balance < MINER_REWARD) return
        this.addTx(new Transaction(
            STORGE,
            miner,
            MINER_REWARD,
            100,
            "REWARD"
        ), "")
    }

    public verifySign(data: any, sign: string, pub: string) {
        let key = ec.keyFromPublic(pub, 'hex')
        let hash = SHA256(JSON.stringify(data))
        return key.verify(hash, sign)
    }

    public addTx(tx: Transaction, key: string) {
        this.restoreBalance(tx, key)

        this.mempool.push(tx)
        this.event.emit("anonceTx", tx.hash)
    }

    public getBalance(addr: string): IUser {
        if (!this.users[addr]) return { balance: 0, lockedOut: 0, lockedIn: 0, addr }
        return this.users[addr]
    }

    private async restoreBlock(b: Model<BlockModel>) {
        if (b == null) return null

        let txsd = await this.db.models.Transaction.findAll({
            where: {
                BlockId: b.dataValues.id
            }
        })

        if (txsd == null)
            return null

        let txs: ITransaction[] = txsd.map((v) => {
            this.restoreBalance(v)
            return <ITransaction>v.dataValues
        })

        let blk: IBlock = b.dataValues

        blk.data = txs

        return Block.create(blk)
    }

    public async checkNetTx(hash: string) {
        if (this.mempool.find(tx => tx.hash === hash)) return false
        let tx = await this.db.models.Transaction.findOne({
            where: { hash }
        })

        if (tx != null) return false

        return true
    }

    private restoreBalance(txi: Model<TransactionModel> | ITransaction | Transaction, key?: string) {
        let tx: ITransaction

        if (txi instanceof Model) {
            tx = <ITransaction>txi.dataValues
        } else {
            tx = txi
        }

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

        if (key != null) {
            if (tx.from != STORGE && this.users[tx.from].balance < tx.amount + tx.fee) {
                throw Error("tx.amount  > from.balance")
            }

            if (tx.from != STORGE && this.verifySign(tx, tx.sign, key)) {
                throw Error("sing not vaild")
            }
            this.users[tx.from].balance -= tx.amount + tx.fee
            this.users[tx.from].lockedOut += tx.amount + tx.fee
            this.users[tx.to].lockedIn += tx.amount
        } else {
            this.users[tx.from].balance -= (tx.amount + tx.fee)
            this.users[tx.to].balance += tx.amount
            this.users[STORGE].balance += tx.fee
        }


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

            if (_chain.length == 0) throw Error("No such blocks")

            for (let blk of _chain) {
                chain.push(await this.restoreBlock(blk))
            }

            return chain
        } catch (error) {
            return error
        }
    }

    public async getChain(hash: string) {
        let chain: IBlock[] = []

        let _chain = await this.db.models.Block.findAll({ include: this.db.models.Transaction })

        if (_chain.length == 0) throw Error("No such blocks")

        let ok = false

        for (let blk of _chain) {
            if (ok || blk.dataValues.hash === hash) {
                let txs: ITransaction[] = []

                for (let tx of blk.dataValues.Transactions) {
                    txs.push(tx.dataValues)
                }

                let b: IBlock = blk.dataValues
                b.data = txs
                chain.push(b)
            }
        }

        return chain
    }

    public async getTx(hash: string) {
        let _tx = await this.db.models.Transaction.findOne({
            where: {
                hash
            }
        })

        if (_tx) return <ITransaction>_tx.dataValues

        let tx: ITransaction | undefined = this.mempool.find(v => v.hash == hash)

        return tx
    }
}