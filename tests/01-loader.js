var fs = require('fs'),
    M  = require('../lib/momo');

var getDV = function(name) {
  var data = fs.readFileSync(name);
  var buf  = new Uint8Array(data).buffer;
  return new DataView(buf);
};

exports['single'] = function(test) {
  test.expect(1);

  var dv = getDV('tests/data/single.mo');
  var res = M.load(dv);
  test.deepEqual([{
    id:        'single test',
    id_plural: '',
    context:   '',
    strings:   ['single translation']
  }], res);

  test.done();
};
