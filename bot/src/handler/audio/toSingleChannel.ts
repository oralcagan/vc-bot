import { Readable } from "stream"
import ffmpeg from 'fluent-ffmpeg'

export = function toSingleChannel(rStream : Readable) : ffmpeg.FfmpegCommand {
    return ffmpeg()
    .input(rStream)
    .addInputOption('-f s16le')
    .addInputOption('-ac 2')
    .addInputOption( '-ar 48000')
    .addOutputOption('-f s16le')
    .addOutputOption('-ac 1')
    .addOutputOption('-ar 48000')
}