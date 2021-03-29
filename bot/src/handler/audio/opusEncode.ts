import { Readable } from "stream";
import prism from 'prism-media';

export = function encodeOpus(inputStream : Readable) : Readable {
    const transcoder = new prism.FFmpeg({
        args: [
            '-reconnect', '1',
            '-reconnect_streamed', '1',
            '-reconnect_delay_max', '5',
            '-analyzeduration', '0',
            '-loglevel', '0',
            '-f', 's16le',
            '-ar', '48000',
            '-ac', '2',
        ],
    });
    const opus = new prism.opus.Encoder({ rate: 48000, channels: 2, frameSize: 960 });
    return inputStream.pipe(transcoder).pipe(opus);
}