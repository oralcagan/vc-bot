import { Collection, GuildMember, TextChannel, VoiceConnection } from 'discord.js';
import RecievedVoiceHandler from './recievedVoiceHandler';
import STTConn from '../../websocket/connection';

class InputHandler {
    private conn: VoiceConnection
    private connectedMembers: Collection<string, RecievedVoiceHandler> = new Collection();
    messageChannel : TextChannel
    private isBeingUsed = false;
    private sttConn : STTConn
    constructor(conn: VoiceConnection, messageChannel : TextChannel, sttConn: STTConn) {
        this.conn = conn;
        this.messageChannel = messageChannel;
        this.sttConn = sttConn;
    }

    addMember(member : GuildMember) {
        let recievedVoiceHandler = new RecievedVoiceHandler(member,this.sttConn, this.conn,this.makeCommandEndHandler(),this.makeCatchphraseHandler(),this.makeInformUser());
        this.connectedMembers.set(member.id,recievedVoiceHandler)
        recievedVoiceHandler.init();
    }

    removeMember(member: GuildMember) {
        if (this.connectedMembers.has(member.id)) {
            this.connectedMembers.delete(member.id);
        }
    }

    makeCatchphraseHandler() : () => boolean {
        let self = this;
        return function() {
            if(self.isBeingUsed) return false;
            else {
                self.isBeingUsed = true;
                return true;
            }
        }
    }

    makeInformUser() : (text : string) => Promise<void> {
        let self = this;
        return async function (text : string) {
            await self.messageChannel.send(text);   
        }
    }

    makeCommandEndHandler() : () => boolean {
        let self = this;
        return function() : boolean {
            self.isBeingUsed = false;
            return true;
        }
    }
}

export = InputHandler;