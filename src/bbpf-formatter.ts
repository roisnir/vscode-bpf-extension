import * as vscode from 'vscode';
import { Range, Position } from 'vscode';
import { last } from "./utils";
import { IParenthesizedPrimitive, parseBpf, ParsingError, Primitive } from './parse-bpf';
import { tryLoadGrammarSync, tokenizeCode, ITokenWithLine } from './textmate-grammar';
import BPFScopes from './bpf-scopes';

class TextEditCollection extends Array<vscode.TextEdit> {
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
    const edits: TextEditCollection = new TextEditCollection();
    let curElement: undefined | ITokenWithLine = undefined;
    let allowLineBreaks = true;
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
        if (curScope === BPFScopes.lineCommentDDash && nextScope === BPFScopes.lineComment){
            replaceGap(curElement, nextElement, '');
        } else if (nextScope === BPFScopes.parenthesesClose) {
            if (allowLineBreaks) {
                indentationLevel--;
                replaceGap(curElement, nextElement, '\r\n' + '  '.repeat(indentationLevel));
            } else {
                replaceGap(curElement, nextElement, '');
            }
        } else if (curScope === BPFScopes.lineComment || curScope === BPFScopes.lineCommentDDash) {
            replaceGap(curElement, nextElement, '\r\n' + '  '.repeat(indentationLevel));
        } else if (nextScope === BPFScopes.lineCommentDDash) {
            replaceGap(curElement, nextElement, '  ');
        } else if (curScope === BPFScopes.binaryLogicalOperator) {
            allowLineBreaks = true;
            replaceGap(curElement, nextElement, '\r\n' + '  '.repeat(indentationLevel));
        } else if (curScope === BPFScopes.parenthesesOpen) {
            if (allowLineBreaks) {
                indentationLevel++;
                replaceGap(curElement, nextElement, '\r\n' + '  '.repeat(indentationLevel));
            } else {
                replaceGap(curElement, nextElement, '');
            }
        } else if (curScope === BPFScopes.parenthesesClose) {
            replaceGap(curElement, nextElement, ' ');
        } else if (curScope === BPFScopes.blockCommentStart || curScope === BPFScopes.blockCommentEnd ||
            nextScope === BPFScopes.blockCommentStart || nextScope === BPFScopes.blockCommentEnd || 
            (curScope === BPFScopes.blockComment && nextScope === BPFScopes.blockComment)) {
                replaceGap(curElement, nextElement, '\r\n' + '  '.repeat(indentationLevel));
        } else {
            if (
                (curScope.startsWith(BPFScopes.operatorPrefix) && !curScope.startsWith(BPFScopes.logicalOperatorPrefix)) ||
                (nextScope.startsWith(BPFScopes.operatorPrefix) && !nextScope.startsWith(BPFScopes.logicalOperatorPrefix)) ||
                curScope.startsWith(BPFScopes.slicePrefix) ||
                nextScope.startsWith(BPFScopes.slicePrefix)
    
            ) {
                allowLineBreaks = false;
            }
            replaceGap(curElement, nextElement, ' ');
        }
        curElement = nextElement;
    }
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
