/*
 * babe.js
 * https://github.com/after12am/babe
 *
 * Copyright 2012 Satoshi Okami
 * Released under the MIT license
 */
var babe = (function() {
var exports = {};

// src/ast.js
// node param must be object
// var AST = function(node) {
//     this.node = node;
//     this.nodes = [];
// }
// 
// // AST.prototype.type = function() {
// //     return this.node.kind;
// // }
// // 
// AST.prototype.add = function(node) {
//     if (typeof node == 'object') this.nodes.concat(node);
//     else this.nodes.push(node);
// }
// 
// AST.prototype.toString = function() {
//     // should be dynamically overridden.
// }
// 
// var Node = AST;
// src/codegen.js
var CodeGen = function(ast, log) {
    this.ast = ast;
    this.log = log;
}

CodeGen.prototype.generate = function() {
    
}
// src/compiler.js
var Compiler = function(source) {
    this.source = source;
}

Compiler.prototype.compile = function() {
    
    if (typeof this.source !== 'string') {
        console.error('input type is not string.');
        return;
    }
    
    var log = new Log();
    var tokenizer = new Tokenizer(this.source);
    var tokens;
    var ast;
    var compiled;
    
    if (tokens = tokenizer.tokenize()) {
        if (ast = new Parser(tokens, log).parse()) {
            compiled = new CodeGen(ast).generate();
        }
    }
    
    return {
        'source': this.source,
        'tokens': token,
        'ast': ast,
        'compiled': compiled,
        'log': log,
        'error': log.hasError()
    }
}

exports.tokenize = function(source) {
    var tokens = [];
    var tokenizer = new Tokenizer(source);
    tokens = tokenizer.tokenize();
    return tokens;
}

exports.parse = function(source) {
    var tokens = exports.tokenize(source);
    var ast = new Parser(tokens).parse();
    return ast;
}

exports.codegen = function(source) {
    var ast = exports.parse(source);
    var compiled = new CodeGen(ast).generate();
    return compiled;
}

exports.compile = function(source) {
    var compiler = new Compiler(source);
    compiler.compile();
    return (!compiler.log.hasErrors);
}

exports.run = function(source) {
    var res = exports.compile(source);
    for (var i in res['log'].messages) {
        console.log(res['log'].messages[i]);
    }
    if (res['error'] === false) {
        eval(res['compiled']);
    }
    return res;
}

exports.interpret = function() {
    return exports.run();
}
// src/lexer.js
var Lexer = function(source) {
    this.source = source || '';
    this.p = 0;
    this.c = this.source[this.p];
}

Lexer.prototype.consume = function() {
    this.p++;
    if (this.p < this.source.length) {
        this.c = this.source[this.p];
    } else {
        this.c = Token.EOF;
    }
}

Lexer.prototype.lookahead = function(k) {
    if (this.p + k < this.source.length) {
        return this.source[this.p + k];
    } else {
        return Token.EOF;
    }
}

Lexer.prototype.isWhiteSpace = function(c) {
    return c.match(/\s/);
}

Lexer.prototype.isDigit = function(c) {
    return c >= "0" && c <= "9";
}

Lexer.prototype.isLetter = function(c) {
    return c >= "A" && c <= "Z" || c >= "a" && c <= "z" || c === "_";
}

Lexer.prototype.isLineTerminator = function(c) {
    return c == '\n' || c == '\r';// || c == '\r\n';
}
// src/location.js
var Location = function(line) {
    this.line = line;
}

Location.prototype.toString = function() {
    return "on line " + this.line;
};
// src/log.js
var Log = function() {
    this.messages = [];
};

Log.prototype.log = function(text, line) {
    this.messages.push({
        type: 'log',
        text: text,
        line: line
    });
};

Log.prototype.info = function(text, line) {
    this.messages.push({
        type: 'info',
        text: text,
        line: line
    });
};

Log.prototype.debug = function(text, line) {
    this.messages.push({
        type: 'debug',
        text: text,
        line: line
    });
};

Log.prototype.warn = function(text, line) {
    this.messages.push({
        type: 'warn',
        text: text,
        line: line
    });
};

Log.prototype.error = function(text, line) {
    this.messages.push({
        type: 'error',
        text: text,
        line: line
    });
};

Log.prototype.hasError = function() {
    for (var i in this.messages) {
        if (this.messages[i]['type'] == 'error') {
            return true;
        }
    }
    return false;
};
// src/parser.js
// http://www2u.biglobe.ne.jp/~oz-07ams/prog/ecma262r3/
var Parser = function(tokens, log) {
    this.p = 0;
    this.tokens = tokens;
    this.token = this.tokens[this.p];
    this.indent_size;
    this.indent = 0;
    this.log = log || new Log();
    this.nodes = [];
}

Parser.prototype.consume = function() {
    this.p++;
    if (this.p < this.tokens.length) {
        this.token = this.tokens[this.p];
    } else {
        this.token = new Token(Token.EOF);
    }
}

Parser.prototype.lookahead = function(k) {
    if (this.p + k < this.tokens.length) {
        return this.tokens[this.p + k];
    } else {
        return new Token(Token.EOF);
    }
}

Parser.prototype.expect = function(text) {
    if (this.token.text == text) {
        this.consume();
    } else {
        this.assert('unexpecting text, expecting:' + text + ' giving:' + this.token.text);
    }
}

Parser.prototype.match = function(text) {
    return (this.token.text != text);
}

Parser.prototype.assert = function(message) {
    throw message;
}

Parser.prototype.isLineTerminator = function(c) {
    return c == '\n' || c == '\r';// || c == '\r\n';
}

Parser.prototype.matchAssign = function() {
    
    // 4character assignment
    var op = this.token.text + this.lookahead(1).text + this.lookahead(2).text + this.lookahead(3).text;
    if (op === '>>>=') {
        return op;
    }
    
    // 3character assignment
    var op = this.token.text + this.lookahead(1).text + this.lookahead(2).text;
    if (op === '<<=' || op === '>>=' || op === '!==' || op === '===') {
        return op;
    }
    
    // 2character assignment
    var op = this.token.text + this.lookahead(1).text;
    if (op === '*=' || op === '/=' || op === '%=' || 
        op === '+=' || op === '-=' || op === '&=' || 
        op === '^=' || op === '|=') {
        return op;
    }
    
    // 1character assignment
    var op = this.token.text;
    if (op === '=') {
        return op;
    }
}

Parser.prototype.parse = function() {
    this.p = 0;
    
    // set indent size
    for (var i = 0; i < this.tokens.length; i++) {
        if (this.tokens[i].kind === Token.INDENT) {
            if (this.tokens[i].text > 0) {
                this.indent_size = this.tokens[i].text;
                break;
            }
        }
    }
    
    while (1) {
        if (this.token.kind === Token.EOF) {
            this.consume();
            break;
        }
        
        if (this.token.kind === Token.NEWLINE) {
            this.consume();
            continue;
        }
        
        if (this.token.kind === Token.INDENT) {
            this.expect(0);
            continue;
        }
        
        if (node = this.parseStatement()) {
            this.indent = 0;
            this.nodes.push(node);
            continue;
        }
        
        throw 'unexpected token, ' + this.token.toString();
    }
    
    return this.nodes;
}

Parser.prototype.parseStatement = function() {
    
    if (this.token.kind === Token.NEWLINE) {
        this.consume();
        return this.parseStatement();
    }
    
    // check indent
    if (this.token.kind === Token.INDENT) {
        if (this.indent_size * this.indent !== this.token.text) {
            throw 'error around indent';
        }
        this.consume();
        return this.parseStatement();
    }
    
    switch (this.token.kind) {
        case Token.KEYWORDS.IF:
            return this.parseIfStatement();
        case Token.IDENT:
            return this.parseVariableStatement();
        default:
            throw 'unkonwn token ' + this.token;
    }
}

Parser.prototype.parseIfStatement = function() {
    
    var expr, exprs;
    
    this.expect('if');
    
    expr = this.parseExpression();
    
    this.expect(':');
    
    this.indent++;
    
    var exprs = this.parseStatement();
    
    this.indent--;
    
    return {
        type: Syntax.IfStatement,
        condition: expr,
        consequent: exprs,
        alternate: null
    };
}

Parser.prototype.parseExpression = function() {
    
    var expr = this.parseAssignmentExpression();
    
    return expr;
}

Parser.prototype.parseAssignmentExpression = function() {
    
    var expr = this.parseConditionalExpression();
    
    if (operator = this.matchAssign()) {
        
        for (var i = 0; i < operator.length; i++) {
            this.consume();
        }
        
        return {
            type: Syntax.Identifier,
            operator: operator,
            left: expr,
            right: this.parseAssignmentExpression()
        };
    }
    
    return expr;
}

Parser.prototype.parseConditionalExpression = function() {
    
    var expr = this.parseLogicalORExpression();
    
    return expr;
}

Parser.prototype.parseLogicalORExpression = function() {
    
    var expr = this.parseLogicalANDExpression();
    
    return expr;
}


Parser.prototype.parseLogicalANDExpression = function() {
    
    var expr = this.parseBitwiseORExpression();
    
    return expr;
}

Parser.prototype.parseBitwiseORExpression = function() {
    
    var expr = this.parseBitwiseXORExpression();
    
    return expr;
}

Parser.prototype.parseBitwiseXORExpression = function() {
    
    var expr = this.parseBitwiseANDExpression();
    
    return expr;
}

Parser.prototype.parseBitwiseANDExpression = function() {
    
    var expr = this.parseEqualityExpression();
    
    return expr;
}

Parser.prototype.parseEqualityExpression = function() {
    
    var expr = this.parseRelationalExpression();
    
    return expr;
}

Parser.prototype.parseRelationalExpression = function() {
    
    var expr = this.parseShiftExpression();
    
    return expr;
}

Parser.prototype.parseShiftExpression = function() {
    
    var expr = this.parseAdditiveExpression();
    
    return expr;
}

Parser.prototype.parseAdditiveExpression = function() {
    
    var expr = this.parseMultiplicativeExpression();
    
    return expr;
}

Parser.prototype.parseMultiplicativeExpression = function() {
    
    var expr = this.parseUnaryExpression();
    
    return expr;
}

Parser.prototype.parseUnaryExpression = function() {
    
    var expr = this.parsePostfixExpression();
    
    return expr;
}

Parser.prototype.parsePostfixExpression = function() {
    
    var expr = this.parseLeftHandSideExpression();
    
    return expr;
}

Parser.prototype.parseLeftHandSideExpression = function() {
    
    var expr = this.parseNewExpression();
    
    return expr;
}

Parser.prototype.parseNewExpression = function() {
    
    var expr = this.parseMemberExpression();
    
    return expr;
}

Parser.prototype.parseMemberExpression = function() {
    
    var expr = this.parsePrimaryExpression();
    
    return expr;
}

Parser.prototype.parsePrimaryExpression = function() {
    
    if (this.token.kind === Token.IDENT) {
        var token = this.token;
        this.consume();
        return {
            type: Syntax.Identifier,
            name: token.text 
        };
    }
    
    if (this.token.kind === Token.DIGIT) {
        var token = this.token;
        this.consume();
        return {
            type: Syntax.NumericLiteral,
            name: token.text 
        };
    }
    
    if (this.token.kind === Token.STRING) {
        var token = this.token;
        this.consume();
        return {
            type: Syntax.StringLiteral,
            name: token.text 
        };
    }
}

Parser.prototype.parseVariableStatement = function() {
    
    var expr = this.parseAssignmentExpression();
    
    return expr;
}

Parser.prototype.parseAssignmentOperator = function() {
    
}

// src/syntax.js
var Syntax = {
    NullLiteral: 'NullLiteral',
    BooleanLiteral: 'BooleanLiteral',
    NumericLiteral: 'NumericLiteral',
    StringLiteral: 'StringLiteral',
    Identifier: 'Identifier',
    IfStatement: 'IfStatement'
}
// src/token.js
var Token = function(kind, text, location) {
    this.kind = kind;
    this.text = text;
    this.location = location;
}

Token.prototype.toString = function() {
    return this.location.toString() + ' kind:' + this.kind + ' text:' + this.text;
}

//----------------------------------------
// TOKEN LIST
//----------------------------------------
Token.EOF = 'EOF';
Token.NEWLINE = 'NEWLINE';
Token.INDENT = 'INDENT';
Token.IDENT = 'IDENT';
Token.DIGIT = 'DIGIT';
Token.PUNCTUATOR = 'PUNCTUATOR';
Token.STRING = 'STRING';
Token.OPERATOR = 'OPERATOR';
Token.ASSIGN = 'ASSIGN';
Token.KEYWORD = 'KEYWORD';

//----------------------------------------
// KEYWORD LIST
//----------------------------------------
Token.KEYWORDS = [];
Token.KEYWORDS.TYPEOF = 'TYPEOF';
Token.KEYWORDS.INSTANCEOF = 'INSTANCEOF';
Token.KEYWORDS.DELETE = 'DELETE';
Token.KEYWORDS.NEW = 'NEW';
Token.KEYWORDS.TRY = 'TRY';
Token.KEYWORDS.CATCH = 'CATCH';
Token.KEYWORDS.THROW = 'THROW';
Token.KEYWORDS.EXTENDS = 'EXTENDS';
Token.KEYWORDS.AND = 'AND';
Token.KEYWORDS.OR = 'OR';
Token.KEYWORDS.XOR = 'XOR';
Token.KEYWORDS.IN = 'IN';
Token.KEYWORDS.IS = 'IS';
Token.KEYWORDS.NOT = 'NOT';
Token.KEYWORDS.RETURN = 'RETURN';
Token.KEYWORDS.IF = 'IF';
Token.KEYWORDS.ELIF = 'ELIF';
Token.KEYWORDS.ELSE = 'ELSE';
Token.KEYWORDS.WHILE = 'WHILE';
Token.KEYWORDS.FOR = 'FOR';
Token.KEYWORDS.CONTINUE = 'CONTINUE';
Token.KEYWORDS.BREAK = 'BREAK';
Token.KEYWORDS.CLASS = 'CLASS';
Token.KEYWORDS.NULL = 'NULL';
Token.KEYWORDS.THIS = 'THIS';
Token.KEYWORDS.TRUE = 'TRUE';
Token.KEYWORDS.FALSE = 'FALSE';

// src/tokenizer.js
var Tokenizer = function(source) {
    this.line = 1;
    Lexer.call(this, source);
}

Tokenizer.prototype = new Lexer();
Tokenizer.prototype.tokenize = function() {
    
    this.line = 1;
    var tokens = [];
    
    if (token = this.scanIndent()) {
        tokens.push(token);
    }
    
    while (this.p < this.source.length) {
        
        var token;
        
        if (this.c == '\n' || this.c == '\r') {
            if (token = this.scanLineTerminator()) {
                tokens.push(token);
            }
            if (token = this.scanIndent()) {
                tokens.push(token);
            }
            continue;
        }
        
        // ignore white spaces
        if (this.isWhiteSpace(this.c)) {
            this.consume();
            continue;
        }
        
        if (this.isLetter(this.c)) {
            if (token = this.scanIdent()) {
                if (Token.KEYWORDS[token.text.toUpperCase()]) {
                    token.kind = token.text.toUpperCase();
                }
                tokens.push(token);
                continue;
            }
        }
        
        if (this.isDigit(this.c)) {
            if (token = this.scanDigit()) {
                tokens.push(token);
                continue;
            }
        }
        
        if (this.c === '\'' || this.c == '"') {
            var deli = this.c;
            if (token = this.scanString(deli)) {
                tokens.push(token);
                continue;
            }
        }
        
        if (token = this.scanPunctuator()) {
            tokens.push(token);
            continue;
        }
        
        if (token = this.scanAssign()) {
            tokens.push(token);
            continue;
        }

        if (token = this.scanOperator()) {
            tokens.push(token);
            continue;
        }
        
        throw exports.appName + ': unexpecting ' + this.c;
        this.consume();
    }
    
    tokens.push(new Token(Token.EOF, '', new Location(this.line)));
    return tokens;
}

Tokenizer.prototype.scanLineTerminator = function() {
    var c1 = this.c;
    var c2 = this.lookahead(1);
    this.line++;
    this.consume();
    if ((c1 + c2) == '\r\n') {
        this.consume();
        return new Token(Token.NEWLINE, c1 + c2, new Location(this.line));
    }
    return new Token(Token.NEWLINE, c1, new Location(this.line));
}

Tokenizer.prototype.scanIndent = function() {
    var size = 0;
    while (this.p < this.source.length) {
        if (this.c == ' ' || this.c == '\t') size++;
        else break;
        this.consume();
    }
    return new Token(Token.INDENT, size, new Location(this.line));
}

Tokenizer.prototype.scanIdent = function() {
    var ident = '';
    while (this.c !== Token.EOF) {
        if (this.isLetter(this.c) || this.isDigit(this.c)) {
            ident += this.c;
            this.consume();
        } else {
            break;
        }
    }
    return new Token(Token.IDENT, ident, new Location(this.line));
}

Tokenizer.prototype.scanDigit = function() {
    var digit = '';
    while (this.c !== Token.EOF) {
        if (this.isDigit(this.c)) {
            digit += this.c;
            this.consume();
        } else {
            break;
        }
    }
    return new Token(Token.DIGIT, digit, new Location(this.line));
}

Tokenizer.prototype.scanString = function(delimiter) {
    var ss = '';
    this.consume();
    while (1) {
        if (this.c === delimiter) {
            this.consume();
            break;
        } else if (this.c === Token.EOF || this.isLineTerminator(this.c)) {
            throw exports.appName + ': on line ' + this.line + ': Unexpected token ILLEGAL';
        }
        ss += this.c;
        this.consume();
    }
    return new Token(Token.STRING, ss, new Location(this.line));
}

Tokenizer.prototype.scanPunctuator = function() {
    
    // 1character punctuator
    if (this.c === '{' || this.c === '}' || this.c === '(' ||
        this.c === ')' || this.c === '[' || this.c === ']' ||
        this.c === ':' || this.c === ',' || this.c === '.') {
        var punctuator = this.c;
        this.consume();
        return new Token(Token.PUNCTUATOR, punctuator, new Location(this.line));
    }
}

Tokenizer.prototype.scanOperator = function() {
    
    // 3character operator
    var op = this.c + this.lookahead(1) + this.lookahead(2);
    if (op === '>>>' || op === '<<<') {
        this.consume();
        this.consume();
        return new Token(Token.OPERATOR, op, new Location(this.line));
    }
    
    // 2character operator
    var op = this.c + this.lookahead(1);
    if (op === '++' || op === '--' || op === '>>' ||
        op === '<<' || op === '&&' || op === '||') {
        this.consume();
        return new Token(Token.OPERATOR, op, new Location(this.line));
    }
    
    // 1character operator
    var op = this.c;
    if (op === '+' || op === '-' || op === '*' ||
        op === '/' || op === '%' || op === '<' ||
        op === '>' || op === '&' || op === '!' ||
        op === '|' || op === '^' || op === '~' ||
        op === '?') {
        this.consume();
        return new Token(Token.OPERATOR, op, new Location(this.line));
    }
}

Tokenizer.prototype.scanAssign = function() {
    
    // 4character assignment
    var op = this.c + this.lookahead(1) + this.lookahead(2) + this.lookahead(3);
    if (op === '>>>=') {
        this.consume();
        this.consume();
        this.consume();
        this.consume();
        return new Token(Token.ASSIGN, op, new Location(this.line));
    }
    
    // 3character assignment
    var op = this.c + this.lookahead(1) + this.lookahead(2);
    if (op === '<<=' || op === '>>=' || op === '!==' || op === '===') {
        this.consume();
        this.consume();
        this.consume();
        return new Token(Token.ASSIGN, op, new Location(this.line));
    }
    
    // 2character assignment
    var op = this.c + this.lookahead(1);
    if (op === '*=' || op === '/=' || op === '%=' || 
        op === '+=' || op === '-=' || op === '&=' || 
        op === '^=' || op === '|=') {
        this.consume();
        this.consume();
        return new Token(Token.ASSIGN, op, new Location(this.line));
    }
    
    // 1character assignment
    var op = this.c;
    if (op === '=') {
        this.consume();
        return new Token(Token.ASSIGN, op, new Location(this.line));
    }
    
    return false;
}
return exports;
})();