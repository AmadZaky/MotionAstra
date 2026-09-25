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

(async () => {
  for (const drop of [undefined, '', 'undefined', 'null', 'EvalScript error.']) {
    const env = environment(drop === undefined ? {} : { drop });
    const status = await env.bridge.call({ action: 'status' });
    assert.equal(status.hostVersion, '2.5.6');
    assert.equal(env.metrics.loads.length, 2, 'Load data and host exactly once');
    const cleaned = await env.bridge.call({ action: 'tool', name: 'unlock' });
    assert.equal(cleaned.changed,1);
    assert.equal(env.metrics.writes, 1, 'Lost replies must NEVER re-run a mutation');
    assert.equal(env.metrics.begins, 1); assert.equal(env.metrics.ends, 1);
    env.host.app.project.activeItem=null;
    await assert.rejects(env.bridge.call({ action: 'apply', id: 'rgb-split', params: {} }), /Open a composition/);
    assert.equal(env.metrics.begins, 2); assert.equal(env.metrics.ends, 2);
    assert.equal(env.metrics.loads.length, 2, 'Do not reset session host on each request');
  }
  for (const [options, expected] of [
    [{ missingFile: true }, /Missing presets-data/],
    [{ failLoad: true }, /bad host syntax/],
    [{ malformed: true }, /damaged reply/]
  ]) await assert.rejects(environment(options).bridge.call({ action: 'status' }), expected);

  const noReply = environment({ loseMailbox: true });
  await assert.rejects(noReply.bridge.call({ action: 'tool', name: 'unlock' }), /not retried/);
  assert.equal(noReply.metrics.writes, 1);
  const undo = environment({ failUndo: true });
  await assert.rejects(undo.bridge.call({ action: 'tool', name: 'unlock' }), /close.*undo group/i);
  assert.equal(undo.metrics.writes, 1);
  const concurrent = environment({ drop: '' });
  const results = await Promise.all(Array.from({ length: 8 }, () => concurrent.bridge.call({ action: 'status' })));
  assert.equal(results.length, 8); assert.equal(concurrent.metrics.loads.length, 2);
  console.log('PASS: real bridge + host in VM; absolute-path boot; quoted Unicode paths; empty/undefined/null/CEP-error recovery; no mutation replay; host/load/undo failures; malformed reply guard; serialized concurrent calls.');
})().catch(e => { console.error(e); process.exit(1); });
