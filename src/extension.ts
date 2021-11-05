import * as vscode from 'vscode';
import fs = require('fs');
import { bpfHoverProvider, bBpfHoverProvider } from './bpf-hover-provider';
import { BpfActionsProvider } from './bpf-actions-provider';
import { getBpfDiagnosticsHandler } from './bpf-diagnostics-handler';
import { bpfFormatter } from './bpf-formatters';


// Initiate extension's elements and register disposables to `context.subscriptions`
export async function activate(context: vscode.ExtensionContext) {
    // Hovers
    context.subscriptions.push(
        vscode.languages.registerHoverProvider('bpf', bpfHoverProvider),
        vscode.languages.registerHoverProvider('bbpf', bBpfHoverProvider)
    );
    // Diagnostincs
    const diagnosticCollection = vscode.languages.createDiagnosticCollection("bpf");
    const bpfDiagnosticsHandler = await getBpfDiagnosticsHandler(diagnosticCollection);
    context.subscriptions.push(
        diagnosticCollection,
        vscode.workspace.onDidOpenTextDocument(doc => bpfDiagnosticsHandler(doc)),
        vscode.workspace.onDidChangeTextDocument(e => bpfDiagnosticsHandler(e.document))
    );
    if (vscode.window.activeTextEditor) {
        await bpfDiagnosticsHandler(vscode.window.activeTextEditor.document);
    }

    // Formatter
    context.subscriptions.push(vscode.languages.registerDocumentFormattingEditProvider('bpf', bpfFormatter));

    // Actions
    context.subscriptions.push(
        vscode.languages.registerCodeActionsProvider('bpf', new BpfActionsProvider())
    );

    // Commands
    context.subscriptions.push(
        vscode.commands.registerCommand('bpf.convertToBBpf', async (newFilePath: string) => {
            if (!vscode.window.activeTextEditor) {
                return;
            }
            if (vscode.window.activeTextEditor.document.languageId !== 'bpf'){
                vscode.window.showErrorMessage(`Can't Convert ${vscode.window.activeTextEditor.document.languageId} documemt to bBPF`);
                return;
            }
            const curDoc = vscode.window.activeTextEditor.document;
            curDoc.save();
            const text = "/*\r\nThis is a new bBPF file.\r\nbBPF supports a richer syntax than regular BPF.\r\nIt is reccomended to write a short description of you filter here.\r\n*/\r\n\r\n" + curDoc.getText();
            fs.writeFileSync(newFilePath, text);
            await vscode.window.showTextDocument(vscode.Uri.file(newFilePath));
        })
    );
}

// this method is called when your extension is deactivated
export function deactivate() { }
