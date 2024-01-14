export type Fun = (...args: any) => void

export class Event {
    private events: { [index: string]: Fun[] } = {}

    on(event: string, cb: Fun) {
        if (!this.events[event]) {
            this.events[event] = []
        }

        this.events[event].push(cb)
    }

    emit(event: string, ...args: any) {
        if (!this.events[event]) return
        for (let cb of this.events[event]) {
            cb(...args)
        }
    }
}