enum BPFScopes {
    logicalOeratorPrefix = 'keyword.operator.bpf.logical',
    slicePrefix = 'meta.structure.bpf.slice',
    operatorPrefix = 'keyword.operator',
    sliceOpen = 'meta.structure.bpf.slice',
    sliceClose = 'meta.structure.bpf.slice',
    sliceColon = 'meta.structure.bpf.slice',
    binaryLogicalOperator = 'keyword.operator.bpf.logical.binary',
    unaryLogicalOperator = 'keyword.operator.bpf.logical.unary',
    parenthesesOpen = 'meta.structure.bpf.punctuation.parentheses.open',
    parenthesesClose = 'meta.structure.bpf.punctuation.parentheses.close',
    space = 'meta.structure.bpf.punctuation.space',
    blockCommentStart = "comment.block.start",
    blockCommentEnd = "comment.block.end",
    blockComment = "comment.block",
    lineCommentDDash = "comment.line.double-dash",
    lineComment = "comment.line",
    numericHex = 'constant.numeric.hex.bpf'
}

export default BPFScopes;
