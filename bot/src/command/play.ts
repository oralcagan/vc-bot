import { TextChannel, VoiceChannel } from 'discord.js';
import consts from '../constants';
import * as I from '../declarations';
import AudioHandler from '../handler/audio/audioHandler';
import AudioHandlerMap from '../util/audioHandlerMap';

class Play implements I.Command {
    id = 3
    role =  false
    usage = "!play -url <url>"
    exec = async (args: Map<string, I.Argument>, requiredRefs: I.RequiredCommandReferences): Promise<boolean> => {
        let gID: string;
        let vchannel: VoiceChannel;
        if (!requiredRefs.message) {
            gID = requiredRefs.guildMember.guild.id;
            vchannel = requiredRefs.guildMember.voice.channel;
        } else {
            gID = requiredRefs.message.guild.id;
            vchannel = requiredRefs.message.member.voice.channel;
        }

        let audioHandlerMap: AudioHandlerMap = requiredRefs.globalRefs.get(consts.VCHANNELS);
        let handler: AudioHandler

        if (audioHandlerMap.has(gID)) {
            handler = audioHandlerMap.get(gID);
        }
        else {
            let conn = await vchannel.join();
            handler = new AudioHandler(conn,(requiredRefs.message.channel as TextChannel),requiredRefs.globalRefs.get(consts.WS_CONNECTION));
            await handler.init();
        }

        let url = ((args.get("-url")) as unknown) as I.ParsedURL
        handler.queue.push({ path: url.fullURL, platform: "youtube", pathType: 1 });
        return true;
    }
}

export = new Play();