import * as I from '../declarations';

class UrlConstructor {
    id : string = "-url";
    make = (val : any) : URL => {
        var strVal = String(val);
        var httpMatch = /((^http:\/\/)|(^https:\/\/))/;

        var thisPlatform : I.platform;
        var thisUrltype : I.urltype;
    
        var urlID = this.urlIdentify(strVal);
        thisPlatform = urlID.platform;
        thisUrltype = urlID.urltype;

        if(!httpMatch.test(strVal)) {
            if(thisPlatform == "youtube") strVal = "https://" + strVal; 
            else strVal = "http://" + strVal;
        }

        return new URL({fullURL: strVal, platform: thisPlatform, urltype: thisUrltype});
    }

    urlIdentify(url : string) : {platform : I.platform, urltype : I.urltype} {
        var platform : I.platform = "other";
        var urltype : I.urltype = "other";
        var matchYoutube = /(?<=(^(((http)|https):\/\/)?(www\.)?(youtube\.com)\/))((watch(?=(\?v=.+)))|playlist(?=(\?list=.+)))/;
        if(matchYoutube.test(url)) {
            platform = "youtube";
            switch(url.match(matchYoutube)[0]) {
                case "watch":
                    urltype = "video";
                    break;
                case "playlist":
                    urltype = "playlist";
                    break;
                default:
                    urltype = "other";
            }
        }
        return {platform: platform,urltype: urltype};
    }
}

class URL implements I.Argument {
    id : string = "-url";
    fullURL : string
    urltype? : I.urltype
    platform : I.platform
    constructor(parsedURL : I.ParsedURL) {
        this.fullURL = parsedURL.fullURL;
        if(parsedURL.platform) this.platform = parsedURL.platform;
        if(parsedURL.urltype) this.urltype = parsedURL.urltype;
    }
}

export = {
    argConstr: new UrlConstructor(),
    arg: URL
}