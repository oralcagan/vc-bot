import * as I from '../declarations';

class TextConstructor {
    id = "-text"
    make = (val : any) : Text => {
        var strVal = String(val);
        if(typeof strVal != "string") return new Text("");
        else return new Text(strVal);
    }
}

class Text implements I.Argument {
    id = "-text"
    val : string;
    constructor(val : string) {
        this.val = val;
    }
}
export = {
    argConstr: new TextConstructor(),
    arg: Text
}