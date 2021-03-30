import * as I from '../../declarations';

class Say implements I.Command {
    id = 2
    role = false
    thisPath : string
    usage = "Bot echoes the text you input.\nUsage: ![PATH] -text <TEXT>";
    exec = async (args: Map<string, I.Argument>, requiredRefs: I.RequiredCommandReferences, thisPath : string) : Promise<boolean> => {
        var text = args.get("-text") as any;
        //Do this in executable module
        if(!text) requiredRefs.message.reply("You probably used this command wrong, here's the usage:\n\n" + this.usage.replace('[PATH]',thisPath));
        else requiredRefs.message.channel.send(text.val);
        return true;
    }
}

export = new Say();