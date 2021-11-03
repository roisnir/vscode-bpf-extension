import { ITokenWithLine, tokenizeCode } from "./textmate-grammer";

export interface IParenthesizedTokens extends Array<ITokenWithLine|IParenthesizedTokens> {};


const last = <T>(a: T[])=>a[a.length-1];
export class ParsingError implements Error {
    name: string = 'CodeSyntaxError';
    message: string;
    lineNumber: number;
    columnNumber: number;
    constructor(message: string, lineNumber: number, columnNumber: number){
        this.message = message;
        this.lineNumber = lineNumber;
        this.columnNumber = columnNumber;
    }
    
};

export function parseParentheses(codeTokens: ITokenWithLine[]): IParenthesizedTokens{
    const parenthesesStack: IParenthesizedTokens[] = [[]];
    let token;
    for (token of codeTokens) {
        switch (last(token.scopes)) {
            case 'meta.structure.bpf.punctuation.space':
                break;
            case 'meta.structure.bpf.punctuation.parentheses.open':
                let curParentheses: IParenthesizedTokens = [];
                last(parenthesesStack).push(curParentheses);
                parenthesesStack.push(curParentheses);
                break;
            case 'meta.structure.bpf.punctuation.parentheses.close':
                if (parenthesesStack.length < 2){
                    throw new ParsingError('redundant closing parenthessis', token.lineNumber, token.startIndex);
                }
                parenthesesStack.pop();
                break;
            default:
                last(parenthesesStack).push(token);
                break;
        }
    }
    if (parenthesesStack.length > 1){
        if (token === undefined){
            throw new Error("unexpected undifined `token` in parentheses parse");
        }
        throw new ParsingError("expected ')' closing parenthessis", token.lineNumber, token.startIndex);
    }
    return parenthesesStack[0];
}

export class Primitive{
    tokens: ITokenWithLine[];
    constructor(tokens: ITokenWithLine[]){
        this.tokens = tokens;
    }
}


export function parseExpressions(codeTokens: IParenthesizedTokens){
    const newCodeTokens = [];
    
    let primitiveTokens: ITokenWithLine[] = [];
    for (const element of codeTokens) {
        if (element instanceof Array){
            newCodeTokens.push(parseExpressions(element));
        } else {
            const tokenScope = last(element.scopes);
            if (tokenScope.startsWith('keyword.operator.bpf.logical')){
                if (primitiveTokens.length > 0){
                    newCodeTokens.push(new Primitive(primitiveTokens));
                    primitiveTokens = [];
                }
                newCodeTokens.push(element);
            } else {
                primitiveTokens.push(element);
            }
        }
    }
    if (primitiveTokens.length > 0){
        newCodeTokens.push(new Primitive(primitiveTokens));
    }
}