import { HoverProvider, Hover } from "vscode";


export const bpfHoverProvider: HoverProvider = {
    provideHover(document, position, token) {
        
        return new Hover('I am a hover! in bpf');
    }
};


export const bBpfHoverProvider: HoverProvider = {
    provideHover(document, position, token) {
        
        return new Hover('I am a hover! in bbpf');
    }
};
