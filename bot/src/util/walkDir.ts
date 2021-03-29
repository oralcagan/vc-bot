import * as fs from 'fs';
import * as path from 'path';

/**
 * Walks dirToWalk, outputs an array of paths of files in dirToWalk relative to the fromRequest.
 * @param fromRequest Path of the file that called this command, relative to this file .
 * @param dirToWalk Path of the directory to walk, relative to fromRequest.
 */
export function walkDir(fromRequest: string, dirToWalk: string) {
    var absolutePathToDirToWalk = path.resolve(path.join(fromRequest,dirToWalk));
    return recursiveWalk(absolutePathToDirToWalk,fromRequest);
}

function recursiveWalk(dirpath: string,requesterPath : string ): string[] {
    var dirents: fs.Dirent[];
    try {
        dirents = fs.readdirSync(dirpath, { withFileTypes: true });
    } catch (err) {
        console.log(err);
        return [];
    }

    var fileLocs: string[] = new Array();
    var dirLocs: string[] = new Array();
    for (var i = 0; i < dirents.length; i++) {
        var dirent = dirents[i];
        if (dirent.isFile()) {
            fileLocs.push(
                path.relative(path.resolve(requesterPath),path.join(dirpath, dirent.name))
                .replace(/\\/g, '/')
                //.ts added for testing purposes.
                .replace(/(\.ts|\.js)/, ''));
        } else if(dirent.isDirectory()) {
            dirLocs.push(dirent.name);
        }
    }

    var concatenatedArray: string[] = new Array(0);
    if (dirLocs.length !== 0) {
        var subFiles: string[][] = new Array(dirLocs.length);

        for (var n = 0; n < dirLocs.length; n++) {
            var subDirPath = dirLocs[n];
            var nextDirPath = path.join(dirpath, subDirPath);
            subFiles[n] = recursiveWalk(nextDirPath,requesterPath);
        }

        var mergedArrays = subFiles.flat();
        concatenatedArray = concatenatedArray.concat(fileLocs, mergedArrays);
        return concatenatedArray;
    } else return fileLocs;
}