import WebSocket from 'ws';
import WebSocketAudioStream from './audioStream';
import * as I from '../declarations';

class STTConn extends WebSocket {
    promiseRegister : Map<string,{timeoutID : NodeJS.Timeout, res: (value : any) => void}> = new Map();
    requestInfo : Map<string,I.WSRequestInfo> = new Map();
    onVoiceCommand : (reqInfo: I.WSRequestInfo, speechres: I.SpeechRecognitionResponse) => Promise<void>
    constructor(remoteAddr : string, onVoiceCommand : (reqInfo: I.WSRequestInfo, speechres: I.SpeechRecognitionResponse) => Promise<void>) {
        super('ws://' + remoteAddr);
        this.on('message', this.handleMessage);
        this.onVoiceCommand = onVoiceCommand;
    }

    private promisifyWebSocket(timeout : number, id : number,requestEndWaiter : Promise<boolean>) : Promise<any> {
        return new Promise(async (res,rej) => {
            await requestEndWaiter;
            let timeoutID = setTimeout(() => rej('timeout'),timeout);
            this.promiseRegister.set(id.toString(),{res: res,timeoutID: timeoutID});
        });
    }

    createWriteStream(isCatchWordReq : boolean, requestInfo : I.WSRequestInfo) : WebSocketAudioStream {
        if(isCatchWordReq) {
            let now = Date.now();
            let audioStream = new WebSocketAudioStream(requestInfo.member.user.id,now,this,0);
            let res = this.promisifyWebSocket(10000,now,audioStream.awaitRequestEnd());
            audioStream.res = res;
            return audioStream;
        } else {
            let now = Date.now();
            let audioStream = new WebSocketAudioStream(requestInfo.member.user.id,now,this,4);
            let res = this.promisifyWebSocket(10000,now,audioStream.awaitRequestEnd());
            this.requestInfo.set(now.toString(),requestInfo);
            audioStream.res = res;
            return audioStream;
        }
    }

    handleMessage(msg : any) {
        let parsedMsg : I.SpeechRecognitionResponse;
        try {
            parsedMsg = JSON.parse(msg);
        } catch(err) {
            return;
        }

        if(parsedMsg.catchword === true)  {
            let wsRequest = this.promiseRegister.get(parsedMsg.id);
            if(wsRequest) {
                clearTimeout(wsRequest.timeoutID);
                wsRequest.res(parsedMsg.catchword);
                this.promiseRegister.delete(parsedMsg.id);
            }
        } else {
            let wsRequest = this.promiseRegister.get(parsedMsg.id);
            if(wsRequest) {
                clearTimeout(wsRequest.timeoutID);
                wsRequest.res(false)
                this.promiseRegister.delete(parsedMsg.id);
                if(parsedMsg.intent != "") {
                    this.onVoiceCommand(this.requestInfo.get(parsedMsg.id),parsedMsg);
                    this.requestInfo.delete(parsedMsg.id);
                }
            }
        }
    }
}

export = STTConn;