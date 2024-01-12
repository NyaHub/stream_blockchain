import { SHA256 } from "../utils";

export class Transaction {
    public sign: string;
    public seed: number = Math.floor(Math.random() * 999999999)
    constructor(
        public from: string,
        public to: string,
        public amount: number,
        public data: string = "",
        public timestamp: number = new Date().getTime()
    ) {
        this.sign = ""
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