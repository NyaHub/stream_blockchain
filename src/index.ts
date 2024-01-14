import minimist from "minimist";
import { Blockchain } from "./libs/bockchain";
import { User } from "./libs/user";
import experss from "express"
import bodyParser from "body-parser";
import path from "node:path";
import { ITransaction, Transaction } from "./libs/transaction";
import { Event } from "./libs/event";
import { Miner } from "./libs/miner";
import { Block, IBlock } from "./libs/block";
import axios from "axios";

let args = minimist(process.argv.slice(2))

const NODE_HOST = "localhost"

let event = new Event()

let chain = new Blockchain(event)

let ailce = new User(chain)
let bob = new User(chain)

let miner = new Miner(event, chain, bob)

interface IData {
    status: number, // 0 - ok, 1 - any error
    error?: any,
    data: any
}

async function requestChain(hash: string) {
    try {
        let req = await axios.post(`http://${NODE_HOST}:${args.node}/request_chain/`, {
            status: 0,
            data: { hash }
        })

        if (req.data.data) {
            let data: IData = req.data
            let blocks: IBlock[] = data.data
            event.emit("answerChain", blocks)
        }
    } catch (error) {

    }

}
async function requestTx(hash: string) {
    try {
        let req = await axios.post(`http://${NODE_HOST}:${args.node}/request_tx/`, {
            status: 0,
            data: { hash }
        })

        if (req.data.data) {
            let data: IData = req.data
            let tx: ITransaction[] = data.data.tx
            event.emit("answerTx", tx)
        }
    } catch (error) {

    }

}

async function anonceBlock(hash: string) {
    try {
        let req = await axios.post(`http://${NODE_HOST}:${args.node}/anonce_block`, {
            status: 0,
            data: { hash }
        })
    } catch (e) {

    }

}
async function anonceTx(hash: string) {
    try {
        let req = await axios.post(`http://${NODE_HOST}:${args.node}/anonce_tx`, {
            status: 0,
            data: { hash }
        })
    } catch (error) {

    }

}

event.on("requectChain", requestChain)
event.on("requectTx", requestTx)
event.on("anonceBlock", anonceBlock)
event.on("anonceTx", anonceTx)

const app = experss()
app.use(bodyParser.json())
app.use(experss.static(path.join(process.cwd(), "public")))

const port = args.port || 8080

app.use((req, res, next) => {
    res.setHeader("Content-Type", "application/json")
    next()
})

app.get("/blockchain/", async (req, res) => {
    res.send({
        status: 0,
        data: await chain.toObj()
    })
})

app.get("/users/", (req, res) => {
    res.send({
        status: 0,
        data: chain.users
    })
})

app.post("/getmoney/", (req, res) => {
    let data: IData = req.body
    if (!data.data.addres) {
        res.sendStatus(404)
        res.send({
            status: 1,
            error: "Not sent addres!"
        })
    }

    bob.sendMoney(data.data.addres, 10)

    res.send({
        status: 0,
        data: chain.getBalance(data.data.addres)
    })
})

app.post("/send/", (req, res) => {
    let data: IData = req.body
    console.log(data.data.tx)

    try {
        let intx = data.data.tx
        let tx = new Transaction(intx.from, intx.to, intx.amount, intx.fee)
        tx.sign = intx.sign
        chain.addTx(tx, data.data.pk)
        res.send({
            status: 0,
            data: ""
        })
    } catch (e) {
        let msg: string = ""
        if (typeof e === "string") {
            msg = e.toUpperCase() // works, `e` narrowed to string
        } else if (e instanceof Error) {
            msg = e.message // works, `e` narrowed to Error
        }
        res.send({
            status: 1,
            data: msg
        })
    }
})

app.post("/balance/", (req, res) => {
    let data: IData = req.body
    if (!data.data.addres) {
        res.sendStatus(404)
        res.send({
            status: 1,
            error: "Not sent addres!"
        })
    }

    res.send({
        status: 0,
        data: chain.getBalance(data.data.addres)
    })
})

/*

{
    status: ??
    data: {
        hash - hash of anonced block
    }
}

*/
app.post("/anonce_block/", async (req, res) => {
    let data: IData = req.body
    console.log(data)
    if (await chain.checkNetBlock(data.data.hash)) {
        event.emit("requestChain", data.data.hash)
    }

    res.end()
})


/*

{
    status: ??
    data: {
        hash - hash of anonced tx
    }
}

*/
app.post("/anonce_tx/", async (req, res) => {
    let data: IData = req.body
    console.log(data)
    if (await chain.checkNetTx(data.data.hash)) {
        event.emit("requestTx", data.data.hash)
    }

    res.end()
})

app.post("/request_chain/", async (req, res) => {
    res.send({
        status: 0,
        data: await chain.getChain(req.body.data.hash)
    })
})
app.post("/request_tx/", async (req, res) => {
    res.send({
        status: 0,
        data: await chain.getTx(req.body.data.hash)
    })
})


async function start() {
    miner.pow()
    await app.listen(port)
    console.log("listening on ")
    chain.getChain("00b205891055e955587dce89bd2ea087d1156a6f770204aade10f33a7a4826d0")
}
chain.init(start)

