const assert=require('node:assert/strict'),vm=require('node:vm'),{create}=require('./host-model.cjs');
for(const [mode,expected] of [[0,[0,100,50,0]],[1,[0,0,50,0]],[2,[0,100,150,200]],[3,[0,100,100,100]]]){
 const e=create(),l=e.comp.add('text');l.selected=true;assert.equal(e.rpc({action:'apply',id:'counter',params:{start:0,end:100,duration:2,ease:0,loopMode:mode}}).changed,1);
 const expression=l.text.property('ADBE Text Document').expression;
 const ctx={inPoint:l.inPoint,thisComp:{frameDuration:1/30},marker:{numKeys:0},effect:name=>i=>({value:l.fx.property(name).property(i).value}),Math};
 for(const [i,t] of [0,2,3,4].entries()){ctx.time=l.inPoint+t;assert.equal(Number(vm.runInNewContext(expression,ctx)),expected[i],'mode '+mode+' time '+t);}
 assert.equal(e.rpc({action:'load'}).params.loopMode,mode);
}
console.log('PASS: real counter expressions implement Ping-Pong, Cycle, Continue and None, including boundaries.');
