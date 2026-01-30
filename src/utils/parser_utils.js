// Lightweight expression transformer: converts infix expressions into JS that uses
// Complex-aware helper wrappers (__add, __sub, __mul, __div, __pow) where needed.

(function(global){
    function tokenize(s){
        const tokens    = []
        const re        = /\s*([0-9]*\.?[0-9]+(?:e[+-]?\d+)?|[A-Za-z_][A-Za-z0-9_$.]*|\*\*|[+\-*/^(),])\s*/gmi
        let m
        while((m = re.exec(s)) !== null){
            const t = m[1]
            if (/^[0-9]/.test(t)) tokens.push({type:'number', value:t})
            else if (/^[A-Za-z_]/.test(t)) tokens.push({type:'ident', value:t})
            else if (t === ',') tokens.push({type:',', value:','})
            else if (t === '(') tokens.push({type:'(', value:'('})
            else if (t === ')') tokens.push({type:')', value:')'})
            else tokens.push({type:'op', value:t})
        }
        return tokens
    }

    function insertImplicitMult(tokens){
        const out       = []
        for (let i=0;i<tokens.length;i++){
            const cur   = tokens[i]
            out.push(cur)
            if (i === tokens.length-1) break
            const next = tokens[i+1]
            if ((cur.type === 'number' || cur.type === 'ident' || cur.type === ')') &&
                (next.type === 'ident' || next.type === 'number' || next.type === '(')){

                // avoid inserting between function name and '(' (ident followed by '(' as function)
                if (!(cur.type === 'ident' && next.type === '(')){
                    out.push({type:'op', value:'*'})
                }
            }
        }
        return out
    }

    function toRPN(tokens){
        const output        = []
        const ops           = []
        const precedence    = { '+':1, '-':1, '*':2, '/':2, '^':3, '**':3, 'u-':4 }
        const rightAssoc    = { '^':true, '**':true, 'u-':true }
        for (let i=0;i<tokens.length;i++){
            const t         = tokens[i]
            if (t.type === 'number' || t.type === 'ident'){
                output.push(t)
            } else if (t.type === 'op'){
                let op = t.value
                const prev = (i>0) ? tokens[i-1] : null
                if (op === '-' && (!prev || (prev.type === 'op' || prev.type === '(' || prev.type === ',')))
                    op = 'u-'
                while(ops.length){
                    const top = ops[ops.length-1]
                    if (top.type === '(') break
                    const p1 = precedence[op] || 0
                    const p2 = precedence[top.value] || 0
                    if ((rightAssoc[op] && p1 < p2) || (!rightAssoc[op] && p1 <= p2)){
                        output.push(ops.pop())
                    } else break
                }
                ops.push({type:'op', value:op})
            } else if (t.type === '('){
                const prev = (i>0) ? tokens[i-1] : null
                if (prev && prev.type === 'ident'){
                    const funcName = prev.value
                    if (output.length && output[output.length-1].type === 'ident' && output[output.length-1].value === funcName){
                        output.pop()
                    }
                    ops.push({type:'func', name:funcName, argCount:0})
                    ops.push({type:'(', value:'('})
                } else {
                    ops.push({type:'(', value:'('})
                }
            } else if (t.type === ')'){
                while(ops.length && ops[ops.length-1].type !== '('){
                    output.push(ops.pop())
                }
                if (ops.length && ops[ops.length-1].type === '(') ops.pop()
                if (ops.length && ops[ops.length-1].type === 'func'){
                    const f = ops.pop()
                    output.push({type:'func', name:f.name, argCount: f.argCount + 1})
                }
            } else if (t.type === ','){
                while(ops.length && ops[ops.length-1].type !== '('){
                    output.push(ops.pop())
                }
                for (let j=ops.length-1;j>=0;j--){
                    if (ops[j].type === 'func') { ops[j].argCount = (ops[j].argCount||0) + 1; break; }
                    if (ops[j].type === '(') break
                }
            }
        }
        while(ops.length) output.push(ops.pop())
        return output
    }

    function rpnToJs(rpn){
        const stack         = []
        for (let i=0;i<rpn.length;i++){
            const t = rpn[i]
            if (t.type === 'number') stack.push(t.value)
            else if (t.type === 'ident') stack.push(t.value)
            else if (t.type === 'op'){
                if (t.value === 'u-'){
                    const a = stack.pop()
                    stack.push(`(__mul(-1, ${a}))`)
                } else {
                    const b = stack.pop()
                    const a = stack.pop()
                    const map = { '+':'__add', '-':'__sub', '*':'__mul', '/':'__div', '^':'__pow', '**':'__pow' }
                    const fn = map[t.value] || t.value
                    stack.push(`(${fn}(${a}, ${b}))`)
                }
            } else if (t.type === 'func'){
                const args = []
                for (let k=0;k<t.argCount;k++) args.unshift(stack.pop())

                // keep function name as-is (e.g., Math.sin, noise.perlin2)
                const fname = t.name
                stack.push(`${fname}(${args.join(', ')})`)
            }
        }
        return stack.length ? stack[0] : '0'
    }

    function transform(expr){
        try{
            if (expr.indexOf('(') !== -1) return expr

            expr = expr.replace(/(\d+(?:\.\d+)?(?:e[+\-]?\d+)?)(?=\s*[A-Za-z_\(])/gi, '$1 * ')
            expr = expr.replace(/\)\s*(?=[A-Za-z_\(])/g, ') * ')

            if (/\.[A-Za-z_]/.test(expr)) // skip dot function calls (e.g., Math.sin)
                return expr
            
            const tokens = tokenize(expr)
            if (!tokens.length) 
                return expr
            const withMult      = insertImplicitMult(tokens)
            const rpn           = toRPN(withMult)
            const js            = rpnToJs(rpn)
            return js
        } catch (e){
            console.error('ParserUtils.transform error:', e)
            return expr
        }
    }

    global.ParserUtils              = global.ParserUtils || {}
    global.ParserUtils.transform    = transform
})(typeof window !== 'undefined' ? window : this)
