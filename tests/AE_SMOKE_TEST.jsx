/* Run from File > Scripts > Run Script File in a disposable project.
   Creates fixtures; does not erase the user's existing compositions. */
(function(){
    var root=File($.fileName).parent.parent;
    $.evalFile(File(root.fsName+'/jsx/presets-data.jsx'));$.evalFile(File(root.fsName+'/jsx/hostscript.jsx'));
    function quote(s){return '"'+String(s).replace(/\\/g,'\\\\').replace(/"/g,'\\"').replace(/\r/g,'\\r').replace(/\n/g,'\\n').replace(/\t/g,'\\t')+'"';}
    function json(v){var a=[],i,k;if(v===null||v===undefined)return 'null';if(typeof v==='string')return quote(v);if(typeof v==='number'||typeof v==='boolean')return String(v);if(v instanceof Array){for(i=0;i<v.length;i++)a.push(json(v[i]));return '['+a.join(',')+']';}for(k in v)if(v.hasOwnProperty(k))a.push(quote(k)+':'+json(v[k]));return '{'+a.join(',')+'}';}
    function rpc(p){return eval('('+MotionAstra.dispatch(encodeURIComponent(json(p)))+')');}
    var report=['MotionAstra 2.5.4 / AE '+app.version],project=app.project||app.newProject(),folder=project.items.addFolder('MotionAstra 2.5 Validation '+new Date().getTime()),failures=0;
    project.expressionEngine='javascript-1.0';
    function log(name,ok,message){report.push((ok?'PASS ':'FAIL ')+name+' — '+message);if(!ok)failures++;}
    function selectOnly(c,l){for(var i=1;i<=c.numLayers;i++)c.layer(i).selected=c.layer(i)===l;}
    function scan(g,t,label){for(var i=1;i<=g.numProperties;i++){var p=g.property(i);if(p.canSetExpression&&p.expression){try{p.valueAtTime(t,false);if(p.expressionError)log(label,false,p.name+': '+p.expressionError);}catch(e){log(label,false,p.name+': '+e);}}else if(p.numProperties)scan(p,t,label);}}
    for(var i=0;i<MA_PRESET_DATA.presets.length;i++){
        var r=MA_PRESET_DATA.presets[i],c=project.items.addComp('MA2.5 • '+r.name,960,540,1,8,30);c.parentFolder=folder;c.openInViewer();var l=null,p={},j;
        if(r.category==='Text'){l=c.layers.addText('Make it move');l.inPoint=1.5;l.outPoint=7;selectOnly(c,l);}c.time=4.5;
        for(j=0;j<r.parameters.length;j++)p[r.parameters[j].id]=r.parameters[j].default;
        try{var applied=rpc({action:'apply',id:r.id,params:p});log(r.name+' Apply',applied.ok&&applied.changed===1,applied.message);if(!applied.changed)continue;l=c.selectedLayers[0];selectOnly(c,l);
            var loaded=rpc({action:'load'});log(r.name+' Load',loaded.ok&&loaded.id===r.id,loaded.message);
            p.progress=50;p.manual=true;if(p.count!==undefined)p.count=Math.min(p.count+1,20);
            var updated=rpc({action:'update',id:r.id,params:p});log(r.name+' Update',updated.ok&&updated.changed===1,updated.message);scan(l,2.5,r.name+' manual');p.manual=false;rpc({action:'update',id:r.id,params:p});
            for(j=0;j<4;j++)scan(l,[l.inPoint,l.inPoint+p.duration*.25,l.inPoint+p.duration*.5,l.inPoint+p.duration][j],r.name+' timeline');
        }catch(e){log(r.name,false,String(e));}
    }
    function point(l){var fx=l.property('ADBE Effect Parade').addProperty('ADBE Point3D Control'),idx=fx.propertyIndex;try{fx.property(1).expression='var p=toWorld([0,0,0]);[p[0],p[1],p.length>2?p[2]:0];';return fx.property(1).value;}finally{l.property('ADBE Effect Parade').property(idx).remove();}}
    function distance(a,b){var n=0;for(var k=0;k<3;k++)n+=Math.pow((a[k]||0)-(b[k]||0),2);return Math.sqrt(n);}
    var c=project.items.addComp('MA2.5 • Tool validation',960,540,1,8,30);c.parentFolder=folder;c.openInViewer();c.time=2;
    var l=c.layers.addSolid([.8,.3,.1],'Anchor fixture',320,180,1,8),tr=l.property('ADBE Transform Group'),parent=c.layers.addNull(8);parent.name='Anchor parent';parent.threeDLayer=true;parent.property('ADBE Transform Group').property('ADBE Rotate Y').setValue(25);l.threeDLayer=true;l.parent=parent;tr.property('ADBE Orientation').setValue([15,20,10]);tr.property('ADBE Scale').setValue([-120,80,100]);selectOnly(c,l);
    for(i=0;i<9;i++){try{var before=point(l),result=rpc({action:'tool',name:'anchor',x:(i%3)/2,y:Math.floor(i/3)/2,keep:true}),after=point(l);log('3D parented anchor '+i,result.changed===1&&distance(before,after)<.01,result.message+'; drift='+distance(before,after));}catch(e){log('3D anchor '+i,false,String(e));}}
    try{var pos=tr.property('ADBE Position');pos.dimensionsSeparated=true;var xp=pos.getSeparationFollower(0);xp.setValueAtTime(0,xp.value);xp.setValueAtTime(4,xp.value+120);selectOnly(c,l);before=point(l);result=rpc({action:'tool',name:'anchor',x:.5,y:.5,keep:true});after=point(l);log('Separated keyed anchor',result.changed===1&&distance(before,after)<.01,result.message);}
    catch(e){log('Separated keyed anchor',false,String(e));}
    try{result=rpc({action:'tool',name:'offset',x:10,y:-10,z:5});log('Offset',result.changed===1,result.message);xp.selected=true;xp.setSelectedAtKey(1,true);xp.setSelectedAtKey(2,true);result=rpc({action:'tool',name:'ease',mode:'both',strength:75});log('Easing',result.changed>=2,result.message);}
    catch(e){log('Offset/ease',false,String(e));}
    var t=c.layers.addText('Style test');selectOnly(c,t);result=rpc({action:'tool',name:'style',size:72,color:'#ff8800',align:'center'});log('Text style',result.changed===1,result.message);
    for(i=0;i<6;i++){result=rpc({action:'tool',name:'arrange',mode:['top','bottom','up','down','reverse','name'][i]});log('Arrange '+i,result.ok,result.message);}
    result=rpc({action:'tool',name:'rename',prefix:'Title'});log('Rename',result.changed===1,result.message);result=rpc({action:'tool',name:'stagger',seconds:.1});log('Stagger',result.changed===1,result.message);
    result=rpc({action:'tool',name:'parent'});log('Parent null',result.changed===1,result.message);selectOnly(c,t);result=rpc({action:'tool',name:'unparent'});log('Unparent',result.changed===1,result.message);
    t.locked=true;result=rpc({action:'tool',name:'unlock'});log('Unlock',result.changed===1,result.message);
    result=rpc({action:'apply',id:'counter',params:{}});log('Counter defaults',result.changed===1,result.message);var keep=t.property('ADBE Effect Parade').addProperty('ADBE Fill');keep.name='User effect';result=rpc({action:'tool',name:'remove'});log('Remove owned only',result.changed===1&&t.property('ADBE Effect Parade').numProperties===1,result.message);result=rpc({action:'tool',name:'eraseAll'});log('Erase all',result.changed===1&&t.property('ADBE Effect Parade').numProperties===0,result.message);
    for(var ni=0;ni<3;ni++){var kind=['newShape','newText','newSolid'][ni];try{c.openInViewer();c.time=2;var beforeCount=c.numLayers;var created=rpc({action:'tool',name:kind,color:'#ff943f'});log(kind,created.changed===1&&c.numLayers===beforeCount+1&&c.selectedLayers.length===1,created.message);scan(c.selectedLayers[0],2,kind);}catch(e){log(kind,false,String(e));}}
    report.push('Failures: '+failures);report.push('Expression/control checks are not visual acceptance. RAM-preview each fixture and inspect appearance.');
    var file=File.saveDialog('Save MotionAstra validation report','*.txt');if(file){file.encoding='UTF-8';if(file.open('w')){file.write(report.join('\n'));file.close();}}
    alert('MotionAstra validation finished. Failures: '+failures+'. Inspect the fixtures and saved report.');
})();
