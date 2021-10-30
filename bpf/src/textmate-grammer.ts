import fs = require('fs');
import path = require('path');
import vsctm = require('vscode-textmate');
import oniguruma = require('vscode-oniguruma');
import { IRawGrammar, IToken } from 'vscode-textmate';
import { resolve } from 'path';


const loadedGrammars: { [scopeName: string]: vsctm.IGrammar } = {};
const wasmBin = fs.readFileSync(path.join(__dirname, '../node_modules/vscode-oniguruma/release/onig.wasm')).buffer;
const vscodeOnigurumaLib = oniguruma.loadWASM(wasmBin).then(() => {
    return {
        createOnigScanner(patterns: any) { return new oniguruma.OnigScanner(patterns); },
        createOnigString(s: any) { return new oniguruma.OnigString(s); }
    };
});
const supportedScopesFiles: { [scopeName: string]: fs.PathLike } = {
    "source.bpf": path.join(__dirname, "../syntaxes/bpf.tmLanguage.json"),
    "source.bbpf": path.join(__dirname, "../syntaxes/bbpf.tmLanguage.json")
};
const registry = new vsctm.Registry({
    onigLib: vscodeOnigurumaLib,
    loadGrammar: (scopeName: string) => {
        return new Promise<IRawGrammar>((resolve, reject) => {
            if (!(scopeName in supportedScopesFiles)) {
                reject(`Unsupported scope name: ${scopeName}. availble scopes are ${Object.keys(supportedScopesFiles)}`);
            } else {
                const filePath = supportedScopesFiles[scopeName].toString();
                fs.readFile(filePath, { encoding: 'utf8' }, (err, data: string) =>
                    err ? reject(err) : resolve(vsctm.parseRawGrammar(data, filePath)));
            }
        });
    }
});

export async function loadGrammar(scopeName: string): Promise<vsctm.IGrammar> {
    if (!(scopeName in loadedGrammars)) {
        let grammar = await registry.loadGrammar(scopeName).catch((reason) => { throw new Error(reason.toString()); });
        loadedGrammars[scopeName] = grammar!;
    }
    return loadedGrammars[scopeName];
}

export interface ITokenWithLine {
    readonly lineNumber: number;
    startIndex: number;
    readonly endIndex: number;
    readonly scopes: string[];
}

export function* tokenizeCode(code: string, grammar: vsctm.IGrammar): Generator<ITokenWithLine, void, void> {
    const codeLines = code.split(/\r\n|\n/);
    let ruleStack = vsctm.INITIAL;
    for (let i = 0; i < codeLines.length; i++){
        const tokens = grammar.tokenizeLine(codeLines[i], ruleStack);
        for (let token of tokens.tokens){
            yield {
                lineNumber: i+1,
                startIndex: token.startIndex,
                endIndex: token.endIndex,
                scopes: token.scopes
            };
        }
        ruleStack = tokens.ruleStack;
    }
}