import * as vscode from 'vscode';
import { Range, Position } from 'vscode';
import { last } from "./utils";
import { IParenthesizedPrimitive, parseBpf, ParsingError, Primitive } from './parse-bpf';
import { tryLoadGrammarSync, tokenizeCode, ITokenWithLine } from './textmate-grammer';
import BPFScopes from './bpf-scopes';

class TextEditCollenction extends Array<vscode.TextEdit> {
    private validateRange(range: Range) {
        return range.start.line < range.end.line ||
            (range.start.line === range.end.line && range.start.character < range.end.character);
    }
    /**
     * pushDelete
     */
    public pushDelete(range: Range, force: boolean = false): boolean {
        if (force || this.validateRange(range)) {
            this.push(vscode.TextEdit.delete(range));
            console.log(`>>> deleting ${range.start.line}:${range.start.character} -> ${range.end.line}:${range.end.character}`);
            return true;
        }
        return false;
    }
    /**
     * pushReplace
     */
    public pushReplace(range: Range, replacement: string, force: boolean = false): boolean {
        if (force || this.validateRange(range)) {
            console.log(`>>> replacing ${range.start.line}:${range.start.character} -> ${range.end.line}:${range.end.character} to '${replacement}''`);
            this.push(vscode.TextEdit.replace(range, replacement));
            return true;
        }
        return false;
    }
    /**
     * pushInsert
     */
    public pushInsert(position: Position, text: string): boolean {
        console.log(`>>> inserting to ${position.line}:${position.character} string '${text}''`);
        this.push(vscode.TextEdit.insert(position, text));
        return true;
    }
}


function getBBpfEdits(tokens: ITokenWithLine[], indentationLevel: number = 0): vscode.TextEdit[] {
    const edits: TextEditCollenction = new TextEditCollenction();
    let curElement: undefined | ITokenWithLine = undefined;

    for (const nextElement of tokens) {
        const nextScope = last(nextElement.scopes);
        if (nextScope === BPFScopes.space) {
            continue;
        }
        if (curElement === undefined) {
            edits.pushDelete(new Range(
                0, 0,
                nextElement.lineNumber, nextElement.startIndex)
            );
            curElement = nextElement;
            continue;
        }
        const curScope = last(curElement.scopes);
        if (curScope === BPFScopes.binaryLogicalOperator) {
            replaceGap(curElement, nextElement, '\r\n' + '  '.repeat(indentationLevel));
        } else if (curScope === BPFScopes.parenthesesOpen) {
            indentationLevel++;
            replaceGap(curElement, nextElement, '\r\n' + '  '.repeat(indentationLevel));
        } else if (nextScope === BPFScopes.parenthesesClose) {
            indentationLevel--;
            replaceGap(curElement, nextElement, '\r\n' + '  '.repeat(indentationLevel));
        } else if (curScope === BPFScopes.parenthesesClose) {
            replaceGap(curElement, nextElement, ' ');
        } else if (
            (curScope.startsWith(BPFScopes.operatorPrefix) && !curScope.startsWith(BPFScopes.logicalOeratorPrefix)) ||
            (nextScope.startsWith(BPFScopes.operatorPrefix) && !nextScope.startsWith(BPFScopes.logicalOeratorPrefix)) ||
            curScope.startsWith(BPFScopes.slicePrefix) ||
            nextScope.startsWith(BPFScopes.slicePrefix)

        ) {
            replaceGap(curElement, nextElement, '');
        } else {
            replaceGap(curElement, nextElement, ' ');
        }
        curElement = nextElement;
    }

    // for (let i = 0; i < tokens.length; i++) {
    //     if (i > 0){
    //         previousElement = tokens[i - 1];
    //     }
    //     const element = tokens[i];
    //     if (previousElement === undefined){
    //         const range = new vscode.Range(
    //             0, 0,
    //             element.lineNumber, element.startIndex);
    //         edits.push(vscode.TextEdit.delete(range));
    //     }
    //     switch (last(token.scopes)) {
    //         case 'meta.structure.bpf.punctuation.space':
    //             break;
    //         case 'meta.structure.bpf.punctuation.parentheses.open':
    //             let curParentheses: IParenthesizedPrimitive = [];
    //             curGroup.push(curParentheses);
    //             parenthesesStack.push(curParentheses);
    //             break;
    //         case 'meta.structure.bpf.punctuation.parentheses.close':
    //             if (parenthesesStack.length < 2){
    //                 throw new ParsingError('redundant closing parenthessis', token.lineNumber, token.startIndex);
    //             }
    //             parenthesesStack.pop();
    //             break;
    //         case UNARY_LOGICAL_OPERATOR:
    //         case BINARY_LOGICAL_OPERATOR:
    //             curGroup.push(token);
    //             break;
    //         default:
    //             if (!(curGroup.length > 0 && last(curGroup) instanceof Primitive)){
    //                 curGroup.push(new Primitive([]));
    //             }
    //             const curPrimitive = last(curGroup);
    //             if (curPrimitive instanceof Primitive){
    //                 curPrimitive.push(token);
    //             } else {
    //                 throw new AssertionError({
    //                 message: "unexpected type",
    //                 actual: curPrimitive,
    //                 expected: Primitive
    //                 });
    //             }
    //             break;
    //     }
    // }
    return edits;

    function replaceGap(curElement: ITokenWithLine, nextElement: ITokenWithLine, replacement: string | null) {
        console.log(`putting '${replacement?.replace('\r', '\\r').replace('\n', '\\n')}' between '${curElement.text}' and '${nextElement.text}'`);
        
        if (replacement === null || replacement.length === 0) {
            edits.pushDelete(
                new Range(
                    curElement.lineNumber, curElement.endIndex,
                    nextElement.lineNumber, nextElement.startIndex
                ));
            return;
        }
        if (curElement.lineNumber === nextElement.lineNumber && curElement.endIndex === nextElement.startIndex){
            edits.pushInsert(new Position(curElement.lineNumber, curElement.endIndex), replacement);
            return;
        }
        edits.pushReplace(
            new Range(
                curElement.lineNumber, curElement.endIndex,
                nextElement.lineNumber, nextElement.startIndex
            ),
            replacement
        );
    }
}

export const bBpfFormatter = {
    provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
        const grammar = tryLoadGrammarSync('source.bbpf');
        if (grammar === null) {
            vscode.window.showErrorMessage("unexpected exception while loading bbpf grammar");
            return [];
        }
        try {
            return getBBpfEdits([...tokenizeCode(document.getText(), grammar)]);
        } catch (e) {
            if (e instanceof ParsingError) {
                vscode.window.showErrorMessage("can't format document due to syntax errors");
                return [];
            }
            throw e;
        }


    }
};
