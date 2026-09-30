const assert=require('node:assert/strict'),{environment}=require('./bridge-harness.cjs');
(async()=>{
 for(const breakHost of [h=>delete h.MotionAstra,h=>h.MotionAstra={version:'old',build:'old',dispatch:()=>{throw Error('stale dispatcher');}}]){
  const e=environment();await e.bridge.call({action:'status'});breakHost(e.host);
  const r=await e.bridge.call({action:'tool',name:'unlock'});
  assert.equal(r.changed,1);assert.equal(e.metrics.writes,1);
  assert.equal(e.metrics.loads.length,4,'lost/replaced runtime reloads once before a mutation');
 }
 const d=environment();d.host.app.effects=[{matchName:'ADBE Ramp'}];const report=await d.bridge.call({action:'diagnostics'});assert.equal(report.nativeEffects['ADBE Ramp'],true);assert.equal(report.nativeEffects['ADBE Bevel Alpha'],false);assert.equal(d.metrics.begins,0);assert.equal(d.metrics.writes,0);
 console.log('PASS: missing/replaced AE globals recover before dispatch without replaying a mutation.');
})().catch(e=>{console.error(e);process.exit(1);});
