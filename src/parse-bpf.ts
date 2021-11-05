import { AssertionError } from "assert";
import { assert } from "console";
import { ITokenWithLine, tokenizeCode } from "./textmate-grammer";

export interface IParenthesizedTokens extends Array<ITokenWithLine|IParenthesizedTokens> {};
export interface IParenthesizedPrimitive extends Array<ITokenWithLine|Primitive|IParenthesizedPrimitive> {};


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

const LOGICAL_OPERATOR_PREFIX = 'keyword.operator.bpf.logical';
const BINARY_LOGICAL_OPERATOR = LOGICAL_OPERATOR_PREFIX + '.binary';
const UNARY_LOGICAL_OPERATOR = LOGICAL_OPERATOR_PREFIX + '.unary';

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
            case 'meta.structure.bpf.punctuation.space':
                break;
            case 'meta.structure.bpf.punctuation.parentheses.open':
                let curParentheses: IParenthesizedPrimitive = [];
                curGroup.push(curParentheses);
                parenthesesStack.push(curParentheses);
                break;
            case 'meta.structure.bpf.punctuation.parentheses.close':
                if (parenthesesStack.length < 2){
                    throw new ParsingError('redundant closing parenthessis', token.lineNumber, token.startIndex);
                }
                parenthesesStack.pop();
                break;
            case UNARY_LOGICAL_OPERATOR:
            case BINARY_LOGICAL_OPERATOR:
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
