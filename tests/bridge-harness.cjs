/* Regression tests exercise the actual generated evalScript source and actual host. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const base = path.resolve(__dirname, '..');

function environment(options = {}) {
  const metrics = { begins: 0, ends: 0, writes: 0, loads: [], evaluations: 0 };
  function CompItem() { this.name='Test comp';this.selectedLayers=[{name:'Layer',get locked(){return true;},set locked(v){metrics.writes++;}}]; }
  const unused = new CompItem();
  unused.name = 'Unused'; unused.id = 12; unused.usedIn = [];
  unused.remove = () => { metrics.writes++; };
  const project = { activeItem: new CompItem(), numItems: 1, item: () => unused };
  const host = vm.createContext({
    CompItem, app: { project, version: 'mock-AE',
      beginUndoGroup() { metrics.begins++; },
      endUndoGroup() { metrics.ends++; if (options.failUndo) throw Error('undo close failed'); }
    },
    File: function (filename) { return { filename, exists: !options.missingFile }; }
  });
  host.$ = { global: host, evalFile(file) {
    metrics.loads.push(file.filename);
    if (options.failLoad) throw Error('bad host syntax');
    const local = path.join(base,'jsx',file.filename.split('/').pop());
    vm.runInContext(fs.readFileSync(local, 'utf8'), host, { filename: local });
  }};
  const extension = 'C:\\CEP\\User "Åstra"\\MotionAstra-FX';
  const window = { __adobe_cep__: {}, SystemPath: { EXTENSION: 'extension' }, CSInterface: function () {
    this.getSystemPath = () => extension;
    this.evalScript = (source, callback) => {
      metrics.evaluations++;
      let output = vm.runInContext(source, host);
      const isRequest = source.includes('$.global.__MotionAstraLastReply={');
      if (isRequest && options.loseMailbox && metrics.loads.length === 2 && source.includes('$.global.MotionAstra.dispatch')) {
        delete host.__MotionAstraLastReply; output = '';
      } else if (isRequest && options.drop !== undefined) output = options.drop;
      if (isRequest && options.malformed) output = 'MAFX1:%7B';
      setImmediate(() => callback(output));
    };
  }};
  vm.runInNewContext(fs.readFileSync(path.join(base, 'js/bridge.js'), 'utf8'), { window });
  return { bridge: window.MotionAstraBridge, metrics, host };
}


module.exports={environment};
