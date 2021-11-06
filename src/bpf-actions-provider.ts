import * as vscode from 'vscode';
import {CodeAction, Command} from 'vscode';


export class BpfActionsProvider implements vscode.CodeActionProvider {
	provideCodeActions(document: vscode.TextDocument, range: vscode.Range | vscode.Selection, context: vscode.CodeActionContext, token: vscode.CancellationToken): vscode.ProviderResult<(vscode.CodeAction | vscode.Command)[]> {
		// for each diagnostic entry that has the matching `code`, create a code action command
		const actions: (CodeAction|Command)[] = [];
		context.diagnostics
			.filter(diagnostic => diagnostic.code === 'bpf-invalid-syntax-linebreak')
			.map(diagnostic => actions.push(...this.createInvalidSynctaxActions(diagnostic)));
		return actions;
	}

	private createInvalidSynctaxActions(diagnostic: vscode.Diagnostic): vscode.CodeAction[] {
		const convertAction = new vscode.CodeAction(`Convert to bBPF file`, vscode.CodeActionKind.QuickFix);
		convertAction.diagnostics = [diagnostic];
		convertAction.isPreferred = true;
		convertAction.command = {
			command: 'bpf.convertToBBpf',
			title: 'Convert To bBPF file',
			tooltip: `This will create a new file`
		};
		const formatAction = new vscode.CodeAction(`Format document`, vscode.CodeActionKind.QuickFix);
		formatAction.diagnostics = [diagnostic];
		formatAction.isPreferred = false;
		formatAction.command = {
			command: 'editor.action.formatDocument',
			title: 'Format document'
		};
		return [convertAction, formatAction];
	}
}