import { GuildMember, Message } from 'discord.js';

export type platform = "youtube"|"other"
export type urltype = "video"|"playlist"|"other";

export interface Playable {
    /**
     * 0 -> local path
     * 
     * 1 -> external
     */
    pathType: 0|1
    path: string
    /**
     * If the path is external...
     */
    platform?: "youtube"|false
}

export interface SpeechRecognitionResponse {
    id: string
    catchword: boolean
    intent?: string
    entities?: { name: string, value: string }[]
    confident : boolean
}

export interface WSRequestInfo {
    member : GuildMember
}

export interface ParsedURL {
    fullURL : string
    urltype? : urltype
    platform?: platform
}

export interface Command {
    exec: (args: Map<string, Argument>, optionalRefs: RequiredCommandReferences, thisPath: string) => Promise<boolean>
    id: number
    usage: string
    role : string|boolean
}

export interface Argument {
    id: string
}

export interface ArgumentConstructor {
    argConstr: {
        make: (val: any) => Argument
        id: string
    }
    arg: Argument
}

export interface RequiredCommandReferences {
    globalRefs: Map<string, any>
    guildMember: GuildMember
    message?: Message
}

export interface Config {
    firestore: {
        collectionPath: string
    },
    cache: {
        ttl: number
    }
}

export interface ParsedMessage {
    isACommand: boolean
    commandAndGroup?: string
    args?: ArgumentPair[]
}

export interface ArgumentPair {
    key: string
    val: string
}

export interface CapturedArgument {
    value: string
    index: number
    lastIndex: number
}

export interface PullCommandAndGroupResult {
    commandAndGroup: string
    restOfMessage: string
}

export interface CommandModel {
    roles_any: boolean
    roles: string[]
}

export interface CommandGroupModel {
    group_name: string
    roles_any: boolean
    roles: string[]
}

export interface ServerDoc {
    docid: string
    sid: string
    prefixes: string[]
    commands: CommandModel[]
    groups: Map<string, CommandGroupModel>
}

export interface RequestQuery {
    /**
     * ID of a specific Discord server
     */
    sid: string
}
/**
 * Changes, but partial
 */
export interface ParitalChanges {
    sid: string
    prefixes: string[]
}

export interface CachedData {
    /**
     * A timestamp showing when the cached data can be erased.
     */
    death: number,
    /**
     * Cached data.
     */
    data: any
}

export interface AudioHandler {
    checkActivity : () => boolean
}