with (document)
{ with (body = createElement('body'))
  { with (appendChild(createElement('div')))
    { with (attributes)
      { className = 'file';
        contentEditable = true;
      }
      oninput = _ =>
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
                                                                          , 'value': it.slice(0, it_distance)
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
                                                                                                 }
                                                                                                 return elem;
                                                                                               })(document.createElement('span')));
                  var selection = window.getSelection()
                    , cursor_node = selection.anchorNode
                    , cursor_offset = 0
                    , range = null;
                  while (firstChild && firstChild != cursor_node)
                  { cursor_offset += firstChild.innerText.length;
                    removeChild(firstChild);
                  }
                  while (firstChild)
                    removeChild(firstChild);
                  element.forEach(elem => 
                                  { appendChild(elem);
                                    if (cursor_offset >= 0 && cursor_offset <= elem.innerText.length)
                                    { with (range = document.createRange())
                                      { setStartAfter(elem);
                                        collapse(true);
                                      }
                                    }
                                    cursor_offset -= elem.innerText.length;
                                  });
                  selection.removeAllRanges();
                  if (range)
                    selection.addRange(range);
                  
                };
    }
    with (appendChild(createElement('div')))
    { with (attributes)
      { className = 'file_name';
        contentEditable = true;
      }
      
    }
    with (appendChild(createElement('select')))
    { with (attributes)
      { className = 'file_name_list';
        size = 2;
      }
      appendChild(createElement('option')).innerText = 'file_name #1';
      appendChild(createElement('option')).innerText = 'file_name #2';
      appendChild(createElement('option')).innerText = 'file_name #3';
      var iterator = elem =>
                     { while (elem.firstChild)
                         elem.removeChild(elem.firstChild);
                       elem.appendChild(selectedOptions[0].firstChild.cloneNode());
                     };
      oninput = _ => Array.from(document.getElementsByClassName('file_name')).forEach(iterator)
    }
  }
}
