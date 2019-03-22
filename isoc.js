var phase = { 0: iterator => phase[3](phase[2](phase[1](iterator))) // all phases so far combined
            , 1: iterator => // translation phase 1 is replacing trigraphs
                  (proxy =>
                  { let trigraph =
                    ({ '??=' : '#', '??(' : '[', '??/' : '\\'
                     , '??)' : ']', '??\'': '^', '??<' : '{'
                     , '??!' : '|', '??>' : '}', '??-' : '~'
                     }), window = [];
                    proxy.next = _ => (c => c.done || window.push(c.value) == 3
                                       ? { done: window.length == 0 && c.done
                                         , value: trigraph[window.join('')]
                                                ? trigraph[window.splice(0, 3).join('')]
                                                : window.shift()
                                         }
                                       : proxy.next())(iterator.next())
                    proxy[Symbol.iterator] = _ => proxy;
                    return proxy;
                  })(new Proxy({}, {}))
            , 2: iterator => // translation phase 2 is replacing line splices
                  (proxy =>
                  { let window = [];
                    proxy.next = _ => (c => c.done || window.push(c.value) == 2
                                       ? window.join('') == '\\\n'
                                         ? window.splice(0, 2) && proxy.next()
                                         : { done: window.length == 0 && c.done
                                           , value: window.shift()
                                           }
                                       : proxy.next())(iterator.next());
                   proxy[Symbol.iterator] = _ => proxy;
                   return proxy;
                  })(new Proxy({}, {}))
            , 3: iterator => // translation phase 3 is tokenizing whitespace (including comments), header names, identifiers, "preprocessor numbers" (-shudders-), string literals and punctuators
                  (proxy =>
                  { let rxstub              = rx => str => (match => match && match[0])(rx.exec(str))
                      , whitespace          = rxstub(/^((\/\/[^\n]*\n)|(\/\*(?:\*(?!\/)|[^*])*\*\/)|(\s))/)
                      , header_name         = str => o.length >= 3 && !exprcmp({ type: 'punctuator', value: '#'       })(o[0]) &&
                                                                      !exprcmp({ type: 'identifier', value: 'include' })(o.slice(1).find(expr => expr.value.slice(-1) == '\n' || expr.type != 'whitespace')) &&
                                                                      rxstub(/^((\<[^>]+\>)|(\"[^\"]+\"))/)(str) // XXX: It might pay to expose a part of this pattern (the quote-matching part) externally
                      , digit               = rxstub(/^\d+/)
                      , identifier          = str => (size => size > 0 && str.slice(0, size))(Array.from(str).findIndex(c => { try { eval(`var ${c};`); } catch (error) { return true; } }))
                      , preprocessor_number = str => (match => match && preprocessor_tail(match[0], str))(/^\.?\d/.exec(str))
                      , preprocessor_tail   = (match, str) => match + [ digit
                                                                      , rxstub(/^[EePp][-+]/)
                                                                      , identifier
                                                                      , rxstub(/^\./)
                                                                      , preprocessor_number
                                                                      ].reduce((prev, fun) => prev || (match => || match && str.slice(0, match.length))(fun(str.slice(match.length))), null)
                      , character_constant  = rxstub(/^[LUu]?'(?:\\'|[^'])*'/)
                      , string_literal      = rxstub(/^([LUu])?"(?:\\"|[^"])*"/)
                      , punctuator          = rxstub(/^(\[|\]|\(|\)|\{|\}|\.\.\.|\.|\+\+|\+\=|\+|\-\-|\-\>|\-\=|\-|\&\&|\&\=|\&|\*\=|\*|\~|\!\=|\!|\/\=|\/|\%\=|\%\>|\%\:\%\:|\%\:|\%|\<\<\=|\<\<|\>\>\=|\>\>|\<\%|\<\:|\<\=|\<|\>\=|\>|\=\=|\=|\^\=|\^|\|\||\|\=|\||\?|\:\>|\:|\;|\,|\#|\#\#)/)
                      , i = Array.from(iterator)
                      , o = []
                      , tokfn = fn => eval(`({ 'fun':  ${fn}, 'name': fn })`) // -cringe- I know but if you look below we're only using it for single identifiers...
                      , exprcmp = x => y => (x.type && y.type && (x.type > y.type) - (x.type < y.type)) ||
                                            (x.value && y.value && (x.value > y.value) - (x.value < y.value))
                      , evaluate = _ => ((newline_purge => newline_purge && o.splice(0, o.length))(o.length && o.slice(-1)[0].value.slice(-1) == '\n'),
                                         [ tokfn('whitespace')
                                         , tokfn('header_name')
                                         , tokfn('identifier')
                                         , tokfn('preprocessor_number')
                                         , tokfn('character_constant')
                                         , tokfn('string_literal')
                                         , tokfn('punctuator')
                                         ].reduce((prev, fn) => prev || (match => match && o[o.push({ done: match.length == i.length
                                                                                                    , type: fn.name
                                                                                                    , value: i.splice(0, match.length).join('')
                                                                                                    }) - 1])(fn.fun(i.join(''))), undefined));
                    proxy.next = _ => evaluate() || { done: true, i_length: i.length }
                    proxy[Symbol.iterator] = _ => proxy;
                    return proxy;
                  })(new Proxy({}, {}))
            };
            
var it;
var a = phase[0]('??=define ??/\nfubar \\\n42'[Symbol.iterator]());
do
{ it = a.next();
} while (console.log(it) || !it.done);


var b = phase[0]("Let us /* not */ strip some comments // and say we did\n"[Symbol.iterator]()); 
do
{ it = b.next();
} while (console.log(it) || !it.done);

var c = phase[0](("#include \"this should be header_name\"\n" +
                  "\"this should be string_literal\"\n")[Symbol.iterator]()); 
do
{ it = c.next();
} while (console.log(it) || !it.done);

var d = phase[0](("#include <stdio.h>\n" +
                  "// lol\n")[Symbol.iterator]()); 
do
{ it = d.next();
} while (console.log(it) || !it.done);

var e = phase[0](("#define PI 3.141...\n" +
                  "int main(void) { }\n")[Symbol.iterator]())
do
{ it = e.next();
} while (console.log(it) || !it.done);
