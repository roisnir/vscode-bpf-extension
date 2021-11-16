import { AssertionError } from "assert";
import { last } from "./utils";
import { ITokenWithLine, tokenizeCode } from "./textmate-grammar";
import BPFScopes from "./bpf-scopes";
export interface IParenthesizedTokens extends Array<ITokenWithLine|IParenthesizedTokens> {};
export interface IParenthesizedPrimitive extends Array<ITokenWithLine|Primitive|IParenthesizedPrimitive> {};

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
export class Primitive{
    tokens: ITokenWithLine[];
    constructor(tokens: ITokenWithLine[]){
        this.tokens = tokens;
    }

    public push(token:ITokenWithLine) {
        this.tokens.push(token);
    }
}


export function parseBpf(codeTokens: ITokenWithLine[]): IParenthesizedPrimitive{
    const parenthesesStack: IParenthesizedPrimitive[] = [[]];
    let token;
    for (token of codeTokens) {
        let curGroup = last(parenthesesStack);
        switch (last(token.scopes)) {
            case BPFScopes.space:
                break;
            case BPFScopes.parenthesesOpen:
                let curParentheses: IParenthesizedPrimitive = [];
                curGroup.push(curParentheses);
                parenthesesStack.push(curParentheses);
                break;
            case BPFScopes.parenthesesClose:
                if (parenthesesStack.length < 2){
                    throw new ParsingError('redundant closing parenthessis', token.lineNumber, token.startIndex);
                }
                parenthesesStack.pop();
                break;
            case BPFScopes.binaryLogicalOperator:
            case BPFScopes.unaryLogicalOperator:
                curGroup.push(token);
                break;
            default:
                if (!(curGroup.length > 0 && last(curGroup) instanceof Primitive)){
                    curGroup.push(new Primitive([]));
                }
                const curPrimitive = last(curGroup);
                if (curPrimitive instanceof Primitive){
                    curPrimitive.push(token);
                } else {
                    throw new AssertionError({
                    message: "unexpected type",
                    actual: curPrimitive,
                    expected: Primitive
                    });
                }
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
