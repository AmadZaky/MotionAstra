const assert=require('node:assert/strict'),{create}=require('./host-model.cjs'),data=require('../presets.json');
assert(!data.presets.some(r=>r.id==='stamp'));assert(data.presets.some(r=>r.id==='pantext'));
for(const r of data.presets.filter(r=>r.category==='Text')){
 const e=create(),l=e.comp.add('text');l.selected=true;assert.equal(e.rpc({action:'apply',id:r.id,params:{tint:'#ff2200'}}).changed,1);
 const native=l.fx.property('MA2 native text color')||l.fx.property('MA2 native matrix tint')||l.fx.property('MA2 native ramp'),index=native&&native.name==='MA2 native ramp'?2:3;assert(native,r.id+' needs stable text color');assert.deepEqual(Array.from(native.property(index).value),[1,34/255,0,1]);
 assert.equal(e.rpc({action:'update',id:r.id,params:{tint:'#33cc66'}}).changed,1);assert.deepEqual(Array.from(native.property(index).value),[.2,.8,.4,1]);
}
const e=create();e.context.app.fonts={allFonts:[[{postScriptName:'Inter-Regular',familyName:'Inter',styleName:'Regular'}]]};
assert.equal(e.rpc({action:'fonts'}).fonts[0].value,'Inter-Regular');assert.equal(e.rpc({action:'tool',name:'newText',font:'Inter-Regular'}).changed,1);assert.equal(e.comp.selectedLayers[0].text.property('ADBE Text Document').value.font,'Inter-Regular');
const a=e.comp.selectedLayers[0];a.transform.property('ADBE Anchor Point').value=[160,90];assert.equal(e.rpc({action:'tool',name:'align',mode:'center'}).changed,1);assert.deepEqual(Array.from(a.transform.property('ADBE Position').value),[480,270]);
const b=e.comp.add('solid'),c=e.comp.add('solid');for(const [l,x] of [[a,0],[b,100],[c,600]]){l.selected=true;l.transform.property('ADBE Anchor Point').value=[160,90];l.transform.property('ADBE Position').value=[x,100];}
assert.equal(e.rpc({action:'tool',name:'distribute',axis:'x'}).changed,3);assert.equal(b.transform.property('ADBE Position').value[0],300);
console.log('PASS: replacement preset, stable text colors, installed font selection, comp alignment and distribution.');
// A rotated, mirrored parent: comp delta must be inverted into parent space.
const pe=create(),parent=pe.comp.add('solid'),child=pe.comp.add('text');child.parent=parent;child.selected=true;
parent.transform.property('ADBE Scale').value=[-200,50];parent.transform.property('ADBE Rotate Z').value=90;parent.transform.property('ADBE Position').value=[100,80];child.transform.property('ADBE Anchor Point').value=[160,90];
assert.equal(pe.rpc({action:'tool',name:'align',mode:'center'}).changed,1);
let pos=child.transform.property('ADBE Position').value;assert(Math.abs(pos[0]+95)<1e-6);assert(Math.abs(pos[1]+760)<1e-6);
// Selecting both ancestor and descendant still centers both, with no double shift.
parent.selected=true;parent.transform.property('ADBE Anchor Point').value=[160,90];assert.equal(pe.rpc({action:'tool',name:'align',mode:'center'}).changed,2);pos=child.transform.property('ADBE Position').value;assert(Math.abs(pos[0]-160)<1e-6);assert(Math.abs(pos[1]-90)<1e-6);
child.threeDLayer=true;parent.selected=false;const before=JSON.stringify(pos);assert.equal(pe.rpc({action:'tool',name:'align',mode:'left'}).changed,0);assert.equal(JSON.stringify(child.transform.property('ADBE Position').value),before);
assert.equal(pe.rpc({action:'tool',name:'distribute',axis:'y'}).ok,false);
const count=e.comp.numLayers;assert.equal(e.rpc({action:'tool',name:'newText',font:'Missing-Font'}).ok,false);assert.equal(e.comp.numLayers,count);
console.log('PASS: mirrored/rotated parent alignment, selected hierarchy, 3D skip and missing-font guard.');
const old=create(),oldText=old.comp.add('text');oldText.selected=true;assert.equal(old.rpc({action:'apply',id:'gold',params:{}}).changed,1);
const oldAnimator=oldText.text.property('ADBE Text Animators').property(1),obsolete=oldAnimator.property('ADBE Text Animator Properties').addProperty('ADBE Text Fill Color');obsolete.expression='// MotionAstra 2 obsolete\n0';oldText.comment=oldText.comment.replace(encodeURIComponent('2.8.4'),'old-build');oldText.fx.property('MA2 native ramp').property(2).expression='// MotionAstra 2 obsolete\n0';
assert.equal(old.rpc({action:'update',id:'gold',params:{tint:'#ff0000'}}).changed,1);assert.equal(oldAnimator.property('ADBE Text Animator Properties').property('ADBE Text Fill Color'),undefined);assert.equal(oldText.fx.property('MA2 native ramp').property(2).expression,'');
console.log('PASS: old Text FX color expressions retire before clock migration.');
