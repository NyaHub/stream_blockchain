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
// for (let blk of chain.chain) {
//     console.log(blk.toString("\t"))
// }
// console.log(`bob: ${bob.balance}, alice: ${ailce.balance}`)
const app = (0, express_1.default)();
app.use(body_parser_1.default.json());
app.use(express_1.default.static(node_path_1.default.join(process.cwd(), "public")));
const port = args.port || 8080;
app.get("/blockchain/", (req, res) => {
    res.send(chain.toObj());
});
app.post("/send/", (req, res) => {
    let tx = req.body.tx; // Transaction
    // req.body.key // public key
    // chain.addTx()
    console.log(tx);
});
app.listen(port, () => {
    console.log("listening on ");
});
