/* MotionAstra integration. Original YUGraphic motion math is unchanged. */
var originalExpression=YTMCore.expression, currentOptions=null;
YTMCore.expression=function(p,channel,phase,options){
    var expression=originalExpression(p,channel,phase,options);
    var values={Duration:currentOptions.duration,Stagger:currentOptions.stagger,Intensity:currentOptions.intensity,Seed:currentOptions.seed,Offset:0};
    return expression.replace(/effect\("[^"\n]+ \| (Duration|Stagger|Intensity|Seed|Offset)"\)\(1\)/g,function(all,key){return '('+values[key]+')';});
};
function choose(value,list,label){for(var i=0;i<list.length;i++)if(value===list[i])return value;throw Error('Invalid YU '+label+'.');}
function numeric(value,min,max,label){if(typeof value!=='number'||!isFinite(value)||value<min||value>max)throw Error('Invalid YU '+label+'. Expected '+min+'–'+max+'.');return value;}
function options(a){return {mode:choose(a.mode,['IN','OUT','BOTH'],'mode'),duration:numeric(a.duration,.01,10,'duration'),stagger:numeric(a.stagger,0,2,'stagger'),intensity:numeric(a.intensity,0,200,'intensity'),seed:Math.round(numeric(a.seed,0,99999,'seed')),group:choose(a.group,['chars','charsNoSpaces','words','lines','all'],'group'),order:choose(a.order,['forward','reverse','center','edges','random','together'],'order'),easing:choose(a.easing,['preset','smooth','cubic','quint','expo','back','bounce','elastic','linear','step','steps'],'easing'),placement:choose(a.placement,['edges','playhead'],'placement'),playhead:0};}
var recordPattern=/\n?\[MA_YU\]([^\r\n]*)\[\/MA_YU\]/;
function read(layer,codec){var m=String(layer.comment||'').match(recordPattern);return m?codec.parse(m[1]):null;}
function write(layer,m,codec){layer.comment=String(layer.comment||'').replace(recordPattern,'')+'\n[MA_YU]'+codec.encode(m)+'[/MA_YU]';}
function identity(c,l,m){return {comp:typeof c.id==='number'?c.id:c.name,layer:typeof l.id==='number'?l.id:l.index,token:m.token};}
function clear(layer){if(!YTMHost.isText(layer))return;YTMHost.clear(layer);layer.comment=String(layer.comment||'').replace(recordPattern,'');}
function run(a,codec){
    var c=app.project.activeItem;if(!(c instanceof CompItem))throw Error('Open a composition before using YU Txt Motion.');
    var list=c.selectedLayers,i,l,m,p,opt,count=0,lines=[],phase,target,actual;
    if(a.operation==='load'){
        if(list.length!==1||!YTMHost.isText(list[0]))throw Error('Select one YU text layer to load.');
        l=list[0];m=read(l,codec);if(!m)throw Error('No YU Txt Motion settings on the selected layer. Apply a YU preset first.');
        phase=a.phase==='OUT'?'OUT':'IN';var entry=m[phase]||m.IN||m.OUT;
        if(!entry)throw Error('No saved YU settings.');
        return {ok:true,id:entry.id,options:entry.options,target:identity(c,l,m),layerName:l.name,message:'Loaded YU settings from '+l.name+'.'};
    }
    if(a.operation!=='apply'&&a.operation!=='clear')throw Error('Unknown YU action.');
    if(!list.length)throw Error('Select one or more text layers.');
    if(a.target){if(list.length!==1)throw Error('Select the loaded YU layer only, or load again.');m=read(list[0],codec);actual=m?identity(c,list[0],m):null;target=a.target;if(!actual||actual.comp!==target.comp||actual.layer!==target.layer||actual.token!==target.token)throw Error('Selection changed. Load YU settings again before updating.');}
    if(a.operation==='apply'){
        if(app.project.expressionEngine!=='javascript-1.0')throw Error('Use Project Settings → Expressions → JavaScript.');
        var id=numeric(a.id,1,YTMCore.presets.length,'preset ID');if(id!==Math.floor(id))throw Error('Invalid YU preset ID.');
        p=YTMCore.presets[id-1];opt=options(a.options||{});opt.playhead=c.time;
    }
    for(i=0;i<list.length;i++){
        l=list[i];try{
            if(!YTMHost.isText(l))throw Error('Text layers only.');if(l.locked)throw Error('Layer is locked.');
            if(a.operation==='clear'){clear(l);count++;continue;}
            m=read(l,codec)||{token:'yu_'+new Date().getTime()+'_'+i};
            currentOptions=opt;YTMHost.apply(l,p,opt);currentOptions=null;
            if(opt.mode==='IN'||opt.mode==='BOTH')m.IN={id:p.id,options:opt};
            if(opt.mode==='OUT'||opt.mode==='BOTH')m.OUT={id:p.id,options:opt};
            write(l,m,codec);count++;
        }catch(e){currentOptions=null;lines.push(l.name+': '+String(e));}
    }
    var message=(a.operation==='clear'?'Removed YU animation from ':p.name+' applied to ')+count+' text layer(s).';
    if(lines.length)message+='\n'+lines.join('\n')+'\nCheck the timeline; Undo once if an operation partially changed it.';
    return {ok:true,changed:count,severity:lines.length?'warning':'success',message:message};
}
return {run:run,clear:clear};
