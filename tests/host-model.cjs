/* Minimal deterministic AE model for control flow, ownership and marker tests.
   Does not validate Adobe effect property schemas or rendered appearance. */
const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
function property(name,value=0){return {name,matchName:name,value,numKeys:0,keys:[],keyTimes:[],canSetExpression:true,expression:'',expressionEnabled:true,expressionError:'',propertyIndex:1,selectedKeys:[],setValue(v){this.value=v;},setValueAtTime(t,v){let i=this.keyTimes.indexOf(t);if(i<0){i=this.keys.length;this.keyTimes.push(t);this.keys.push(v);}else this.keys[i]=v;this.numKeys=this.keys.length;this.value=v;},keyTime(i){return this.keyTimes[i-1];},removeKey(i){this.keys.splice(i-1,1);this.keyTimes.splice(i-1,1);this.numKeys=this.keys.length;},valueAtTime(t,pre){return this.value;},keyValue(i){return this.keys[i-1];},setValueAtKey(i,v){this.keys[i-1]=v;},setInterpolationTypeAtKey(){},setTemporalEaseAtKey(){}};}
class Group{
 constructor(name){this.name=name;this.matchName=name;this.items=[];this.canSetExpression=false;}
 get numProperties(){return this.items.length;}
 property(key){return typeof key==='number'?this.items[key-1]:this.items.find(p=>p.name===key||p.matchName===key);}
 canAddProperty(){return true;}
 addProperty(name){let p;
 if(name==='ADBE Vector Group'){p=new Group(name);p.items=[new Group('ADBE Vectors Group'),transform(true)];}
 else if(name==='ADBE Mask Atom'){p=new Group(name);p.items=[property('ADBE Mask Shape')];}
 else if(name==='ADBE Text Animator'){p=new Group(name);p.items=[new Group('ADBE Text Animator Properties'),new Group('ADBE Text Selectors')];}
 else if(name==='ADBE Text Expressible Selector'){p=new Group(name);p.items=[property('ADBE Text Expressible Amount')];}
 else if(name==='ADBE Vector Shape - Group'){p=new Group(name);p.items=[property('ADBE Vector Shape')];}
 else if(name==='ADBE Vector Graphic - Fill'){p=new Group(name);p.items=[property('ADBE Vector Fill Color')];}
 else if(name==='ADBE Vector Graphic - Stroke'){p=new Group(name);p.items=[property('ADBE Vector Stroke Color'),property('ADBE Vector Stroke Width')];}
 else if(this.name==='ADBE Text Animator Properties')p=property(name);
 else{p=new Group(name);for(let i=0;i<30;i++){const q=property(name+'-'+String(i+1).padStart(4,'0'));q.propertyIndex=i+1;q.parentProperty=p;p.items.push(q);}}
 p.parentProperty=this;Object.defineProperty(p,'propertyIndex',{get:()=>this.items.indexOf(p)+1,configurable:true});p.remove=()=>{this.items=this.items.filter(x=>x!==p);};this.items.push(p);return p;
 }
}
function transform(vector=false){const g=new Group(vector?'ADBE Vector Transform Group':'ADBE Transform Group');const names=vector?['ADBE Vector Position','ADBE Vector Scale','ADBE Vector Rotation','ADBE Vector Group Opacity']:['ADBE Anchor Point','ADBE Position','ADBE Scale','ADBE Rotate Z','ADBE Opacity','ADBE Skew'];g.items=names.map(n=>property(n,n.includes('Scale')?[100,100]:n.includes('Position')||n.includes('Anchor')?[0,0]:n.includes('Opacity')?100:0));return g;}
class MarkerValue{constructor(comment){this.comment=comment;this.params={};}getParameters(){return {...this.params};}setParameters(p){this.params={...p};}}
function cloneMarker(v){const c=new MarkerValue(v.comment);c.params={...v.params};return c;}
class Markers{constructor(){this.keys=[];}get numKeys(){return this.keys.length;}keyTime(i){return this.keys[i-1].time;}keyValue(i){return cloneMarker(this.keys[i-1].value);}setValueAtTime(t,v){const k=this.keys.find(k=>Math.abs(k.time-t)<1e-7);if(k)k.value=cloneMarker(v);else this.keys.push({time:t,value:cloneMarker(v)});this.keys.sort((a,b)=>a.time-b.time);}removeKey(i){this.keys.splice(i-1,1);}}
class SolidSource{constructor(){this.isStill=true;}}
class AVLayer{
 constructor(comp,name='Layer'){this.containingComp=comp;this.name=name;this.locked=false;this.hasVideo=true;this.threeDLayer=false;this.adjustmentLayer=false;this.inPoint=1.5;this.outPoint=7;this.selected=false;this.fx=new Group('ADBE Effect Parade');this.masks=new Group('ADBE Mask Parade');this.enabled=true;this.width=comp.width;this.height=comp.height;const addFx=this.fx.addProperty.bind(this.fx);this.fx.addProperty=name=>{const e=addFx(name);if(name==='ADBE Point3D Control'){e.property(1).valueAtTime=()=>{const expression=e.property(1).expression;if(expression.includes('toWorldVec(')){const d=JSON.parse(expression.match(/toWorldVec\((\[[^)]*\])\)/)[1]);if(this.probeBasis)return this.probeBasis.map(row=>row.reduce((sum,v,i)=>sum+v*(d[i]||0),0));const sc=this.transform.property('ADBE Scale').value,angle=this.transform.property('ADBE Rotate Z').value*Math.PI/180,x=d[0]*sc[0]/100,y=d[1]*sc[1]/100;return [x*Math.cos(angle)-y*Math.sin(angle),x*Math.sin(angle)+y*Math.cos(angle),(d[2]||0)*(sc[2]||100)/100];}const p=this.transform.property('ADBE Position').value;return [p[0],p[1],p[2]||0];};}return e;};this.transform=transform();this.markers=new Markers();this.source={mainSource:{isStill:false},usedIn:[comp],remove(){}};this.parent=null;this.comment='';this.startTime=0;this.selectedProperties=[];}
 get index(){return this.containingComp.items.indexOf(this)+1;}
 get numProperties(){return this.groups().length;}
 groups(){return [this.fx,this.transform,this.markers,this.masks];}
 property(key){if(typeof key==='number')return this.groups()[key-1];return key==='ADBE Effect Parade'?this.fx:key==='ADBE Transform Group'?this.transform:key==='ADBE Marker'?this.markers:key==='ADBE Mask Parade'?this.masks:null;}
 sourceRectAtTime(){return {left:0,top:0,width:320,height:180};}
 sourcePointToComp(v){return v;}
 moveToEnd(){const a=this.containingComp.items;a.splice(a.indexOf(this),1);a.push(this);}
 moveBefore(l){const a=this.containingComp.items;a.splice(a.indexOf(this),1);a.splice(a.indexOf(l),0,this);}
 moveAfter(l){const a=this.containingComp.items;a.splice(a.indexOf(this),1);a.splice(a.indexOf(l)+1,0,this);}
 remove(){const a=this.containingComp.items;a.splice(a.indexOf(this),1);this.source.usedIn=[];}
 duplicate(){const d=new this.constructor(this.containingComp,this.name+' copy');d.inPoint=this.inPoint;d.outPoint=this.outPoint;d.source=this.source;
 for(const f of this.fx.items){const e=d.fx.addProperty(f.matchName);e.name=f.name;for(let i=0;i<f.items.length;i++){e.items[i].value=f.items[i].value;e.items[i].expression=f.items[i].expression;}}
 for(const k of this.markers.keys)d.markers.setValueAtTime(k.time,k.value);this.containingComp.items.unshift(d);return d;}
}
class TextLayer extends AVLayer{constructor(c,n){super(c,n);this.text=new Group('ADBE Text Properties');this.text.items=[new Group('ADBE Text Animators'),property('ADBE Text Document',{text:'Make it move',fontSize:80,fillColor:[1,1,1],toString(){return this.text;}})];}property(k){return k==='ADBE Text Properties'?this.text:super.property(k);}groups(){return super.groups().concat(this.text||[]);}}
class ShapeLayer extends AVLayer{constructor(c,n){super(c,n);this.vectors=new Group('ADBE Root Vectors Group');}property(k){return k==='ADBE Root Vectors Group'?this.vectors:super.property(k);}groups(){return super.groups().concat(this.vectors||[]);}}
class CompItem{
 constructor(name='Comp'){this.name=name;this.items=[];this.duration=8;this.frameRate=30;this.usedIn=[];this.time=4.5;this.width=960;this.height=540;this.pixelAspect=1;this.frameDuration=1/30;this.layers={add:(source)=>{const l=new AVLayer(this,source.name);l.source=source;source.usedIn.push(this);this.items.unshift(l);return l;},addSolid:(color,name)=>{const l=new AVLayer(this,name);l.source.mainSource=new SolidSource();this.items.unshift(l);return l;},addShape:()=>{const l=new ShapeLayer(this,'Artwork');this.items.unshift(l);return l;},addText:text=>{const l=new TextLayer(this,'Text');l.text.property('ADBE Text Document').value.text=text;this.items.unshift(l);return l;},addNull:()=>{const l=new AVLayer(this,'Null');this.items.unshift(l);return l;}};}
 remove(){this.removed=true;}get numLayers(){return this.items.length;}layer(i){return this.items[i-1];}get selectedLayers(){return this.items.filter(l=>l.selected);}
 add(kind){const l=kind==='text'?new TextLayer(this):kind==='shape'?new ShapeLayer(this):new AVLayer(this);if(kind==='solid')l.source.mainSource=new SolidSource();if(kind==='still')l.source.mainSource={isStill:true};if(kind==='audio')l.hasVideo=false;this.items.push(l);return l;}
}
function create(){const comp=new CompItem(),comps=[comp],project={activeItem:comp,expressionEngine:'javascript-1.0',get numItems(){return comps.length;},item(i){return comps[i-1];}};
project.items={addComp(name,w,h,pa,dur,fps){const c=new CompItem(name);Object.assign(c,{width:w,height:h,pixelAspect:pa,duration:dur,frameRate:fps,frameDuration:1/fps});comps.push(c);return c;}};
const context=vm.createContext({MA_PRESET_DATA:JSON.parse(fs.readFileSync(path.join(__dirname,'../presets.json'),'utf8')),app:{project,version:'mock',beginUndoGroup(){},endUndoGroup(){}},CompItem,AVLayer,TextLayer,ShapeLayer,SolidSource,MarkerValue,Shape:function(){},KeyframeEase:function(speed,influence){this.speed=speed;this.influence=influence;},KeyframeInterpolationType:{LINEAR:1,BEZIER:2},ParagraphJustification:{LEFT_JUSTIFY:1,CENTER_JUSTIFY:2,RIGHT_JUSTIFY:3},BlendingMode:{SCREEN:1}});context.$={global:context};
const source=fs.readFileSync(path.join(__dirname,'../jsx/hostscript.jsx'),'utf8');function reload(){vm.runInContext(source,context);}reload();return {comp,comps,context,project,reload,rpc(a){return JSON.parse(context.MotionAstra.dispatch(encodeURIComponent(JSON.stringify(a))));}};}
module.exports={create,CompItem,AVLayer,TextLayer,ShapeLayer,MarkerValue,property};
