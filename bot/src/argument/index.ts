import * as I from '../declarations';

class IndexConstructor{
    id = "-i"
    make = (val : any) : Index  => {
        var strVal = String(val);
        if(/\D/.test(strVal)) return new Index(-1);
        else {
            var numVal = parseInt(strVal);
            if(typeof numVal !== "number") return new Index(-1);
            else return new Index(numVal);
        }
    }
}

class Index implements I.Argument {
    id = "-i"
    index : number
    constructor(index : number) {
        this.index = index;
    }
}

export = {
    argConstr: new IndexConstructor(),
    arg: Index
}