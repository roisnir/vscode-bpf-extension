import { DiagnosticCollection, TextDocument, Diagnostic, DiagnosticSeverity, Position, Range } from "vscode";
import { parseParentheses, ParsingError } from "./parse-parentheses";
import { tokenizeCode, loadGrammar } from './textmate-grammer';


export async function getBpfDiagnosticsHandler(diagnosticCollection: DiagnosticCollection) {
	return async (doc: TextDocument) => {
		if (doc.languageId in ['bpf', 'bbpf']) {
			return;
		}
		const code = doc.getText();
		diagnosticCollection.set(doc.uri, [
			...doc.languageId === 'bpf' ? checkLineBreaks(code) : [],
			...await checkCode(code, `source.${doc.languageId}`)
		]);
	};
}

function checkLineBreaks(code: string): Diagnostic[] {
	const diagnosticts = new Array<Diagnostic>();
	let lines = code.split(/\r\n|\n/);
	if (lines.length >= 2) {
		const line0 = lines[0];
		const line1 = lines[1];
		diagnosticts.push(
			{
				"severity": DiagnosticSeverity.Warning,
				"message": "BPF syntax doesn't support line breaks.",
				"code": "bpf-invalid-syntax-linebreak",
				"source": "bpf",
				"range": new Range(
					new Position(0, line0.length - 1),
					new Position(1, line1.length - 1)
				)
			}
		);
	}
	return diagnosticts;
}

function checkCode(code: string, scope: string): Promise<Diagnostic[]> {
	const diagnosticts = new Array<Diagnostic>();
	return loadGrammar(scope).then(grammar => {
		let tokens = [...tokenizeCode(code, grammar)];
		for (const token of tokens) {
			if (token.scopes.length < 2 || token.scopes.includes("invalid.illegal.bpf")) {
				diagnosticts.push(
					{
						"severity": DiagnosticSeverity.Error,
						"message": `invalid syntax '${token.text}' at line ${token.lineNumber}:${token.startIndex}'`,
						"code": "bpf-invalid-syntax-unkown-token",
						"source": "bpf",
						"range": new Range(
							new Position(token.lineNumber, token.startIndex),
							new Position(token.lineNumber, token.endIndex)
						)
					}
				);
			}
		}
		try{
			parseParentheses(tokens);
		}
		catch (e){
			if (e instanceof ParsingError){
				diagnosticts.push(
					{
						"severity": DiagnosticSeverity.Error,
						"message": e.message,
						"code": "bpf-parentheses-parsing-error",
						"source": "bpf",
						"range": new Range(
							new Position(e.lineNumber, e.columnNumber),
							new Position(e.lineNumber, e.columnNumber + 1)
						)
					}
				);
			} else {
				throw e;
			}
		}
		return diagnosticts;
	}, (err: any) => {
		console.log(err);
		throw err;
	}
	);
}