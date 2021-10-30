import { DiagnosticCollection, TextDocument, Diagnostic, DiagnosticSeverity, Position, Range } from "vscode";
import { tokenizeCode, loadGrammar } from './textmate-grammer';


function checkCode(code: string, scope: string) {
	loadGrammar(scope).then(grammar => {
		let tokens = tokenizeCode(code, grammar);
	}, (err: any)=>{
		console.log(err);
		throw err;});	
}


export async function getBpfDiagnosticsHandler(diagnosticCollection:DiagnosticCollection) {
    return async (doc: TextDocument) => {
		if (doc.languageId in ['bpf', 'bbpf']) {
			return;
		}
		const code = doc.getText();
		const diagnosticts = new Array<Diagnostic>();
		let lines = code.split(/(\r\n|\n)/);
		if (lines.length >= 1) {
			const line = lines[2];
			diagnosticts.push(
				{
					"severity": DiagnosticSeverity.Warning,
					"message": "BPF syntax doesn't support line breaks.",
					"code": "bpf-invalid-syntax-basic",
					"source": "",
					"range": new Range(
						new Position(0, 0),
						new Position(1, line.length - 1)
					)
				}
			);
		}
		const res = checkCode(code, `source.${doc.languageId}`);
		diagnosticCollection.set(doc.uri, diagnosticts);
	};
    
}