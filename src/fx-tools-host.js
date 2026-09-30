/* Native AE adapters; no commercial plugin dependency. */
var recordPattern=/\n?\[MA_FXTOOLS\]([^\r\n]*)\[\/MA_FXTOOLS\]/,expressionPrefix='// MotionAstra FXTools\n';
function recipe(id){for(var i=0;i<registry.effects.length;i++)if(registry.effects[i].id===id)return registry.effects[i];throw Error('Unknown FXTools effect.');}
function parameters(r,input){var o={},i,d,v;input=input||{};for(i=0;i<r.parameters.length;i++){d=r.parameters[i];v=input[d.id]===undefined?d.default:input[d.id];if(d.type==='number'){if(typeof v!=='number'||!isFinite(v)||v<d.min||v>d.max)throw Error('Invalid '+d.label+'.');}else if(d.type==='color'){if(typeof v!=='string'||!/^#[0-9a-f]{6}$/i.test(v))throw Error('Invalid '+d.label+'.');}else if(d.type==='checkbox'){if(v!==true&&v!==false&&v!==0&&v!==1)throw Error('Set '+d.label+' ON or OFF.');v=v===true||v===1;}o[d.id]=v;}return o;}
function rgba(s){return [parseInt(s.substr(1,2),16)/255,parseInt(s.substr(3,2),16)/255,parseInt(s.substr(5,2),16)/255,1];}
function read(l,codec){var m=String(l.comment||'').match(recordPattern);return m?codec.parse(m[1]):{};}
function save(l,m,codec){var base=String(l.comment||'').replace(recordPattern,'');var any=false;for(var k in m)if(m.hasOwnProperty(k))any=true;l.comment=base+(any?'\n[MA_FXTOOLS]'+codec.encode(m)+'[/MA_FXTOOLS]':'');}
function group(l){var g=l.property('ADBE Effect Parade');if(!g||!l.hasVideo||l.nullLayer)throw Error('Select a visual text, shape, solid, footage or precomp layer.');if(l.locked)throw Error('Layer is locked.');return g;}
function identity(c,l,m){return {comp:typeof c.id==='number'?c.id:c.name,layer:typeof l.id==='number'?l.id:l.index,token:m.token};}
function find(g,name,match){var found=null;for(var i=1;i<=g.numProperties;i++)if(g.property(i).name===name){if(found)throw Error('Duplicate FXTools native effect: '+name);found=g.property(i);}if(found&&found.matchName!==match)throw Error('FXTools effect was replaced: '+name);return found;}
function param(g,name,match){var e=g.property(name),p=e?e.property(match):null;if(!p||!p.setValue)throw Error('Native parameter unavailable: '+match);return p;}
function spec(id,key,match,values,expressions,enabled){return {name:'MAFT '+id+' | '+key,match:match,values:values||{},expressions:expressions||{},enabled:enabled!==false};}
function glow(id,key,radius,intensity,threshold){var p={};p['ADBE Glo2-0001']=threshold;p['ADBE Glo2-0002']=radius;p['ADBE Glo2-0003']=intensity;return spec(id,key,'ADBE Glo2',p,null,intensity>0);}
function descriptors(id,p){
    if(id==='bloom')return [spec(id,'source tint','ADBE Fill',{'ADBE Fill-0003':rgba(p.color)},null,p.tint),glow(id,'core',p.radius,p.intensity,p.threshold),glow(id,'halo',p.radius*p.spread,p.intensity*p.falloff,p.threshold),glow(id,'bloom',p.radius*p.spread*2,p.intensity*p.falloff*p.falloff,p.threshold)];
    if(id==='prism'){
        function point(end){return expressionPrefix+'var r=sourceRectAtTime(time,false);var w=Math.max(1,r.width),h=Math.max(1,r.height);var cx=r.left+w*'+(p.centerX/100)+',cy=r.top+h*'+(p.centerY/100)+';var a=('+p.angle+(p.animate?'+Math.max(0,time-inPoint)*360/'+p.duration:'')+')*Math.PI/180;var d=Math.max(w,h)*'+(p.spread/200)+';'+(p.radial&&p.animate?'cx+=w*.15*Math.cos(a);cy+=h*.15*Math.sin(a);':'')+(p.radial&&!end?'[cx,cy];':'[cx'+(end?'+':'-')+'Math.cos(a)*d,cy'+(end?'+':'-')+'Math.sin(a)*d];');}
        return [spec(id,'gradient','ADBE Ramp',{'ADBE Ramp-0002':rgba(p.colorA),'ADBE Ramp-0004':rgba(p.colorB),'ADBE Ramp-0005':p.radial?2:1,'ADBE Ramp-0006':10,'ADBE Ramp-0007':p.blend},{'ADBE Ramp-0001':point(false),'ADBE Ramp-0003':point(true)}),spec(id,'organic distortion','ADBE Turbulent Displace',{'ADBE Turbulent Displace-0002':p.distortion,'ADBE Turbulent Displace-0003':p.size},null,p.distortion>0),spec(id,'diffusion','ADBE Gaussian Blur 2',{'ADBE Gaussian Blur 2-0001':p.diffusion,'ADBE Gaussian Blur 2-0002':1,'ADBE Gaussian Blur 2-0003':1},null,p.diffusion>0),glow(id,'glow',p.radius,p.glow,35)];
    }
    throw Error('No native adapter for this effect.');
}
function transact(l,specs){
    var g=group(l),i,k,e,p,s,created=[],snapshots=[],enabled=[],started=false;
    // Validate existing effects first; never erase user-authored keyframes/expressions.
    for(i=0;i<specs.length;i++){
        s=specs[i];e=find(g,s.name,s.match);if(!e){if(!g.canAddProperty(s.match))throw Error('Native effect unavailable: '+s.match);continue;}
        enabled.push({name:s.name,value:e.enabled});
        for(k in s.values)if(s.values.hasOwnProperty(k)){p=param(g,s.name,k);if(p.numKeys||p.expression)throw Error('Native parameter has animation: '+s.name+'. Remove its animation before panel Update.');snapshots.push({name:s.name,key:k,value:p.value,expression:p.expression||'',expressionEnabled:p.expressionEnabled});}
        for(k in s.expressions)if(s.expressions.hasOwnProperty(k)){p=param(g,s.name,k);if(p.numKeys||(p.expression&&p.expression.indexOf(expressionPrefix)!==0))throw Error('Native parameter has external animation: '+s.name);snapshots.push({name:s.name,key:k,value:p.value,expression:p.expression||'',expressionEnabled:p.expressionEnabled});}
    }
    try{
        for(i=0;i<specs.length;i++){s=specs[i];if(!find(g,s.name,s.match)){e=g.addProperty(s.match);e.name=s.name;created.push(s.name);}}
        for(i=0;i<specs.length;i++){
            s=specs[i];started=true;g.property(s.name).enabled=s.enabled;
            for(k in s.values)if(s.values.hasOwnProperty(k))param(g,s.name,k).setValue(s.values[k]);
            for(k in s.expressions)if(s.expressions.hasOwnProperty(k)){p=param(g,s.name,k);p.expression=s.expressions[k];p.expressionEnabled=true;if(p.expressionError)throw Error(p.expressionError);}
        }
    }catch(error){var rollback=true;for(i=snapshots.length-1;i>=0;i--)try{s=snapshots[i];p=param(g,s.name,s.key);p.expression='';p.setValue(s.value);p.expression=s.expression;p.expressionEnabled=s.expressionEnabled;}catch(ignore){rollback=false;}for(i=0;i<enabled.length;i++)try{g.property(enabled[i].name).enabled=enabled[i].value;}catch(ignore2){rollback=false;}for(i=created.length-1;i>=0;i--)try{g.property(created[i]).remove();}catch(ignore3){rollback=false;}throw Error(String(error)+(rollback?' Original effects restored.':' Undo once: rollback was incomplete.'));}
}
function remove(l,id,codec){var g=group(l),prefix='MAFT '+id+' | ',i;for(i=g.numProperties;i>=1;i--)if(g.property(i).name.indexOf(prefix)===0)g.property(i).remove();var m=read(l,codec);delete m[id];save(l,m,codec);}
function clearAll(l,codec){var g=l.property('ADBE Effect Parade'),i;if(!g)return;for(i=g.numProperties;i>=1;i--)if(g.property(i).name.indexOf('MAFT ')===0)g.property(i).remove();l.comment=String(l.comment||'').replace(recordPattern,'');}
function run(a,codec){
    var c=app.project.activeItem;if(!(c instanceof CompItem))throw Error('Open a composition first.');var ls=c.selectedLayers,r=recipe(a.id),i,l,m,p,count=0,lines=[];
    if(!ls.length)throw Error('Select an existing visual layer. FXTools never generates layers.');
    if(a.operation==='load'){
        if(ls.length!==1)throw Error('Select one layer to load FXTools settings.');l=ls[0];m=read(l,codec)[r.id];if(!m)throw Error('No '+r.name+' on this layer. Apply it first.');
        return {ok:true,id:r.id,params:m.params,target:identity(c,l,m),layerName:l.name,message:'Loaded '+r.name+' from '+l.name+'.'};
    }
    if(a.operation!=='apply'&&a.operation!=='update'&&a.operation!=='remove')throw Error('Unknown FXTools operation.');
    if(a.target){if(ls.length!==1)throw Error('Select only the loaded FXTools layer.');m=read(ls[0],codec)[r.id];var actual=m?identity(c,ls[0],m):null;if(!actual||actual.comp!==a.target.comp||actual.layer!==a.target.layer||actual.token!==a.target.token)throw Error('Selection changed. Load FXTools settings again.');}
    if(a.operation!=='remove')p=parameters(r,a.params);
    for(i=0;i<ls.length;i++){
        l=ls[i];try{group(l);m=read(l,codec);if(a.operation==='remove'){remove(l,r.id,codec);count++;continue;}if(a.operation==='update'&&!m[r.id])throw Error('No '+r.name+' instance. Click Apply first.');
            transact(l,descriptors(r.id,p));m[r.id]={token:m[r.id]?m[r.id].token:'ft_'+new Date().getTime()+'_'+i,params:p};save(l,m,codec);count++;
        }catch(e){lines.push(l.name+': '+String(e));}
    }
    return {ok:true,changed:count,severity:lines.length?'warning':'success',message:r.name+': '+count+' layer(s) '+(a.operation==='remove'?'cleared.':'updated.')+(lines.length?'\n'+lines.join('\n'):'')};
}
return {run:run,clearAll:clearAll};
