PetiteVue.createApp({
    sendTx(e) {
        // let tx = {
        //     sign,
        //     from,
        //     to,
        //     amount,
        //     data,
        // }
        // axios({
        //     method: "get",
        //     body: {
        //         tx
        //     }
        // })

        let user = new User()
    }
}).mount()

function buf2hex(buffer) { // buffer is an ArrayBuffer
    return [...new Uint8Array(buffer)]
        .map(x => x.toString(16).padStart(2, '0'))
        .join('');
}
/*
Convert an ArrayBuffer into a string
from https://developer.chrome.com/blog/how-to-convert-arraybuffer-to-and-from-string/
*/
function ab2str(buf) {
    return String.fromCharCode.apply(null, new Uint8Array(buf));
}

/*
Export the given key and write it into the "exported-key" space.
*/

async function exportKeys(keyPair, type = "pem") {
    let private = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
    let public = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);

    if (type == "raw") {
        return {
            public,
            private
        }
    } else if (type == "pem") {
        private = ab2str(private);
        private = window.btoa(private);
        private = `-----BEGIN PRIVATE KEY-----\n${private}\n-----END PRIVATE KEY-----`;

        public = ab2str(public);
        public = window.btoa(public);
        public = `-----BEGIN PUBLIC KEY-----\n${public}\n-----END PUBLIC KEY-----`;
    } else if (type == "hex") {
        private = buf2hex(private);
        public = buf2hex(public);
    }

    return {
        public,
        private
    }
}

class User {

    addr = ""
    keypair = {}

    constructor() {
        this.generateKeys()

        // this.keypair = {
        //     public: keypair.publicKey.toString(),
        //     private: keypair.privateKey.toString()
        // }

        // this.addr = this.generateAddress()
    }

    async generateKeys() {
        this.keypair = await crypto.subtle.generateKey(
            {
                name: "RSA-PSS",
                // Consider using a 4096-bit key for systems that require long-term security
                modulusLength: 2048,
                publicExponent: new Uint8Array([1, 0, 1]),
                hash: "SHA-256",
            },
            true,
            ["sign", "verify"])

        let pk = await exportKeys(this.keypair, "hex")
        this.addr = this.generateAddress(pk)
        console.log(this)

    }

    // get balance() {
    //     return this.chain.getBalance(this.addr)
    // }

    generateAddress(pk) {

        let tmpb = ArrayBuffer.from(pk, "hex")
        let a = tmpb.slice(0, tmpb.length / 2)
        let b = tmpb.slice(tmpb.length / 2, tmpb.length)
        tmpb = ArrayBuffer.from(a.map((v, i) => v ^ b[i]))

        for (let i = 0; i < 2; i++) {
            a = tmpb.slice(0, tmpb.length / 2)
            b = tmpb.slice(tmpb.length / 2, tmpb.length)
            tmpb = ArrayBuffer.from(a.map((v, i) => v ^ b[i]))
        }

        return tmpb.toString("hex")
    }

    // sing(data) {
    //     let sing = createSign("SHA256")
    //     sing.update(data.toString())
    //     return sing.sign(this.keypair.private).toString("hex")
    // }

    // sendMoney(to, amount) {
    //     if (amount > this.balance) {
    //         throw Error("amount > balnce")
    //     }
    //     let tx = new Transaction(this.addr, to, amount)
    //     tx.sign = this.sing(tx)

    //     this.chain.addTx(tx, this.keypair.public)
    // }
}