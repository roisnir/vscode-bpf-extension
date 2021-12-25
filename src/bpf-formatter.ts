import * as vscode from 'vscode';
import { IGrammar } from 'vscode-textmate';
import { IParenthesizedPrimitive, parseBpf, ParsingError } from './parse-bpf';
import { tryLoadGrammarSync, tokenizeCode } from './textmate-grammar';


function removeWhiteSpace(document: vscode.TextDocument): vscode.TextEdit[]{
    const edits: vscode.TextEdit[] = [];
    for (let i = 0; i < document.lineCount; i++) {
        const line = document.lineAt(i);
        // replace every space longer than 1, which is not at line start or end (they will be handled later), to 1 space.
        for (const m of line.text.matchAll(/(?<!^|\s+)(:? {2,}|\t+)(?!\s+|$)/g)) {
            const range = new vscode.Range(i, m.index!, i, m.index! + m[0].length);
            edits.push(vscode.TextEdit.replace(
                range, ' ')
            );
            console.log(`SPACE doc[${i}, ${m.index!}:${i}, ${m.index! + m[0].length}] '${document.getText(range)}' -> ' '`);
        }
        // replace line break and leading/trailing spaces to 1 space
        if (i < document.lineCount - 1) {
            const range = new vscode.Range(
                line.lineNumber, line.text.trimEnd().length,
                line.lineNumber + 1, document.lineAt(line.lineNumber + 1).firstNonWhitespaceCharacterIndex
            );
            edits.push(vscode.TextEdit.replace(range, ' '));
            console.log(`LINE doc[${line.lineNumber}, ${line.range.end.character}:${line.lineNumber + 1}, ${document.lineAt(line.lineNumber + 1).firstNonWhitespaceCharacterIndex}] '${document.getText(range).replace('\r', '\\r').replace('\n', '\\n')}' -> ' '`);
        }
    }
    return edits;
}

function formatBpf(parsedBpf: IParenthesizedPrimitive): vscode.TextEdit[] {
    const edits: vscode.TextEdit[] = [];
    for (const element of parsedBpf) {
        if ('scopes' in element){
            // TODO: finish
        }        
    }
    return edits;
}

export const bpfFormatter = {
    provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
        
        const grammar = tryLoadGrammarSync('source.bpf');
        if (grammar === null){
            return removeWhiteSpace(document);
        }
        try{
            // const parsedBpf = parseBpf([...tokenizeCode(document.getText(), grammar)]);
            // return formatBpf(parsedBpf);
            return removeWhiteSpace(document); // TODO: change to formatBpf when it's done
        } catch (e){
            if (e instanceof ParsingError){
                return removeWhiteSpace(document);
            }
            throw e;
        }
        
        
    }
};
