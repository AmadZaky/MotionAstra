const assert=require('node:assert/strict');
const {environment}=require('./bridge-harness.cjs');
(async () => {
  for (const drop of [undefined, '', 'undefined', 'null', 'EvalScript error.']) {
    const env = environment(drop === undefined ? {} : { drop });
    const status = await env.bridge.call({ action: 'status' });
    assert.equal(status.hostVersion, '3.0.8');
    assert.equal(env.metrics.loads.length, 2, 'Load core data and host only; optional modules are lazy');
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

  const oldBuild=environment();oldBuild.host.MotionAstra={version:'3.0.8',build:'previous',dispatch(){throw Error('Stale host reused');}};
  await oldBuild.bridge.call({action:'status'});assert.equal(oldBuild.metrics.loads.length,2,'Same-version hotfix must reload stale host build');
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
