import { GuildMember, User, VoiceConnection } from "discord.js"
import WebSocketAudioStream from "../../websocket/audioStream"
import STTConn from "../../websocket/connection"
import toSingleChannel from "./toSingleChannel"

export = class RecievedVoiceHandler {
    member: GuildMember
    sttConn: STTConn
    clientVoiceConn: VoiceConnection
    handleCommandEnd: () => boolean
    handleCatchphrase: () => boolean
    informUser : (text : string) => Promise<void>
    constructor(member: GuildMember, sttConn: STTConn, clientVoiceConn: VoiceConnection, handleCommandEnd: () => boolean, handleCatchphrase: () => boolean, informUser : (text : string) => Promise<void>) {
        this.member = member;
        this.sttConn = sttConn;
        this.clientVoiceConn = clientVoiceConn;
        this.handleCatchphrase = handleCatchphrase;
        this.handleCommandEnd = handleCommandEnd;
        this.informUser = informUser;
    }

    init() {
        this.listenForCatchphrase();
    }

    listenUser(listenForCatchphrase: boolean): WebSocketAudioStream {
        let rStream = this.clientVoiceConn.receiver.createStream(this.member.user, { mode: "pcm" });
        let wStream = this.sttConn.createWriteStream(listenForCatchphrase, { member: this.member });
        toSingleChannel(rStream).pipe(wStream);
        return wStream;
    }

    listenForCatchphrase() {
        if(this.member.voice.channel) {
            let wStream = this.listenUser(true);
            wStream.res.then(this.onCatchphrase.bind(this));
        }
    }

    async onCatchphrase(isCatchphrase: boolean) {
        if (isCatchphrase) {
            if (this.handleCatchphrase()) {
                let wStream = this.listenUser(false);
                await this.informUser("Detected catchphrase, <@" + this.member.user + ">");
                wStream.awaitRequestEnd().then(async () => {
                    await this.handleCommandEnd();
                    await this.informUser("Detected command, <@" + this.member.user + ">");
                    this.listenForCatchphrase.bind(this)();
                })
                return;
            }
        }
        this.listenForCatchphrase.bind(this)();
    }
}