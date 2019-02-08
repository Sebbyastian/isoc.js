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
                   return proxy;
                  })(new Proxy({}, {}))
            , 3: iterator => // translation phase 3 is tokenizing whitespace (including comments), header names, identifiers, "preprocessor numbers" (-shudders-), string literals and punctuators
                  (proxy =>
                  { let rxstub              = rx => str => (match => match && match[0])(rx.exec(str))
                      , whitespace          = rxstub(/^((\/\/[^\n]*\n)|(\/\*(?:\*(?!\/)|[^*])*\*\/)|(\s))/)
                      , header_name         = str => o.length >= 3 && !exprcmp({ expr_type: 'punctuator', expr_code: '#'       })(o[0]) &&
                                                                      !exprcmp({ expr_type: 'identifier', expr_code: 'include' })(o.slice(1).find(expr => expr.expr_code.slice(-1) == '\n' || expr.expr_type != 'whitespace')) &&
                                                                      rxstub(/^((\<[^>]+\>)|(\"[^\"]+\"))/)(str) // XXX: It might pay to expose a part of this pattern (the quote-matching part) externally
                      , digit               = rxstub(/^\d+/)
                      , identifier          = str => str.slice(0, (size => size >= 0 ? size : str.length)(Array.from(str).findIndex(c => { try { eval(`var ${c};`); } catch (error) { return true; } })))
                      , preprocessor_number = str => (match => match && preprocessor_tail(match[0], str))(/^\.?\d/.exec(str)) // I haven't tested this...
                      , preprocessor_tail   = (match, str) => match + [ digit
                                                                      , rxstub(/^[EePp][-+]/)
                                                                      , identifier
                                                                      , rxstub(/^[.]/)
                                                                      , preprocessor_number
                                                                      ].reduce((prev, fun) => prev || (match => match && str.slice(match[0].length))(fun(str.slice(match.length))), null)
                      , character_constant  = rxstub(/^[LUu]?'(?:\\'|[^'])*'/)
                      , string_literal      = rxstub(/^([LUu])?"(?:\\"|[^"])*"/)
                      , punctuator          = rxstub(/^(\[|\]|\(|\)|\{|\}|\.\.\.|\.|\+\+|\+\=|\+|\-\-|\-\>|\-\=|\-|\&\&|\&\=|\&|\*\=|\*|\~|\!\=|\!|\/\=|\/|\%\=|\%\>|\%\:\%\:|\%\:|\%|\<\<\=|\<\<|\>\>\=|\>\>|\<\%|\<\:|\<\=|\<|\>\=|\>|\=\=|\=|\^\=|\^|\|\||\|\=|\||\?|\:\>|\:|\;|\,|\#|\#\#)/)
                      , i = []
                      , o = []
                      , tokfn = fn => eval(`({ 'fun':  ${fn}, 'name': fn })`) // -cringe- I know but if you look below we're only using it for single identifiers...
                      , exprcmp = x => y => (x.expr_type && y.expr_type && (x.expr_type > y.expr_type) - (x.expr_type < y.expr_type)) ||
                                            (x.expr_code && y.expr_code && (x.expr_code > y.expr_code) - (x.expr_code < y.expr_code))
                      , evaluate = _ => ((newline_purge => newline_purge && o.splice(0, o.length))(o.length && o.slice(-1)[0].expr_code.slice(-1) == '\n'),
                                         [ tokfn('whitespace')
                                         , tokfn('header_name')
                                         , tokfn('identifier')
                                         , tokfn('preprocessor_number')
                                         , tokfn('character_constant')
                                         , tokfn('punctuator')
                                         , tokfn('string_literal')
                                         ].reduce((prev, fn) => prev || (match => match && (match.length != i.length || match.length == i.length && i.done)
                                                                                        && o[o.push({ done:      match.length == i.length && i.done
                                                                                                    , expr_type: fn.name
                                                                                                    , expr_code: i.splice(0, match.length).join('')
                                                                                                    }) - 1])(fn.fun(i.join(''))), undefined))
                    , readahead = it => it.done ? i.done = it.done
                                                : i.push(it.value) && readahead(iterator.next());
                    proxy.next = _ => (result => result
                                               ? result
                                               : proxy.next())(evaluate(readahead(iterator.next())));
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
