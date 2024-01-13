import { SHA256 } from "../utils";

export interface ITransaction {
    sign: string
    from: string
    to: string
    amount: number
    data: string
    timestamp: number
    seed: number,
    fee: number
}

export class Transaction {
    public sign: string = ""

    constructor(
        private _from: string,
        private _to: string,
        private _amount: number,
        public fee: number,
        private _data: string = "",
        private _timestamp: number = new Date().getTime(),
        private _seed: number = Math.floor(Math.random() * 999999999)
    ) { }

    static create(tx: ITransaction): Transaction {
        let tmp = new Transaction(
            tx.from,
            tx.to,
            tx.amount,
            tx.fee,
            tx.data,
            tx.seed
        )
        tmp.sign = tx.sign
        return tmp
    }

    get seed() {
        return this._seed
    }
    get from() {
        return this._from
    }
    get to() {
        return this._to
    }
    get amount() {
        return this._amount
    }
    get data() {
        return this._data
    }
    get timestamp() {
        return this._timestamp
    }

    get hash() {
        return SHA256(JSON.stringify({
            from: this.from,
            to: this.to,
            amount: this.amount,
            data: this.data,
            timestamp: this.timestamp
        }))
    }
    toString() {
        return this.hash
    }
}