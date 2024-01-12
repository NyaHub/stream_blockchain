import { createHash } from "crypto";

export function SHA256(data: string) {
    const hash = createHash('SHA256')
    hash.update(data).end()
    return hash.digest('hex')
}

export function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}