import * as I from '../declarations';
import {walkDir} from './walkDir';

export function getCommandFromIntent(commandMap : Map<string,I.Command>,intentToCommand : object) : (intent : string) => {cmd : false|I.Command, cmdPath: string} {
    return (intent: string) : {cmd : false|I.Command, cmdPath: string} => {
        var voiceCommand = intentToCommand[intent];
        if(!voiceCommand) return {cmd : false, cmdPath: ""};
        return {cmd: commandMap.get(voiceCommand), cmdPath: voiceCommand};
    }
}

export async function loadCommands() : Promise<Map<string,I.Command>> {
    var commandMap = new Map();
    var commands = walkDir('./command','./');
     for(var i = 0; i < commands.length; i++) { 
          var command = commands[i];
          commandMap.set(command,await import("../command/" +  command));
     }
     return commandMap;
}