const fs = require("fs");

const bpfLang = JSON.parse(fs.readFileSync('./syntaxes/bpf.tmLanguage.json'));
const bbpfLang = JSON.parse(fs.readFileSync('./syntaxes/bbpf.tmLanguage.json.in'));
bbpfLang.patterns = [...bbpfLang.patterns, ...bpfLang.patterns];
bbpfLang.repository = {...bpfLang.repository, ...bbpfLang.repository};
fs.writeFileSync("./syntaxes/bbpf.tmLanguage.json", JSON.stringify(bbpfLang, null, 2));
console.log("Generated ./syntaxes/bbpf.tmLanguage.json Successfully!");