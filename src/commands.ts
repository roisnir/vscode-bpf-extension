import * as vscode from 'vscode';
import fs = require('fs');
import { tokenizeCode, tokenizeCodeLines, tryLoadGrammarSync } from './textmate-grammer';
import { last } from './utils';
import BPFScopes from './bpf-scopes';


export async function convertToBBpfCommand(newFilePath?: string) {
    if (!vscode.window.activeTextEditor) {
        return;
    }
    if (vscode.window.activeTextEditor.document.languageId !== 'bpf') {
        vscode.window.showErrorMessage(`Can't Convert ${vscode.window.activeTextEditor.document.languageId} documemt to bBPF`);
        return;
    }
    if (newFilePath === undefined) {
        const filePath = vscode.window.activeTextEditor.document.fileName;
        newFilePath = filePath!.substring(0, filePath!.lastIndexOf('.')) + ".bbpf";
    }
    if (fs.existsSync(newFilePath)) {
        if (await vscode.window.showWarningMessage(
            `a file in path ${newFilePath} already exists. override?`,
            'yes', 'no'
        ) === 'no') {
            return;
        }
    }
    const curDoc = vscode.window.activeTextEditor.document;
    await vscode.commands.executeCommand('editor.action.formatDocument');
    curDoc.save();
    const text = "/*\r\nThis is a new bBPF file.\r\nbBPF supports a richer syntax than regular BPF.\r\nIt is reccomended to write a short description of you filter here.\r\n*/\r\n\r\n" + curDoc.getText();
    fs.writeFileSync(newFilePath, text);
    await vscode.window.showTextDocument(vscode.Uri.file(newFilePath));
    await vscode.commands.executeCommand('editor.action.formatDocument');
    await vscode.commands.executeCommand('bpf.annotatePrintableBytes');
};

export async function convertToBpfCommand(newFilePath?: string) {
    if (!vscode.window.activeTextEditor) {
        return;
    }
    if (vscode.window.activeTextEditor.document.languageId !== 'bbpf') {
        vscode.window.showErrorMessage(`Can't Convert ${vscode.window.activeTextEditor.document.languageId} documemt to BPF`);
        return;
    }
    if (newFilePath === undefined) {
        const filePath = vscode.window.activeTextEditor.document.fileName;
        newFilePath = filePath!.substr(0, filePath!.lastIndexOf('.')) + ".bpf";
    }
    const curDoc = vscode.window.activeTextEditor.document;
    curDoc.save();
    if (fs.existsSync(newFilePath) &&
        fs.statSync(curDoc.uri.fsPath).mtimeMs < fs.statSync(newFilePath).mtimeMs) {
        if (await vscode.window.showWarningMessage(
            `${newFilePath} has changed later than ${curDoc.uri.fsPath}. override?`,
            'yes', 'no'
        ) === 'no') {
            return;
        }
    }
    curDoc.save();
    fs.writeFileSync(newFilePath, minifyBbpf(curDoc.getText()));
    await vscode.window.showTextDocument(vscode.Uri.file(newFilePath));
    await vscode.commands.executeCommand('editor.action.formatDocument');
};
export function minifyBbpf(bbpfString: string): string {
    const grammar = tryLoadGrammarSync('source.bbpf');
    if (grammar === null) {
        throw new Error("unexpected exception while loading bbpf grammar");
    }
    let lines = Array(...tokenizeCodeLines(bbpfString, grammar));
    for (const i in lines) {
        let startIndex = 0;
        while ( startIndex < lines[i].length &&
            (
                last(lines[i][startIndex].scopes).startsWith(BPFScopes.commentPrefix) ||
                last(lines[i][startIndex].scopes).startsWith(BPFScopes.space)
            )) {
            startIndex++;
        }
        let endIndex = lines[i].length;
        while (endIndex >= startIndex &&
            (
                last(lines[i][endIndex - 1].scopes).startsWith(BPFScopes.commentPrefix) ||
                last(lines[i][endIndex - 1].scopes).startsWith(BPFScopes.space)
            )) {
            endIndex--;
        }
        lines[i] = lines[i].slice(startIndex, endIndex);
    }
    lines = lines.filter((line) => line.length > 0);
    return lines.map((line) =>
        line.map((token) => token.text).join('')
    ).join(' ');
}

export async function annotatePrintableBytes() {
    if (!vscode.window.activeTextEditor) {
        return;
    }
    if (vscode.window.activeTextEditor.document.languageId !== 'bbpf') {
        return;
    }
    const grammar = tryLoadGrammarSync('source.bbpf');
    if (grammar === null) {
        vscode.window.showErrorMessage("unexpected exception while loading bbpf grammar");
        return [];
    }
    const curDoc = vscode.window.activeTextEditor.document;
    vscode.window.activeTextEditor.edit((editor) => {
        const tokens = [...tokenizeCodeLines(curDoc.getText(), grammar)];
        for (const line of tokens) {
            const hexValues = line.filter((token) => last(token.scopes) === BPFScopes.numericHex);
            const lastToken = last(line);
            if (hexValues.length > 0 && !last(lastToken.scopes).startsWith(BPFScopes.lineComment)) {
                editor.insert(
                    new vscode.Position(lastToken.lineNumber, lastToken.endIndex), '  // '
                );
            } else {
                editor.insert(
                    new vscode.Position(lastToken.lineNumber, lastToken.endIndex), ' '
                );
            }
            for (const value of hexValues) {
                const valueStr = Buffer.from(value.text.substr(2), 'hex').toString();
                if (/[\x00-\x1F]/.test(valueStr)) {
                    continue;
                }
                editor.insert(
                    new vscode.Position(lastToken.lineNumber, lastToken.endIndex), `${value.text}: '${valueStr}' `
                );
            }
        }
    });
};