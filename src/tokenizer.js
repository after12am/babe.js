var Tokenizer = function(source) {
    this.line;
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
                if (token = this.scanIndent()) {
                    tokens.push(token);
                }
                continue;
            }
        }
        
        // ignore white spaces
        if (this.isWhiteSpace(this.c)) {
            this.consume();
            continue;
        }
        
        if (this.c == Token.EOF) {
            break;
        }
        
        if (this.isLetter(this.c)) {
            if (token = this.scanIdent()) {
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
        
        throw exports.appName + ': unexpecting ' + this.c;
        this.consume();
    }
    
    tokens.push(new Token(Token.EOF, '', new Location(this.line)));
    return tokens;
}

Tokenizer.prototype.scanLineTerminator = function() {
    
    var c1 = this.c;
    var c2 = this.nextChar();
    
    
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
    
    if (Token.KEYWORDS[ident.toUpperCase()]) {
        return new Token(Token.KEYWORD, ident, new Location(this.line));
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
    while (this.c !== Token.EOF && !this.isLineTerminator(this.c) && this.c !== delimiter) {
        ss += this.c;
        this.consume();
    }
    
    if (this.c === delimiter) {
        this.consume();
    } else {
        throw exports.appName + ': on line ' + this.line + ': Unexpected token ILLEGAL';
    }
    
    return new Token(Token.STRING, ss, new Location(this.line));
}

Tokenizer.prototype.scanPunctuator = function() {
    
    var punctuator;
    
    if ("{}()[]:,.".indexOf(this.c) !== -1) {
        punctuator = this.c;
        this.consume();
        return new Token(Token.PUNCTUATOR, punctuator, new Location(this.line));
    }
    
    if (token = this.scanAssign()) {
        return token;
    }
    
    if (token = this.scanOperator()) {
        return token;
    }
}

Tokenizer.prototype.scanOperator = function() {
    
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
    
    var op = this.c + this.lookahead(1) + this.lookahead(2) + this.lookahead(3);
    if (op === '>>>=') {
        this.consume();
        this.consume();
        this.consume();
        this.consume();
        return new Token(Token.ASSIGN, op, new Location(this.line));
    }
    
    var op = this.c + this.lookahead(1) + this.lookahead(2);
    if (op === '<<=' || op === '>>=' || op === '!==' || op === '===') {
        this.consume();
        this.consume();
        this.consume();
        return new Token(Token.ASSIGN, op, new Location(this.line));
    }
    
    var op = this.c + this.lookahead(1);
    if (op === '*=' || op === '/=' || op === '%=' || 
        op === '+=' || op === '-=' || op === '&=' || 
        op === '^=' || op === '|=') {
        this.consume();
        this.consume();
        return new Token(Token.ASSIGN, op, new Location(this.line));
    }
    
    var op = this.c;
    if (op === '=') {
        this.consume();
        return new Token(Token.ASSIGN, op, new Location(this.line));
    }
    
    return false;
}