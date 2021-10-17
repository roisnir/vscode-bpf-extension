// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import fs = require('fs');


class BpfConverter implements vscode.CodeActionProvider {
    provideCodeActions(document: vscode.TextDocument, range: vscode.Range | vscode.Selection, context: vscode.CodeActionContext, token: vscode.CancellationToken): vscode.ProviderResult<(vscode.CodeAction | vscode.Command)[]> {
        // for each diagnostic entry that has the matching `code`, create a code action command
        return context.diagnostics
            .filter(diagnostic => diagnostic.code === 'bpf-invalid-syntax-basic')
            .map(diagnostic => this.createCommandCodeAction(diagnostic));
    }

    private createCommandCodeAction(diagnostic: vscode.Diagnostic): vscode.CodeAction {
        const action = new vscode.CodeAction(`Convert to bBPF file`, vscode.CodeActionKind.QuickFix);
        action.diagnostics = [ diagnostic ];
        action.isPreferred = true;
		let filePath = vscode.window.activeTextEditor?.document.fileName;
		filePath = filePath!.substr(0, filePath!.lastIndexOf('.')) + ".bbpf";
        action.command = {
            command: 'bpf.convertToBbpf',
            title: 'Conver To bBPF file',
            tooltip: `This will create a new file named ${filePath}`,
            arguments: [ filePath ]
        };
        return action;
    }
}



// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
	vscode.languages.registerHoverProvider('javascript', {
		provideHover(document, position, token) {
		  return new vscode.Hover('I am a hover!');
		}
	  });


	  const diagnosticCollection = vscode.languages.createDiagnosticCollection("bpf");
	  const handler = async (doc: vscode.TextDocument) => {
		  if (doc.languageId !== 'bpf'){
		    return;
	      }	
		  let lines = doc.getText().split(/(\r\n|\n)/);
		  if (lines.length === 1) {
			  return;
		  }
		  const diagnosticts = new Array<vscode.Diagnostic>();
		  const line = lines[2];
				diagnosticts.push(
					{
						"severity": vscode.DiagnosticSeverity.Warning,
						"message": "BPF syntax doesn't support line breaks.",
						"code": "bpf-invalid-syntax-basic",
						"source": "",
						"range": new vscode.Range(
							new vscode.Position(0, 0),
							new vscode.Position(1, line.length - 1)
						)
					}
				  );
		//   for (let lineIndex = 1; lineIndex <= lines.length; lineIndex++) {
		// 	if (lineIndex >= 1) {
		// 		const line = lines[lineIndex - 1];
		// 		diagnosticts.push(
		// 			{
		// 				"severity": vscode.DiagnosticSeverity.Warning,
		// 				"message": "BPF syntax doesn't support line breaks.",
		// 				"code": "bpf-invalid-syntax-basic",
		// 				"source": "",
		// 				"range": new vscode.Range(
		// 					new vscode.Position(lineIndex - 1, 0),
		// 					new vscode.Position(lineIndex, line.length - 1)
		// 				)
		// 			}
		// 		  );
		// 	}
		//   }
		  diagnosticCollection.set(doc.uri, diagnosticts);
	};

	const didOpen = vscode.workspace.onDidOpenTextDocument(doc => handler(doc));
	const didChange = vscode.workspace.onDidChangeTextDocument(e => handler(e.document));
	const codeActionProvider = vscode.languages.registerCodeActionsProvider('bpf', new BpfConverter());


	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "bpf" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('bpf.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from bbpf!');
	});
	if (vscode.window.activeTextEditor) {
		await handler(vscode.window.activeTextEditor.document);
	}
	const command = vscode.commands.registerCommand('bpf.convertToBbpf', async (newFilePath: string) => {
		if (vscode.window.activeTextEditor === undefined){
			return;
		}
		const curDoc = vscode.window.activeTextEditor.document;
		curDoc.save();
		const text = "/*\r\nThis is a new bBPF file.\r\nbBPF supports a richer syntax than regular BPF.\r\nIt is reccomended to write a short description of you filter here.\r\n*/\r\n\r\n" + curDoc.getText();
		fs.writeFileSync(newFilePath, text);
		await vscode.window.showTextDocument(vscode.Uri.file(newFilePath));
	});
	// Push all of the disposables that should be cleaned up when the extension is disabled
	context.subscriptions.push(
		diagnosticCollection,
		didOpen,
		didChange,
		codeActionProvider,
		disposable,
		command);
}

// this method is called when your extension is deactivated
export function deactivate() {}
