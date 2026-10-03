const assert=require('node:assert/strict'),vm=require('node:vm'),{create}=require('./host-model.cjs');
const e=create(),l=e.comp.add('text');l.selected=true;
assert.equal(e.rpc({action:'apply',id:'switcher',params:{phrases:'ONE\nTWO\nTHREE',choice:1,switchMode:0}}).changed,1);
const choice=l.fx.property('MA2 choice');assert(choice,'Compact Switcher must expose an animatable Choice controller');
function text(value,time=l.inPoint){return vm.runInNewContext(l.text.property('ADBE Text Document').expression,{Math,time,inPoint:l.inPoint,thisComp:{frameDuration:1/30},marker:{numKeys:0},effect:n=>i=>({value:n==='MA2 choice'?value:l.fx.property(n).property(i).value})});}
assert.equal(text(1),'ONE');assert.equal(text(2),'TWO');assert.equal(text(3),'THREE');assert.equal(text(99),'THREE');
const slider=choice.property(1);slider.setValueAtTime(1,1);slider.setValueAtTime(3,3);const keys=JSON.stringify(slider.keys);
assert.equal(e.rpc({action:'load'}).params.choice,3);
assert.equal(e.rpc({action:'update',id:'switcher',params:{phrases:'ONE\nTWO\nTHREE',choice:1,tint:'#ff0000'}}).changed,1);assert.equal(JSON.stringify(slider.keys),keys,'Unrelated updates must preserve choice keys');
e.comp.time=2;assert.equal(e.rpc({action:'update',id:'switcher',editChoice:true,params:{phrases:'ONE\nTWO\nTHREE',choice:2}}).changed,1);assert.equal(slider.keys[slider.keyTimes.indexOf(2)],2);
choice.remove();l.comment=l.comment.replace(encodeURIComponent('3.5.2'),'old-build');assert.equal(e.rpc({action:'load'}).ok,true);assert.equal(e.rpc({action:'update',id:'switcher',params:{phrases:'A\nB',choice:2}}).changed,1);assert(l.fx.property('MA2 choice'));assert.equal(text(2),'B');
assert.equal(e.rpc({action:'update',id:'switcher',params:{phrases:'A\nB',choice:1,switchMode:1,loopMode:0,ease:0,duration:2}}).changed,1);assert.equal(text(1,l.inPoint+2),'B','Automatic mode remains timeline-driven');
console.log('PASS: compact Choice controls text, reads native values, preserves animation, explicit edits key at CTI, migrates old instances and retains automatic mode.');
for(const layout of ['compact','legacy']){const e=create(),l=e.comp.add('text');l.selected=true;e.rpc({action:'apply',id:'switcher',layout,params:{}});const p=l.fx.property('MA2 choice').property(1);p.setValueAtTime(1,1);p.setValueAtTime(2,2);const keys=JSON.stringify(p.keys);e.rpc({action:'update',id:'switcher',params:{tint:'#336699'}});assert.equal(JSON.stringify(p.keys),keys);p.expression='2';const r=e.rpc({action:'update',id:'switcher',editChoice:true,params:{choice:3}});assert.equal(r.changed,0);assert.equal(p.expression,'2');assert.equal(JSON.stringify(p.keys),keys);}
console.log('PASS: both layouts preserve keyed Choice and reject expression-driven edits before mutation.');
