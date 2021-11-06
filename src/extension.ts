import * as vscode from 'vscode';
import fs = require('fs');
import { bpfHoverProvider, bBpfHoverProvider } from './bpf-hover-provider';
import { BpfActionsProvider } from './bpf-actions-provider';
import { getBpfDiagnosticsHandler } from './bpf-diagnostics-handler';
import { bpfFormatter } from './bpf-formatter';
import { bBpfFormatter } from './bbpf-formatter';
import { convertToBBpf, annotatePrintableBytes } from './commands';


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
    context.subscriptions.push(vscode.languages.registerDocumentFormattingEditProvider('bbpf', bBpfFormatter));

    // Actions
    context.subscriptions.push(
        vscode.languages.registerCodeActionsProvider('bpf', new BpfActionsProvider())
    );

    // Commands
    context.subscriptions.push(
        vscode.commands.registerCommand('bpf.convertToBBpf', convertToBBpf),
        vscode.commands.registerCommand('bpf.annotatePrintableBytes', annotatePrintableBytes)
    );
}

// this method is called when your extension is deactivated
export function deactivate() { }
