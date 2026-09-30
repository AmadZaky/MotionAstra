/* AE adapter. Reacquire property references after all indexed-group mutations. */
var YTMHost = (function () {
    function starts(s,p){return s.indexOf(p)===0;}
    function animators(layer){return layer.property("ADBE Text Properties").property("ADBE Text Animators");}
    function effects(layer){return layer.property("ADBE Effect Parade");}
    function isText(layer){try{return !!layer.property("ADBE Text Properties");}catch(e){return false;}}
    function removePrefix(layer,prefix){
        var group=animators(layer),i;
        for(i=group.numProperties;i>=1;i--){if(starts(group.property(i).name,prefix)){group.property(i).remove();}}
        group=effects(layer);
        for(i=group.numProperties;i>=1;i--){if(starts(group.property(i).name,prefix)){group.property(i).remove();}}
    }
    function copy(o){var n={},k;for(k in o){if(o.hasOwnProperty(k)){n[k]=o[k];}}return n;}
    function addSlider(layer,name,value){
        var e=effects(layer).addProperty("ADBE Slider Control");e.name=name;e.property(1).setValue(value);
    }
    function setVector(prop,value){
        var dims=prop.value instanceof Array?prop.value.length:0;
        prop.setValue(dims?value.slice(0,dims):value);
    }
    function addChannel(layer,p,channel,phase,options){
        var a=animators(layer).addProperty("ADBE Text Animator"),ai=a.propertyIndex;
        a.name=options.prefix+phase+" | "+p.name+" | "+channel;
        var match={opacity:"ADBE Text Opacity",position:"ADBE Text Position 3D",scale:"ADBE Text Scale 3D",rotation:"ADBE Text Rotation",skew:"ADBE Text Skew",blur:"ADBE Text Blur"};
        var base={opacity:0,position:[100,100,0],scale:[0,0,100],rotation:1000,skew:80,blur:[100,100]};
        var props=animators(layer).property(ai).property("ADBE Text Animator Properties");
        if(!props.canAddProperty(match[channel])){throw new Error("AE tidak menyediakan "+match[channel]);}
        var prop=props.addProperty(match[channel]);
        if(base[channel] instanceof Array){setVector(prop,base[channel]);}else{prop.setValue(base[channel]);}
        var sels=animators(layer).property(ai).property("ADBE Text Selectors"),i;
        for(i=sels.numProperties;i>=1;i--){sels.property(i).remove();}
        var sel=animators(layer).property(ai).property("ADBE Text Selectors").addProperty("ADBE Text Expressible Selector");
        var si=sel.propertyIndex;
        sel.name="Yu timing";
        var based=sel.property("ADBE Text Range Type2");
        if(!based){throw new Error("Based On tidak ditemukan pada Expression Selector.");}
        based.setValue({chars:1,charsNoSpaces:2,words:3,lines:4,all:1}[options.group]);
        var amount=animators(layer).property(ai).property("ADBE Text Selectors").property(si).property("ADBE Text Expressible Amount");
        if(!amount || !amount.canSetExpression){throw new Error("Expression Selector tidak dapat ditulis.");}
        amount.expression=YTMCore.expression(p,channel,phase,options);
        amount.expressionEnabled=true;
        if(amount.expressionError){throw new Error(amount.expressionError);}
    }
    function apply(layer,p,options){
        if(!isText(layer)){throw new Error("Pilih text layer.");}
        if(layer.locked){throw new Error("Layer terkunci.");}
        var comp=layer.containingComp;
        if(layer.outPoint-layer.inPoint<=2*comp.frameDuration){throw new Error("Layer harus lebih panjang dari dua frame.");}
        if(options.placement==="playhead" && options.mode!=="BOTH" &&
            (options.playhead<layer.inPoint || options.playhead>=layer.outPoint-comp.frameDuration)){
            throw new Error("Playhead harus berada di dalam durasi layer.");
        }
        var opt=copy(options),token="YTM TEMP "+(new Date().getTime())+" ",phases=options.mode==="BOTH"?["IN","OUT"]:[options.mode];
        opt.prefix=token;
        var ch=YTMCore.channels(p),i,j,phase,prefix,group,name,suffix,amount;
        try {
            for(i=0;i<phases.length;i++){
                phase=phases[i];prefix=token+phase+" | ";
                addSlider(layer,prefix+"Duration",options.duration);
                addSlider(layer,prefix+"Stagger",options.stagger);
                addSlider(layer,prefix+"Intensity",options.intensity);
                addSlider(layer,prefix+"Seed",options.seed);
                addSlider(layer,prefix+"Offset",0);
                for(j=0;j<ch.length;j++){addChannel(layer,p,ch[j],phase,opt);}
            }
        }catch(e){removePrefix(layer,token);throw e;}
        // Existing IN / OUT remains intact until all new properties can be created.
        for(i=0;i<phases.length;i++){removePrefix(layer,"YTM "+phases[i]+" | ");}
        group=effects(layer);
        for(i=1;i<=group.numProperties;i++){
            if(starts(group.property(i).name,token)){group.property(i).name="YTM "+group.property(i).name.substr(token.length);}
        }
        opt.prefix="YTM ";group=animators(layer);
        for(i=1;i<=group.numProperties;i++){
            name=group.property(i).name;
            if(starts(name,token)){
                suffix=name.substr(token.length);phase=suffix.split(" | ")[0];
                var parts=suffix.split(" | "),channel=parts[parts.length-1];
                group.property(i).name="YTM "+suffix;
                amount=group.property(i).property("ADBE Text Selectors").property(1).property("ADBE Text Expressible Amount");
                amount.expression=YTMCore.expression(p,channel,phase,opt);
            }
        }
    }
    function clear(layer){removePrefix(layer,"YTM IN | ");removePrefix(layer,"YTM OUT | ");}
    function selected(){
        var comp=app.project.activeItem;
        if(!(comp instanceof CompItem)){throw new Error("Buka composition terlebih dahulu.");}
        var list=comp.selectedLayers,result=[],i;
        for(i=0;i<list.length;i++){if(isText(list[i])){result.push(list[i]);}}
        if(!result.length){throw new Error("Pilih satu atau beberapa text layer di timeline.");}
        return {comp:comp,layers:result};
    }
    function makeText(comp,text,size,position){
        var l=comp.layers.addText(text),prop=l.property("ADBE Text Properties").property("ADBE Text Document"),doc=prop.value;
        doc.fontSize=size;doc.applyFill=true;doc.fillColor=[1,1,1];doc.applyStroke=false;
        doc.justification=ParagraphJustification.CENTER_JUSTIFY;
        prop.setValue(doc);
        var rect=l.sourceRectAtTime(comp.time,false);
        l.property("ADBE Transform Group").property("ADBE Anchor Point").setValue([rect.left+rect.width/2,rect.top+rect.height/2]);
        l.property("ADBE Transform Group").property("ADBE Position").setValue(position);
        return l;
    }
    function demo(p,options){
        var comp=app.project.items.addComp("Yu Preview - "+p.name,1920,1080,1,6,30);
        comp.bgColor=[0.04,0.055,0.085];
        var text=makeText(comp,"YU GRAPHIC",140,[960,510]);text.name="Preview - "+p.name;text.inPoint=0.3;text.outPoint=5.7;
        var caption=makeText(comp,p.name+"  /  "+p.category,32,[960,720]);caption.name="Preset label";
        var opt=copy(options);opt.mode="BOTH";opt.placement="edges";opt.playhead=0;
        apply(text,p,opt);comp.time=0.3;comp.openInViewer();caption.selected=false;text.selected=true;
        return comp;
    }
    return {apply:apply,clear:clear,selected:selected,makeText:makeText,demo:demo,isText:isText};
}());
