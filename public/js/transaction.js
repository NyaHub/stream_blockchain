class Transaction {
    constructor(from, to, amount, data = "") {
        this.from = from;
        this.to = to;
        this.amount = amount;
        this.data = data;
        this.sign = "";
    }
    get hash() {
        return SHA256(JSON.stringify({
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