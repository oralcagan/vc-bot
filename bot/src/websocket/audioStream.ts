import * as stream from 'stream';
import STTConn from './connection';

/**
 * catchword 0 - 00000000
 * 
 * stt 4 - 00000100
*/
type wsRequestType = 0|4;
/**start 1 - 00000001
 * 
 * continue 2 - 0000010
 *
 * end 3 - 00000011
 */
type wsReqStatus = 1|2|3;

export = class WebSocketAudioStream extends stream.Writable {
    uID : Buffer
    id : Buffer;
    socket : STTConn;
    reqType : wsRequestType;
    reqStatus : wsReqStatus;
    res : Promise<boolean>;
    requestEndInformer : (value : any) => void;
    constructor(uID : string,reqID : number,socket : STTConn, reqType : wsRequestType, res? : Promise<boolean>) {
        super();
        this.socket = socket;

        this.uID = Buffer.alloc(18,0x00);
        this.uID.write(uID,"utf8");

        this.id = Buffer.alloc(8,0x00);
        this.id.writeBigUInt64LE(BigInt(reqID));

        this.reqType = reqType;
        this.reqStatus = 1;
        
        this.res = res;

        this.destroy = () => {
            var buf = this.generateHeader(true);
            this.socket.send(buf);
        }
    }

    private generateHeader(end : boolean) : Buffer {
        if(end) this.reqStatus = 3;
        var statusAndType = Buffer.alloc(1,this.reqStatus|this.reqType);
        var concatBuf : Buffer[] = [this.id,this.uID,statusAndType];
        if(this.reqStatus === 1) this.reqStatus = 2;
        return Buffer.concat(concatBuf);
    }

    _write(chunk : Buffer,enc : string, next : (err? : any) => void) {
        var arrBuf = [this.generateHeader(false),chunk];
        var buf = Buffer.concat(arrBuf);

        this.socket.send(buf);
        next();
    }

    awaitRequestEnd() : Promise<boolean> {
        return new Promise((res,rej) => {
            this.once('finish', () => res(true));
        });
    }
}