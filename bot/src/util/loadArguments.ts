import * as I from '../declarations';
import {walkDir} from './walkDir';

export function getArgumentFromEntityFunction(argMap : Map<string,I.ArgumentConstructor>, entityToArgument : object) : (entity : string) => I.ArgumentConstructor|false {
    return (entity: string) : I.ArgumentConstructor|false => {
        var voiceEnt = entityToArgument[entity];
        if(!voiceEnt) return false;
        return argMap.get(voiceEnt);
    }
}

export async function loadArguments() : Promise<Map<string,I.ArgumentConstructor>> {
    var argumentMap = new Map();
    var args = walkDir('./argument/','./');
     for(var i = 0; i < args.length; i++) { 
          var arg = args[i];
          var argConstructor : I.ArgumentConstructor = await import("../argument/" + arg);
          argumentMap.set(argConstructor.argConstr.id,argConstructor);
     }
     return argumentMap;
}