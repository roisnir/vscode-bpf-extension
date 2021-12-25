# BPF extension for Visual Studio Code

A Visual Studio Code extension with support for the Berkeley Packet Filter, including features such as syntax highlighting, linting, formatting, and introduction to bBpf which enables indentation and comments!

## Features
* Syntax Highlighting
* Introduction of bBPF
  * Linebreaks and indentation formatting (with the default "Format Document command and keybinding")
  * Enabled Comments
* BPF to bBPF command - ctrl+shift+p -> Convert to bBPF
* bBPF minification to BPF command - ctrl+shift+p -> Minify to bBPF
* Simple linting and diagnostics
  * Illegal BPF linebreaks
  * Parentheses
* Printable bytes annotations - ctrl+shift+p -> Annotate Printable bytes

## Installation
Open vscode
ctrl+shift+p -> Extentsions: Install from VSIX... -> select file bpf-0.0.1.vsix

## Contribute!
https://github.com/roisnir/vscode-bpf-extension

## Known Issues

* arbitrary strings (i.e when filtering host names) will be marked as invalid syntax.

## Release Notes
### 0.0.2 - Mostly bug fixes
* Convert to bBPF: format document automatically when converting to bbpf
* Minify to BPF: fix too many spaces after minification
* Annotation
  * don't annotate when already annotated
  * annotate \r\n
  * annotate automatically on conversion to bBPF
* Tokenization Bug Fixes
  * tcp flags
  * icmp types
  * spaces after greater
* Formatting: add space around operators

### 0.0.1 - Initial release of vscode-bpf-extension!
* Syntax Highlighting
* Introduction of bBPF
  * Linebreaks and indentation formatting (with the default "Format Document command and keybinding")
  * Enabled Comments
* BPF to bBPF command - ctrl+shift+p -> Convert to bBPF
* bBPF minification to BPF command - ctrl+shift+p -> Minify to bBPF
* Simple linting and diagnostics
  * Illegal BPF linebreaks
  * Parentheses
* Printable bytes annotations - ctrl+shift+p -> Annotate Printable bytes