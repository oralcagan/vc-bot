import * as I from "./declarations";
import { GuildMember, Message } from 'discord.js';
import { replaceLastPath } from './util/other';
/**
 * Executes a command with given arguments
 */
export = class Executable {
    args: Map<string, I.Argument>
    cmd: I.Command
    requiredRefs: I.RequiredCommandReferences
    cmdPath: string

    constructor(args: Map<string, I.Argument>, cmd: I.Command, requiredRefs: I.RequiredCommandReferences, cmdPath: string) {
        this.args = args;
        this.cmd = cmd;
        this.requiredRefs = requiredRefs;
        this.cmdPath = cmdPath;
    }

    async exec() : Promise<boolean> {
        if(!this.cmd.role === false) {
            let role = this.requiredRefs.guildMember.roles.cache.find((role) => {
                if(this.cmd.role === role.name) return true;
            });
            if(!role) return false;
        }

        return (await this.cmd.exec(this.args, this.requiredRefs, this.cmdPath));
    }

    static fromMessage(parsedMessage: I.ParsedMessage, dcMessage: Message,
        pathMaps: { loadedCommandsPathMap: Map<string, I.Command>, loadedArgsPathMap: Map<string, I.ArgumentConstructor> },
        globalRef: Map<string, any>)
        : Executable {

        var commandPath = parsedMessage.commandAndGroup;
        var command = pathMaps.loadedCommandsPathMap.get(commandPath);

        if (!command) {
            commandPath = replaceLastPath(commandPath, "help");
            command = pathMaps.loadedCommandsPathMap.get(commandPath);
            if (!command) return new Executable(null, {role: false, usage: null, exec: () => unrecognizedCommandExec(null, { globalRefs: null, guildMember: null,message: dcMessage }), id: 0 }, null, "unknown-command");
            else {
                return this.fromMessage({ isACommand: true, commandAndGroup: commandPath, args: parsedMessage.args }, dcMessage,
                    { loadedCommandsPathMap: pathMaps.loadedCommandsPathMap, loadedArgsPathMap: pathMaps.loadedArgsPathMap }, globalRef);
            }
        } else {
            var argMap: Map<string, I.Argument> = new Map();
            for (var n = 0; n < parsedMessage.args.length; n++) {
                var argument = parsedMessage.args[n];
                var argConstructor = pathMaps.loadedArgsPathMap.get(argument.key);
                var arg = argConstructor.argConstr.make(argument.val);
                argMap.set(argConstructor.argConstr.id, arg);
            }
            return new Executable(argMap, command, { globalRefs: globalRef, message: dcMessage, guildMember: dcMessage.member }, commandPath);
        }
    }

    static fromSpeech(speech: I.SpeechRecognitionResponse, gMember: GuildMember,
        pathMaps: { loadedCommandsPathMap: (intent: string) => { cmd : false | I.Command, cmdPath : string}, loadedArgsPathMap: (entity: string) => I.ArgumentConstructor },
        globalRef: Map<string, any>)
        : Executable {

        var commandInfo = pathMaps.loadedCommandsPathMap(speech.intent);
        if (!commandInfo.cmd) return new Executable(null, {role: false, usage: null, exec: () => unrecognizedVoiceCommandExec(null, { globalRefs: null, guildMember: null }), id: 1 }, null, "unrecognized-voice");
        var argMap: Map<string, I.Argument> = new Map();

        for (var i = 0; i < speech.entities.length; i++) {
            var ent = speech.entities[i];
            var argConstructor = pathMaps.loadedArgsPathMap(ent.name);
            var arg = argConstructor.argConstr.make(ent.value);
            argMap.set(argConstructor.argConstr.id, arg);
        }
        return new Executable(argMap, commandInfo.cmd, { globalRefs: globalRef, guildMember: gMember }, commandInfo.cmdPath);
    }
}

async function unrecognizedCommandExec(_args: Map<string, I.Argument>, requiredRefs: I.RequiredCommandReferences): Promise<boolean> {
    await requiredRefs.message.reply("This is an unknown group or command, use 'help' command to see all commands and groups.");
    return true;
}

function unrecognizedVoiceCommandExec(_args: Map<string, I.Argument>, _requiredlRefs: I.RequiredCommandReferences): Promise<boolean> {
    return new Promise(async (resolve) => {

        resolve(true);
    });
}