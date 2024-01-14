class Transaction {
    constructor(_from, _to, _amount, fee, _data = "", _timestamp = new Date().getTime(), _seed = Math.floor(Math.random() * 999999999)) {
        this.from = _from;
        this.to = _to;
        this.amount = _amount;
        this.fee = fee;
        this.data = _data;
        this.timestamp = _timestamp;
        this.seed = _seed;
        this.sign = "";
    }

    get hash() {
        return (0, utils_1.SHA256)(JSON.stringify({
            from: this.from,
            to: this.to,
            amount: this.amount,
            data: this.data,
            timestamp: this.timestamp
        }));
    }
    toString() {
        return this.hash;
    }
}
