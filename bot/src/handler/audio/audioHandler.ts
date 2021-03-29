import {VoiceConnection, TextChannel} from 'discord.js';
import InputHandler from './inputHandler';
import OutputHandler from './outputHandler';
import STTConn from '../../websocket/connection';
import MusicQueue from './musicQueue';

export = class AudioHandler {
    conn : VoiceConnection
    inputHandler: InputHandler
    outputHandler : OutputHandler
    sttConn : STTConn
    callerTextChannel : TextChannel
    queue : MusicQueue

    constructor(conn : VoiceConnection,callerTextChannel : TextChannel,sttConn : STTConn) {
        this.conn = conn;
        this.sttConn = sttConn;
        this.callerTextChannel = callerTextChannel;
    }

    async init() {
        this.outputHandler = new OutputHandler(this.conn);
        this.queue = new MusicQueue(this.outputHandler,this.callerTextChannel);
        this.queue.init();
        this.inputHandler = new InputHandler(this.conn,this.callerTextChannel,this.sttConn);
    }

    checkActivity() : boolean {
        if(this.conn.channel) {
            if(this.conn.channel.members.size == 1) return false;
            else return true;
        } else return false;
    }
}