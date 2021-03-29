export function replaceLastPath(path : string, replacement : string) {
    var slashMatcher = /\//;
    if(!slashMatcher.test(path)) return replacement;
    var lastPathMatcher = /((?<=\/)\w*$)/;
    return path.replace(lastPathMatcher,replacement);
}