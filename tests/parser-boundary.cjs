const assert=require('node:assert/strict'),vm=require('node:vm'),{create}=require('./host-model.cjs');
// Hypothesis fixture, not a claim that Node reproduces Adobe's VM: string-like regex
// captures must not change JSON literal booleans into Number('true') / NaN.
for(const keep of [true,false]){const e=create(),l=e.comp.add('text');l.selected=true;
vm.runInContext(`var originalExec=RegExp.prototype.exec;RegExp.prototype.exec=function(s){var m=originalExec.call(this,s);if(m&&(m[0]==='true'||m[0]==='false'||m[0]==='null'))m[0]=new String(m[0]);return m;};`,e.context);
const r=e.rpc({action:'tool',name:'anchor',x:.5,y:.5,keep});assert.equal(r.changed,1,r.message);}
for(const loop of [true,false]){const e=create();e.comp.add('text').selected=true;vm.runInContext(`var originalExec=RegExp.prototype.exec;RegExp.prototype.exec=function(s){var m=originalExec.call(this,s);if(m&&(m[0]==='true'||m[0]==='false'||m[0]==='null'))m[0]=new String(m[0]);return m;};`,e.context);const r=e.rpc({action:'apply',id:'counter',params:{loop}});assert.equal(r.changed,1,r.message);assert.equal(e.rpc({action:'load'}).params.loop,loop);}
console.log('PASS: real host JSON dispatch preserves Keep artwork and Loop under simulated string-like RegExp captures.');
