"use strict";

/* Sugar for reading 32-bit words */
function Reader(dv, endian) {
  this.dv     = dv;
  this.endian = endian;
}

Reader.prototype.wordAt = function(idx) {
  return this.dv.getUint32(idx * 4, this.endian);
};

var load = function(dv) {
  if(!(dv instanceof DataView))
    throw 'argument not a DataView';

  /* Determine byte order */
  var endian, magic;
  magic = dv.getUint32(0, 1);

  switch(magic) {
    case 0x950412de:
      endian = 1;
      break;
    case 0xde120495:
      endian = 0;
      break;
    default:
      throw 'bad magic number';
  }

  var rdr = new Reader(dv, endian);

  if(rdr.wordAt(1) != 0)
    throw 'unsupported revision';

  var num_strs     = rdr.wordAt(2);
  var str_tab_off  = rdr.wordAt(3) / 4;
  var tran_tab_off = rdr.wordAt(4) / 4;

  var strs = [];
  for(var i = 0; i < num_strs * 2; i += 2) {
    /* Initialize message state */
    var state = {
      id:        '',
      id_plural: '',
      context:   '',
      strings:   []
    };

    var ctr     = 'ID';
    var str_len = rdr.wordAt(str_tab_off + i);
    var str_off = rdr.wordAt(str_tab_off + i + 1);

    for(var j = 0; j < str_len; ++j) {
      var b = dv.getUint8(str_off + j);

      switch(ctr) {
        case 'CONTEXT':
          if(b == 4)
            throw 'context given twice';

        case 'ID':
          if(b == 0) {
            ctr = 'PLURAL';
          } else if(b == 4) {
            state.context = state.id;
            state.id = '';
            ctr = 'CONTEXT';
          } else {
            state.id += String.fromCharCode(b);
          }
        break;

        case 'PLURAL':
          state.id_plural += String.fromCharCode(b);
        break;
      }
    }

    var tran_len = rdr.wordAt(tran_tab_off + i);
    var tran_off = rdr.wordAt(tran_tab_off + i + 1);

    var tmp = '';
    for(var j = 0; j < tran_len; ++j) {
      var b = dv.getUint8(tran_off + j);
      if(b == 0) {
        state.strings.push(tmp);
        tmp = '';
      } else {
        tmp += String.fromCharCode(b);
      }
    }
    state.strings.push(tmp);

    strs.push(state);
  }

  return strs;
};

module.exports = {
  load: load
};
