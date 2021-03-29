import { TextChannel } from 'discord.js';
import consts from '../constants';
import * as I from '../declarations';
import AudioHandler from '../handler/audio/audioHandler';
import AudioHandlerMap from '../util/audioHandlerMap';

class Listen implements I.Command {
    id = 4
    role = "vc"
    usage = "yeet"
    exec = async (args: Map<string, I.Argument>, requiredRefs : I.RequiredCommandReferences) : Promise<boolean> => {
        let audioHandlerMap : AudioHandlerMap = requiredRefs.globalRefs.get(consts.VCHANNELS);
        if(audioHandlerMap.has(requiredRefs.message.guild.id)) {
            let handler = audioHandlerMap.get(requiredRefs.message.guild.id);
            handler.inputHandler.addMember(requiredRefs.guildMember);
        }
        else {
            let conn = await requiredRefs.message.member.voice.channel.join();
            let handler = new AudioHandler(conn,requiredRefs.message.channel as TextChannel,requiredRefs.globalRefs.get(consts.WS_CONNECTION));
            await handler.init();
            audioHandlerMap.set(requiredRefs.message.guild.id,handler);

            handler.inputHandler.addMember(requiredRefs.guildMember);
        }

        await requiredRefs.message.channel.send("Listening, " + "<@" + requiredRefs.message.member.id + ">");
        return true;
    }
}

export = new Listen();