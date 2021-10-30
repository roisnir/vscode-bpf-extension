import * as vscode from 'vscode';


export class BpfActionsProvider implements vscode.CodeActionProvider {
	provideCodeActions(document: vscode.TextDocument, range: vscode.Range | vscode.Selection, context: vscode.CodeActionContext, token: vscode.CancellationToken): vscode.ProviderResult<(vscode.CodeAction | vscode.Command)[]> {
		// for each diagnostic entry that has the matching `code`, create a code action command
		return context.diagnostics
			.filter(diagnostic => diagnostic.code === 'bpf-invalid-syntax-basic')
			.map(diagnostic => this.createConvertToBBpfAction(diagnostic));
	}

	private createConvertToBBpfAction(diagnostic: vscode.Diagnostic): vscode.CodeAction {
		const action = new vscode.CodeAction(`Convert to bBPF file`, vscode.CodeActionKind.QuickFix);
		action.diagnostics = [diagnostic];
		action.isPreferred = true;
		let filePath = vscode.window.activeTextEditor?.document.fileName;
		filePath = filePath!.substr(0, filePath!.lastIndexOf('.')) + ".bbpf";
		action.command = {
			command: 'bpf.convertToBbpf',
			title: 'Conver To bBPF file',
			tooltip: `This will create a new file named ${filePath}`,
			arguments: [filePath]
		};
		return action;
	}
}