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
                      , whitespace          = rxstub(/^((\/\/[^\n]*\n)|(\/\*(?:\*(?!\/)|[^*])*\*\/)|(\s+))/)
                      , header_name         = rxstub(/^((\<[^>]+\>)|(\"[^\"]+\"))/)
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
                      , window = []
                      , tokfn = fn => eval(`({ 'fun':  ${fn}, 'name': fn })`) // -cringe- I know but if you look below we're only using it for single identifiers...
                      , evaluate = c =>
                                     (size => [ tokfn('whitespace')
                                              , tokfn('header_name')
                                              , tokfn('identifier')
                                              , tokfn('preprocessor_number')
                                              , tokfn('character_constant')
                                              , tokfn('punctuator')
                                              , tokfn('string_literal')
                                              ].reduce((prev, fn) => prev || (match => match && match.length != size && { done:      c.done
                                                                                                                        , expr_type: fn.name
                                                                                                                        , expr_code: window.splice(0, match.length).join('')
                                                                                                                        })(fn.fun(window.join(''))), undefined))(!c.done && window.push(c.value))
                    proxy.next = _ => (result => result
                                               ? result
                                               : proxy.next())(evaluate(iterator.next()))
                   return proxy;
                  })(new Proxy({}, {}))
            };
            
var it;
var a = phase[0]('??=define ??/\nfubar \\\n42'[Symbol.iterator]());
do
{ it = a.next();
} while (console.log(it) || !it.done);


var b = phase[0]("Let's /* not */ strip some comments // and say we did\n"[Symbol.iterator]()); 
do
{ it = b.next();
} while (console.log(it) || !it.done);
