import * as dc from 'discord.js'
import * as arg from './util/loadArguments';
import * as cmd from './util/loadCommands';
import * as I from './declarations';
import consts from './constants';
import Executable from './executable';
import parseMessage from './util/parseMessage';
import STTConn from './websocket/connection';
import AudioHandlerMap from './util/audioHandlerMap';

export default class Client {
    client: dc.Client = new dc.Client();
    isLoggedIn: boolean = false;
    globalRef: Map<string, any> = new Map();
    sttConn: STTConn
    /**
     * Listens for events
     * @param config Client configuration file config.json
     */
    listen() {
        this.client.on('message', this.onMessage.bind(this));
    }

    async onMessage(message: dc.Message) {
        var parsedMessage = parseMessage(["!"], message.content);
        if (!parsedMessage.isACommand) return;
        var pathMap = { loadedCommandsPathMap: this.globalRef.get(consts.COMMAND_MAP), loadedArgsPathMap: this.globalRef.get(consts.ARGUMENT_MAP) };
        var executable = Executable.fromMessage(parsedMessage, message, pathMap, this.globalRef);

        await executable.exec();
    }

    voiceCommandCallerClosure() {
        let self = this;
        return async function (reqInfo: I.WSRequestInfo, speechres: I.SpeechRecognitionResponse) {
            var pathMap = { loadedCommandsPathMap: self.globalRef.get(consts.INT_TO_COMMAND), loadedArgsPathMap: self.globalRef.get(consts.ENT_TO_ARG) }
            var executable = Executable.fromSpeech(speechres, reqInfo.member, pathMap, self.globalRef);

            await executable.exec();
        }
    }

    /**
     * Initializes the client
     */
    async init(): Promise<boolean> {
        try {
            var argMap = await arg.loadArguments();
            this.globalRef.set(consts.ARGUMENT_MAP, argMap);
            var entToArgFunc = arg.getArgumentFromEntityFunction(argMap, consts.entityToArgument);
            this.globalRef.set(consts.ENT_TO_ARG, entToArgFunc);

            var cmdMap = await cmd.loadCommands();
            this.globalRef.set(consts.COMMAND_MAP, cmdMap);
            var intentToCmdFunc = cmd.getCommandFromIntent(cmdMap, consts.intentToCommand);
            this.globalRef.set(consts.INT_TO_COMMAND, intentToCmdFunc);

            this.sttConn = new STTConn(process.env["VC_SERVER"],this.voiceCommandCallerClosure());
            await this.awaitSocketReadyEvent();
            this.globalRef.set(consts.WS_CONNECTION, this.sttConn);

            let audioHandlerMap = new AudioHandlerMap(60);
            audioHandlerMap.init();
            this.globalRef.set(consts.VCHANNELS, audioHandlerMap);

            await this.client.login(process.env["BOT_TOKEN"]);
            this.listen();
            return true;
        } catch (err) {
            console.log(err);
            return false;
        }
    }
    private awaitSocketReadyEvent(): Promise<boolean> {
        return new Promise((res) => {
            this.sttConn.once('open', () => res(true))
        });
    }

    private wait(ms : number) {
        return new Promise(res => {
            setTimeout(() => res(true),ms);
        });
    }
}