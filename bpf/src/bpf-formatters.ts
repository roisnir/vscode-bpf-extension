import * as vscode from 'vscode';


export const bpfFormatter: vscode.DocumentFormattingEditProvider = {
    provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
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
};
