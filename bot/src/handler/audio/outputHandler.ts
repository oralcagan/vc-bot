import { VoiceConnection } from 'discord.js';
import { Readable } from 'stream';
import fs from 'fs';
import ytdl from 'ytdl-core-discord';
import opusEncode from './opusEncode';
import * as I from '../../declarations'

class OutputHandler {
    private conn: VoiceConnection
    private currentStream: Readable
    pausedStream: boolean = false;
    playing = false

    constructor(conn: VoiceConnection) {
        this.conn = conn;
    }

    destroy() {
        if (this.conn.dispatcher) {
            this.conn.dispatcher.destroy();
        }
        if (this.currentStream) {
            this.currentStream.destroy();
        }
    }

    play(playable: I.Playable): Promise<boolean> {
        return new Promise(async (res, rej) => {
            if (this.playing) {
                rej(false);
                return;
            }

            this.currentStream = await this.makeStreamFromPlayable(playable);
            this.playing = true;
            this.conn.play(this.currentStream, { volume: false, type: "opus" });
            this.conn.dispatcher.once('close', () => {
                this.playing = false;
                res(true);
            });
        });
    }

    clear() {
        if (this.conn.dispatcher) this.conn.dispatcher.destroy();
        this.currentStream.destroy();
    }

    pause() {
        if (this.conn.dispatcher) {
            this.conn.dispatcher.pause(false);
        }
    }

    resume() {
        if (this.conn.dispatcher) {
            this.conn.dispatcher.resume();
        }
    }

    async makeStreamFromPlayable(playable: I.Playable): Promise<Readable> {
        if (playable.pathType === 1 && playable.platform === "youtube") {
            let stream = await ytdl(playable.path);
            return stream;
        }
    }
}

export = OutputHandler;