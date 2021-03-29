import AudioHandler from "../handler/audio/audioHandler";

export default class AudioHandlerMap extends Map<string, AudioHandler> {
    checkMapInterval: number
    constructor(checkMapInterval: number) {
        super();
        this.checkMapInterval = checkMapInterval*1000;
    }

    init() {
        setInterval(this.checkMap.bind(this), this.checkMapInterval);
    }

    checkMap() {
        this.forEach((val: AudioHandler, key: string) => {
            if (!val.checkActivity()) {
                val.conn.disconnect();
                this.delete(key);
            }
        });
    }
}