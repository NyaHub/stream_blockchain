"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const minimist_1 = __importDefault(require("minimist"));
const bockchain_1 = require("./libs/bockchain");
const user_1 = require("./libs/user");
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const node_path_1 = __importDefault(require("node:path"));
const transaction_1 = require("./libs/transaction");
let args = (0, minimist_1.default)(process.argv.slice(2));
let chain = new bockchain_1.Blockchain();
let ailce = new user_1.User(chain);
let bob = new user_1.User(chain);
chain.addBlock(bob.addr);
// console.log(`bob: ${bob.balance}, alice: ${ailce.balance}`)
chain.addBlock(bob.addr);
// console.log(`bob: ${bob.balance}, alice: ${ailce.balance}`)
bob.sendMoney(ailce.addr, 20);
chain.addBlock(bob.addr);
function miner() {
    chain.addBlock(bob.addr);
    setTimeout(miner, 5000);
}
// for (let blk of chain.chain) {
//     console.log(blk.toString("\t"))
// }
console.log(`bob: ${bob.balance.balance}, alice: ${ailce.balance.balance}`);
const app = (0, express_1.default)();
app.use(body_parser_1.default.json());
app.use(express_1.default.static(node_path_1.default.join(process.cwd(), "public")));
const port = args.port || 8080;
app.use((req, res, next) => {
    res.setHeader("Content-Type", "application/json");
    next();
});
app.get("/blockchain/", (req, res) => {
    res.send({
        status: 0,
        data: chain.toObj()
    });
});
app.get("/users/", (req, res) => {
    res.send({
        status: 0,
        data: chain.users
    });
});
app.post("/getmoney/", (req, res) => {
    let data = req.body;
    if (!data.data.addres) {
        res.sendStatus(404);
        res.send({
            status: 1,
            error: "Not sent addres!"
        });
    }
    bob.sendMoney(data.data.addres, 10);
    res.send({
        status: 0,
        data: chain.getBalance(data.data.addres)
    });
});
app.post("/send/", (req, res) => {
    let data = req.body;
    console.log(data.data.tx);
    try {
        let intx = data.data.tx;
        let tx = new transaction_1.Transaction(intx.from, intx.to, intx.amount);
        tx.sign = intx.sign;
        chain.addTx(tx, data.data.pk);
        res.send({
            status: 0,
            data: ""
        });
    }
    catch (e) {
        let msg = "";
        if (typeof e === "string") {
            msg = e.toUpperCase(); // works, `e` narrowed to string
        }
        else if (e instanceof Error) {
            msg = e.message; // works, `e` narrowed to Error
        }
        res.send({
            status: 1,
            data: msg
        });
    }
});
app.post("/balance/", (req, res) => {
    let data = req.body;
    if (!data.data.addres) {
        res.sendStatus(404);
        res.send({
            status: 1,
            error: "Not sent addres!"
        });
    }
    res.send({
        status: 0,
        data: chain.getBalance(data.data.addres)
    });
});
app.listen(port, () => {
    console.log("listening on ");
    miner();
});
