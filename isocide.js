with (document)
{ with (body = createElement('body'))
  { var file = appendChild(createElement('div'))
      , path = appendChild(createElement('div'))
      , path_list = appendChild(createElement('select'))
      , relfn = path => Array.from(path).reduce((str, c) => c == '/' ? '' : str.concat(c), '')
      , absfn = path_ =>
                  path => 
                    (match => !match || match.length == 0 ? path
                            : match[1].slice(-1) == '/' ? path ? match[1].concat(path) : match[1]
                            : match[2].slice(-1) == '/' ? path ? match[2].concat(path) : match[2]
                            : match[1] && path == relfn(match[1])
                                        ? match[1]
                            : match[2] && path == relfn(match[2])
                                        ? match[2]
                                        : path)(/^(?:\<([^>]+)\>)|(?:"([^"])")$/.exec(path_))
      , tokenise = _ =>
        { with (file)
          { var token = phase[3](phase[2](phase[1](innerText[Symbol.iterator]())))
              , state = ({ 'diff_search': (ot, ot_distance, it, it_distance, token_list, tail_value, tail_type) =>
                                            ot.value[ot_distance] == undefined
                                            ? ot.done
                                              ? token_list.concat({ 'type':  tail_type || ot.type
                                                                  , 'value': it.slice(0, it_distance)
                                                                  , 'put_by': 'diff'
                                                                  })
                                              : state['diff_search'](token.next(), 0, it.slice(it_distance), 0
                                                                                 , token_list.concat({ 'type':  tail_type || ot.type
                                                                                                     , 'value': it.slice(0, it_distance)
                                                                                                     , 'put_by': 'diff'
                                                                                                     }), '')
                                              : state[ot.value[ot_distance] == it[it_distance] ? 'diff_search' : 'same_search'](ot, ot_distance + 1, it, it_distance + 1, token_list, tail_value + it[it_distance], tail_type || ot.type)
                         , 'same_search': (ot, ot_distance, it, it_distance, token_list, tail_value, tail_type) =>
                                            ot.value[ot_distance] == undefined
                                            ? ot.done
                                              ? token_list.concat({ 'type':  tail_type || ot.type
                                                                  , 'value': it.slice(0, it.length)
                                                                  , 'put_by': 'same'
                                                                  })
                                              : state['same_search'](token.next(), 0, it, it_distance, token_list, tail_value, tail_type || ot.type)
                                            : ot.value[ot_distance] == it[it_distance]
                                              ? state['diff_search'](ot, ot_distance, it.slice(it_distance), 0
                                                                       , token_list.concat({ 'type':  tail_type || ot.type
                                                                                           , 'value': it.slice(0, it_distance)
                                                                                           , 'put_by': 'same'
                                                                                           }), '')
                                              : state['same_search'](ot, ot_distance, it, it_distance + 1, token_list, tail_value, tail_type || ot.type)
                         })
              , element = state.diff_search(token.next(), 0, innerText, 0, [], '').map(expr =>
                                                                                        (elem =>
                                                                                        { with (elem)
                                                                                          { className = expr.type;
                                                                                            innerText = expr.value;
                                                                                            setAttribute('data-put-by', expr.put_by);
                                                                                          }
                                                                                          return elem;
                                                                                        })(document.createElement('span')))
              , selection, range;
            with (selection = window.getSelection())
            { with (range = getRangeAt(0))
              { setStart(file, 0);
                var cursor_offset = selection.toString().length;
                console.assert(firstChild == file.firstChild);
                while (firstChild)
                  removeChild(firstChild);
                element = element.reduce((list, elem) => list.concat(appendChild(elem).nodeType == 3 ? [ elem ] : Array.from(elem.childNodes)), []);
                element.reduce((tail, elem) =>
                                 tail || ( selection.toString().length + (elem.nodeType != 3 || elem.length)  < cursor_offset ? (setEndAfter(elem), null)
                                         : selection.toString().length + (elem.nodeType != 3 || elem.length) == cursor_offset ? (setEndAfter(elem), elem)
                                                                                                                              : (setEnd(elem, (elem.nodeType != 3 || elem.length) -
                                                                                                                                              (selection.toString().length + (elem.nodeType != 3 || elem.length)) % cursor_offset), elem)
                                         ), null) || selectNodeContents(file);
                collapse();
              }
            }
            return element;
          }
        }
    with (file)
    { with (attributes)
      { className = 'empty file';
        contentEditable = true;
      }
      oninput = _ =>
                { tokenise();
                  with (path_list)
                  { childNodes[selectedIndex].setAttribute('data-source', file.innerText);
                  }
                }
    }  
    with (path_list)
    { with (attributes)
      { className = 'path_list';
        size = 2;
      };
      var mkpath = (path, node) =>
                   { with (node = appendChild(createElement('option')))
                     { attributes.className = 'empty';
                       innerText = path;
                     }
                     return node;
                   }; 
      var new_path = mkpath('New path');
      mkpath('<https://path/to/external/stdlib/dir/>');
      mkpath('"https://github.com/Sebbyastian/patricia/blob/master/"');
      mkpath('"https://github.com/Sebbyastian/1-23/blob/master/main.c"');
      var iterator = elem =>
                     { while (elem.firstChild)
                         elem.removeChild(elem.firstChild);
                       elem.appendChild(selectedOptions[0].firstChild.cloneNode());
                     };
      oninput = event =>
                { with (event.target)
                  { childNodes[selectedIndex] == new_path
                  ? (mkpath('').selected = true) && path.focus()
                  : Array.from(document.getElementsByClassName('path'))
                         .forEach(elem => elem.innerText = childNodes[selectedIndex].innerText)
                  , file.innerText = childNodes[selectedIndex].getAttribute('data-source')
                  , tokenise()
                  }
                }
    }
    with (path)
    { with (attributes)
      { className = 'empty path';
        contentEditable = true;
      }
      oninput = event =>
                { with (path_list)
                  { childNodes[selectedIndex].innerText = event.target.innerText;
                  }
                };
    }
  }
}
