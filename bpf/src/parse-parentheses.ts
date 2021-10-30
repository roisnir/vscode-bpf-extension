import { ITokenWithLine } from "./textmate-grammer";

export interface IParenthesizedTokens extends Array<ITokenWithLine|IParenthesizedTokens> {};

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
    const last = <T>(a: T[])=>a[a.length-1];
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