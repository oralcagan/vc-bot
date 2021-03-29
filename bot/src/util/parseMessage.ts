import * as I from '../declarations';

/**
 * Checks if a message is a command or not, if it's a command, parseMessage
 * parses it into a group,command and an array of arguments.
 * @param prefixes An array of prefixes to match.
 * @param clientUser User instance of the client.
 * @param message The message to parse
 */
export default function parseMessage(prefixes: string[], message: string): I.ParsedMessage {
    if (prefixes.length === 0) return { isACommand: false }
    var prefixLength = matchPrefix(buildPrefixRegex(prefixes), message);
    if (prefixLength === 0) return { isACommand: false }

    var restOfMessage = message.slice(prefixLength);
    var temp = pullCommandAndGroup(restOfMessage);

    var argMap = pullArgs(temp.restOfMessage);

    return {isACommand: true,args: argMap,commandAndGroup: temp.commandAndGroup};
}


///TODO: CHANGE THIS
/**
 * Turns an array of prefixes into a regular expression to match characters in a string.
 * @param prefixes An array of prefixes to match.
 */
function buildPrefixRegex(prefixes: string[]): RegExp {
    var regExpString = "^(";
    for (var i = 0; i < prefixes.length; i++) {
        var prefix = prefixes[i];
        if (i === prefixes.length - 1) {
            regExpString += prefix + ")";
        } else {
            regExpString += prefix + "|";
        }
    }
    return new RegExp(regExpString);
}

/**
 * Matches a prefix, returns the length of the prefix.
 * @param prefixRegExp
 * @param message
 */
function matchPrefix(prefixRegExp: RegExp, message: string): number {
    var match = message.match(prefixRegExp);
    if (match) {
        return match[0].length;
    } else {
        return 0;
    }
}

/**
 * Pulls out the group and the name of the command specified in the message, returns the rest of the message.
 * @param slicedMessage The message without the matched prefix
 */
function pullCommandAndGroup(slicedMessage: string): I.PullCommandAndGroupResult {
    var splitMessage = slicedMessage.split(" ");
    return { commandAndGroup: splitMessage[0],restOfMessage: slicedMessage.slice(splitMessage[0].length) };
}

/**
 * Puts the arguments into a map, where the key is the name of the argument and the value is the value of the argument.
 * @param slicedMessage The part of the message that only contains the arguments
 */
function pullArgs(slicedMessage: string): I.ArgumentPair[] {
    var matchArgs = new RegExp(/(?<=\s)-\S+\s+/g);
    var matches = Array.from(slicedMessage.matchAll(matchArgs));

    var args: I.CapturedArgument[] = new Array(matches.length);
    var argPairs: I.ArgumentPair[] = new Array(args.length);

    for (var i = 0; i < matches.length; i++) {
        var match = matches[i];
        var thisArg = { index: match.index, lastIndex: match.index + match[0].length, value: match[0].trim()};
        args[i] = thisArg;
        
        if (i !== 0) {
            var lastArg = args[i - 1];
            var value = slicedMessage.slice(lastArg.lastIndex, thisArg.index - 1);
            argPairs[i] = generateArgPair(lastArg.value, value);
        }
        if (i + 1 === matches.length) argPairs[i] = generateArgPair(thisArg.value, slicedMessage.slice(thisArg.lastIndex, slicedMessage.length + 1));
    }

    return argPairs;
}

function generateArgPair(key: string, value: string) : I.ArgumentPair {
    return {
        key: key,
        val: value
    }
}