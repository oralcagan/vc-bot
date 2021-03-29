import { TextChannel } from 'discord.js';
import * as I from '../../declarations'
import OutputHandler from "./outputHandler";

export default class MusicQueue {
    intervalID : number
    outputHandler : OutputHandler
    queue : I.Playable[] = []
    callerTextChannel : TextChannel
    waiting = false;
    currentMusic : I.Playable
    constructor(outputHandler : OutputHandler, callerTextChannel : TextChannel) {
        this.outputHandler = outputHandler;
        this.callerTextChannel = callerTextChannel;
    }

    init() {
        this.intervalID = setInterval(() => {
            if(this.queue.length > 0) {
                clearInterval(this.intervalID);
                this.next();
            }
        });
    }

    async next() {
        if(this.waiting) return;
        if(this.queue.length > 0) {
            this.waiting = true;
            this.currentMusic= this.queue[0];
            this.queue = this.queue.slice(1);
            await this.callerTextChannel.send("Playing: " + this.currentMusic.path);

            this.outputHandler.play(this.currentMusic).then(() => {
                this.waiting = false;
                this.next();
            });
        }
    }

    push(playable : I.Playable) {
        this.queue.push(playable);
        this.next();
    }
}