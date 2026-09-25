/* MotionAstra 2.8.0 — ES3 host. No third-party AE effects required. */
var MotionAstra=(function(){
    var recipes={},serial=0;for(var ri=0;ri<MA_PRESET_DATA.presets.length;ri++)recipes[MA_PRESET_DATA.presets[ri].id]=MA_PRESET_DATA.presets[ri];
    for(var li=0;li<(MA_PRESET_DATA.legacy||[]).length;li++){var lr=MA_PRESET_DATA.legacy[li];lr.legacy=true;recipes[lr.id]=lr;}
    function quote(s) { return '"' + String(s).replace(/\\/g,'\\\\').replace(/"/g,'\\"').replace(/\r/g,'\\r').replace(/\n/g,'\\n').replace(/\t/g,'\\t') + '"'; }
    function encode(v) {
        if (v === null || v === undefined) return 'null';
        if (typeof v === 'string') return quote(v);
        if (typeof v === 'number' || typeof v === 'boolean') return String(v);
        var a=[], k; if(Object.prototype.toString.call(v)==='[object Array]'){ for(k=0;k<v.length;k++)a.push(encode(v[k]));return '['+a.join(',')+']'; }
        for(k in v)if(v.hasOwnProperty(k))a.push(quote(k)+':'+encode(v[k]));return '{'+a.join(',')+'}';
    }
    // JSON.parse without eval: CEP payloads are data, never executable source.
    function parse(s) {
        var n=0; function ws(){while(/\s/.test(s.charAt(n))&&n<s.length)n++;}
        function value(){ws();var c=s.charAt(n),a,k,v,m;if(c==='"'){n++;a='';while(n<s.length){c=s.charAt(n++);if(c==='"')return a;if(c==='\\'){c=s.charAt(n++);if(c==='u'){a+=String.fromCharCode(parseInt(s.substr(n,4),16));n+=4;}else{var e={'"':'"','\\':'\\','/':'/','b':'\b','f':'\f','n':'\n','r':'\r','t':'\t'};if(e[c]===undefined)throw Error('Invalid JSON escape');a+=e[c];}}else a+=c;}throw Error('Invalid JSON string');}
        if(c==='['){n++;a=[];ws();if(s.charAt(n)===']'){n++;return a;}while(true){a.push(value());ws();c=s.charAt(n++);if(c===']')return a;if(c!==',')throw Error('Invalid JSON array');}}
        if(c==='{'){n++;a={};ws();if(s.charAt(n)==='}'){n++;return a;}while(true){ws();if(s.charAt(n)!=='"')throw Error('Invalid JSON key');k=value();if(k==='__proto__'||k==='constructor')throw Error('Invalid key');ws();if(s.charAt(n++)!==':')throw Error('Invalid JSON object');a[k]=value();ws();c=s.charAt(n++);if(c==='}')return a;if(c!==',')throw Error('Invalid JSON object');}}
        // Decode JSON keywords directly. Never route boolean/null tokens through
        // RegExp capture strict comparisons or a mixed-type ternary in ExtendScript.
        if(c==='t'&&s.substr(n,4)=='true'){n+=4;return true;}
        if(c==='f'&&s.substr(n,5)=='false'){n+=5;return false;}
        if(c==='n'&&s.substr(n,4)=='null'){n+=4;return null;}
        m=/^-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/.exec(s.substr(n));
        if(!m)throw Error('Invalid JSON value');
        var token=String(m[0]);n+=token.length;v=Number(token);
        if(!isFinite(v))throw Error('Non-finite JSON number');return v;}

        var out=value();ws();if(n!==s.length)throw Error('Trailing JSON');return out;
    }
    function number(v,min,max){v=Number(v);if(!isFinite(v)||v<min||v>max)throw Error('Parameter outside '+min+'–'+max);return v;}
    function comp(){var c=app.project.activeItem;if(!(c instanceof CompItem))throw Error('Open a composition first.');return c;}
    function selection(c){var a=c.selectedLayers;if(!a.length)throw Error('Select at least one layer.');return a;}
    function writable(l){if(l.locked)throw Error('Unlock '+l.name+' first.');}
    function prop(l,n){return l.property('ADBE Transform Group').property(n);}
    function set(p,v,t){if(p.numKeys)p.setValueAtTime(t,v);else p.setValue(v);}
    function effect(l,m,name){var g=l.property('ADBE Effect Parade');if(!g||!g.canAddProperty(m))throw Error('Unavailable native effect: '+m);var e=g.addProperty(m);e.name=name;return e;}
    // Explicit normalization: never turn the nonempty string "false" into ON.
    // Unwrap primitive boxes/single-value carriers before validating native or JSON data.
    function checkbox(v,fallback,label,nativeValue){
        var original=v,depth=0,next,n,text,kind;
        if(v===undefined||v===null)v=fallback;
        while(v!==null&&typeof v==='object'&&depth++<4){
            kind=Object.prototype.toString.call(v);
            if(kind==='[object Array]'&&v.length===1){v=v[0];continue;}
            if(kind==='[object Boolean]'||kind==='[object Number]'||kind==='[object String]'){v=v.valueOf();continue;}
            // A single-property saved control record may contain {value: false}.
            var keys=0,k;for(k in v)if(v.hasOwnProperty(k))keys++;
            if(keys===1&&v.hasOwnProperty('value')){v=v.value;continue;}break;
        }
        if(v===true)return true;if(v===false)return false;
        if(typeof v==='string'){
            text=v.replace(/^\s+|\s+$/g,'').toLowerCase();
            if(text==='true'||text==='on'||text==='checked')return true;
            if(text==='false'||text==='off'||text==='unchecked')return false;
            // Decimal/exponent representations of 0 and 1 are common serialized numbers.
            if(/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/.test(text))v=Number(text);
        }
        if(typeof v==='number'&&isFinite(v)){
            if(v===0)return false;if(v===1)return true;
            // Native expression-driven controls use the same threshold as generated clocks.
            if(nativeValue&&v>=0&&v<=1)return v>.5;
        }
        var shown;try{shown=encode(original);}catch(ignore){shown=String(original);}
        throw Error('Invalid '+label+' ['+(nativeValue?'AE control':'panel parameter')+']; received '+typeof original+' '+String(shown).substr(0,100)+'. Set it to ON or OFF.');
    }
    function color(hex){return [parseInt(hex.substr(1,2),16)/255,parseInt(hex.substr(3,2),16)/255,parseInt(hex.substr(5,2),16)/255,1];}
    function hex(v){var out='#',i,s;for(i=0;i<3;i++){s=Math.round(Math.max(0,Math.min(1,v[i]))*255).toString(16);out+=s.length<2?'0'+s:s;}return out;}
    function fail(message){var e=Error(message);e.noChanges=true;throw e;}
    function params(r,input){var out={},i,d,v,ok,j;input=input||{};try{
        for(i=0;i<r.parameters.length;i++){d=r.parameters[i];v=input[d.id];if(v===undefined||v===null)v=d.default;
            if(d.type==='checkbox')v=checkbox(v,d.default,d.label);
            else if(d.type==='text'||d.type==='textarea'){if(typeof v!=='string'||v.length>d.maxLength)throw Error(d.label+': maximum '+d.maxLength+' characters.');v=v.replace(/\r\n?/g,'\n');}
            else if(d.type==='color'){if(!/^#[0-9a-f]{6}$/i.test(v))throw Error('Invalid '+d.label);}
            else if(d.type==='select'){ok=false;for(j=0;j<d.options.length;j++)if(Number(v)===d.options[j].value)ok=true;if(!ok)throw Error('Invalid '+d.label);v=Number(v);}
            else{if(v===''||typeof v==='boolean')throw Error('Enter '+d.label);v=number(v,d.min,d.id==='duration'?3600:d.max);if(d.step===1)v=Math.round(v);}
            out[d.id]=v;
        }
        if(r.id==='switcher'){var lines=out.phrases.split('\n');if(lines.length>12)throw Error('Text Switcher accepts up to 12 lines.');if(!out.phrases.replace(/\s/g,''))throw Error('Enter at least one phrase.');}
    }catch(e){e.noChanges=true;throw e;}return out;}
    var META='\n[MotionAstra2:',END=']';
    function meta(l){var s=l.comment||'',a=s.indexOf(META),b;if(a<0)return null;b=s.indexOf(END,a+META.length);if(b<0)throw Error('Damaged MotionAstra metadata on '+l.name);return parse(decodeURIComponent(s.substring(a+META.length,b)));}
    function saveMeta(l,m){var s=l.comment||'',a=s.indexOf(META),b;if(a>=0){b=s.indexOf(END,a+META.length);if(b<0)throw Error('Damaged MotionAstra metadata on '+l.name);s=s.substring(0,a)+s.substring(b+1);}l.comment=s+(m?META+encodeURIComponent(encode(m))+END:'');}
    function fx(l,id){return l.property('ADBE Effect Parade').property('MA2 '+id);}
    function setControls(l,r,p){var i,d,e;for(i=0;i<r.parameters.length;i++){d=r.parameters[i];if(d.type==='text'||d.type==='textarea')continue;e=fx(l,d.id);if(!e)e=effect(l,d.type==='color'?'ADBE Color Control':d.type==='checkbox'?'ADBE Checkbox Control':'ADBE Slider Control','MA2 '+d.id);set(e.property(1),d.type==='color'?color(p[d.id]):d.type==='checkbox'?(p[d.id]?1:0):p[d.id],l.containingComp.time);}}
    function readControls(l,r,m){var p={},i,d,e;for(i=0;i<r.parameters.length;i++){d=r.parameters[i];if(d.type==='text'||d.type==='textarea'){p[d.id]=m.values[d.id];continue;}e=fx(l,d.id);if(!e)throw Error('Missing control '+d.label+'. Undo a deletion or remove this FX before reapplying.');var v=e.property(1).value;p[d.id]=d.type==='color'?hex(v):d.type==='checkbox'?checkbox(v,false,d.label,true):Number(v);}var end=markerTime(l,m.token,'end');if(end!==null)p.duration=Math.max(.1,end-l.inPoint);return p;}
    function markKey(token,kind){return 'MA2 '+token+' '+kind;}
    function markerTime(l,token,kind){var m=l.property('ADBE Marker'),i,t=null;if(!m)return null;for(i=1;i<=m.numKeys;i++)if(m.keyValue(i).getParameters()[markKey(token,kind)]!==undefined){if(t!==null)throw Error('Duplicate '+kind+' marker; keep one per FX.');t=m.keyTime(i);}return t;}
    function markerLabel(p){var out=p.MA2_BASE||'',k;for(k in p)if(p.hasOwnProperty(k)&&k.indexOf('MA2 i')===0)out+=(out?'\n':'')+p[k];return out;}
    function addMarker(l,token,kind,t,label){var m=l.property('ADBE Marker'),i,n=0;for(i=1;i<=m.numKeys;i++)if(Math.abs(m.keyTime(i)-t)<.000001)n=i;var v=n?m.keyValue(n):new MarkerValue(''),p=v.getParameters();if(p.MA2_BASE===undefined){p.MA2_BASE=v.comment;p.MA2_KEEP=n?'1':'0';}p[markKey(token,kind)]=label;v.setParameters(p);v.comment=markerLabel(p);m.setValueAtTime(t,v);}
    function removeMarker(l,token,kind){var m=l.property('ADBE Marker'),i,p,v,k,owned;if(!m)return;for(i=m.numKeys;i>=1;i--){v=m.keyValue(i);p=v.getParameters();if(p[markKey(token,kind)]===undefined)continue;delete p[markKey(token,kind)];owned=false;for(k in p)if(p.hasOwnProperty(k)&&k.indexOf('MA2 i')===0)owned=true;if(owned){v.comment=markerLabel(p);v.setParameters(p);m.setValueAtTime(m.keyTime(i),v);}else if(p.MA2_KEEP==='1'||p.MA2_BASE){v.comment=p.MA2_BASE||'';delete p.MA2_BASE;delete p.MA2_KEEP;v.setParameters(p);m.setValueAtTime(m.keyTime(i),v);}else m.removeKey(i);}}
    function markers(l,r,m,d,move){removeMarker(l,m.token,'start');addMarker(l,m.token,'start',l.inPoint,'[FX: '+r.name+']');if(move||markerTime(l,m.token,'end')===null){removeMarker(l,m.token,'end');addMarker(l,m.token,'end',l.inPoint+d,'[FX End]');}}
    function clock(m,body){return '// MotionAstra 2 '+m.token+'\nfunction P(k,d){try{var p=effect("MA2 "+k)(1);return p.value;}catch(e){return d;}}\n'+
        'var S=inPoint,E=S+Math.max(.1,P("duration",2));for(var i=1;i<=marker.numKeys;i++){if(marker.key(i).parameters['+quote(markKey(m.token,'end'))+']!==undefined){E=marker.key(i).time;break;}}\n'+
        'var D=Math.max(thisComp.frameDuration,E-S),raw=Math.max(0,time-S),q=P("manual",0)>.5?Math.max(0,Math.min(1,P("progress",0)/100)):(P("loop",0)>.5?(raw%D)/D:Math.min(1,raw/D));\n'+
        'var ease=P("ease",2);q=ease===1?q*q:ease===2?1-(1-q)*(1-q):ease===3?q*q*(3-2*q):q;if(P("reverse",0)>.5)q=1-q;var T=q*6.28318530718;\n'+body+';';}
    function assign(p,s){if(!p||!p.canSetExpression)throw Error('This property does not support expressions.');p.expression=s;if(p.expressionError){var e=p.expressionError;p.expression='';throw Error(e);}}
    function owned(s){return s&&s.indexOf('// MotionAstra 2 ')===0;}
    function source(l){var g=l.property('ADBE Text Properties');return g?g.property('ADBE Text Document'):null;}
    function isText(l){return typeof TextLayer!=='undefined'&&l instanceof TextLayer;}
    function sourceBody(r,p){
        if(r.id==='counter')return 'var start=P("start",0),end=P("end",1000),places=Math.max(0,Math.min(4,Math.round(P("decimals",0)))),fmt=Math.round(P("format",0)),factor=Math.pow(10,places),n=Math.round((start+(end-start)*q)*factor)/factor;var a=Math.abs(n).toFixed(places).split("."),whole=a[0];if(fmt===1||fmt===2)whole=whole.replace(/\\B(?=(\\d{3})+(?!\\d))/g,fmt===1?",":".");'+quote(p.prefix)+'+(n<0?"-":"")+whole+(places?(fmt===2?",":".")+a[1]:"")+'+quote(p.suffix);
        if(r.id==='switcher')return 'var items='+encode(p.phrases.split('\n'))+',n=P("switchMode",0)>.5?Math.min(items.length-1,Math.floor(q*items.length)):Math.max(0,Math.min(items.length-1,Math.round(P("choice",1))-1));items[n]';
        if(r.id==='typewriter')return 'var s=value.toString(),n=Math.min(s.length,Math.floor(q*s.length));s.substr(0,n)+(P("cursor",1)>.5&&q<1?'+quote(p.cursorText)+':"")';
        return 'var s=value.toString(),n=Math.floor(q*s.length),alphabet="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",out="";seedRandom(Math.round(P("seed",1))+Math.floor(q*P("steps",20)),true);for(var j=0;j<s.length;j++){out+=j<n||q>=1||/\\s/.test(s.charAt(j))?s.charAt(j):alphabet.charAt(Math.floor(random(alphabet.length)));}out';
    }
    function textFx(l,r,p,m){var body,anim,g,sel;
        if(!r.legacy&&r.id!=='counter'&&r.id!=='switcher'){text25(l,r,p,m);return;}
        if(r.id==='counter'||r.id==='switcher'||r.id==='typewriter'||r.id==='decode'){assign(source(l),clock(m,sourceBody(r,p)));return;}
        anim=l.property('ADBE Text Properties').property('ADBE Text Animators').addProperty('ADBE Text Animator');anim.name='MA2 '+r.id;
        g=anim.property('ADBE Text Animator Properties');
        if(r.id==='rise'||r.id==='cascade'){assign(g.addProperty('ADBE Text Position 3D'),clock(m,'P("direction",0)>.5?[P("distance",80),0,0]:[0,P("distance",80),0]'));g.addProperty('ADBE Text Opacity').setValue(0);}
        else if(r.id==='elastic')g.addProperty('ADBE Text Scale 3D').setValue([0,0,100]);
        else if(r.id==='wave')assign(g.addProperty('ADBE Text Position 3D'),clock(m,'[0,P("height",25),0]'));
        else if(r.id==='tracking'){assign(g.addProperty('ADBE Text Tracking Amount'),clock(m,'P("trackingStart",80)+(P("trackingEnd",0)-P("trackingStart",80))*q'));assign(g.addProperty('ADBE Text Opacity'),clock(m,'P("fade",1)>.5?100*q:100'));}
        else if(r.id==='sweep')assign(g.addProperty('ADBE Text Fill Color'),clock(m,'P("highlight",[1,.5,.2,1])'));
        sel=anim.property('ADBE Text Selectors').addProperty('ADBE Text Expressible Selector');
        body='var delay=P("stagger",50)/100,x=Math.max(0,Math.min(1,(q-(textIndex-1)/Math.max(1,textTotal-1)*delay)/Math.max(.1,1-delay)));';
        if(r.id==='rise')body+='100*(1-x)';
        else if(r.id==='elastic')body+='x<=0?100:x>=1?0:100*Math.exp(-x*(9-P("bounce",35)*.04))*Math.cos(x*(8+P("bounce",35)*.1))*(1-x)';
        else if(r.id==='wave')body='100*Math.sin(T*P("cycles",2)-(textIndex-1)*P("spacing",25)*Math.PI/180)';
        else if(r.id==='tracking')body='100';
        else if(r.id==='sweep')body='var center=q*1.6-.3,pos=(textIndex-.5)/Math.max(1,textTotal),width=P("width",30)/100;q<=0||q>=1?0:P("intensity",100)*Math.max(0,1-Math.abs(pos-center)/width)';
        else if(r.id==='cascade')body='var s=text.sourceText.toString(),words=s.match(/\\S+/g)||[],prefix=s.substr(0,textIndex),prior=prefix.match(/\\S+/g)||[],wi=Math.max(0,prior.length-1),delay=P("stagger",60)/100,x=Math.max(0,Math.min(1,(q-wi/Math.max(1,words.length-1)*delay)/Math.max(.1,1-delay)));100*(1-x)';
        assign(sel.property('ADBE Text Expressible Amount'),clock(m,body));
    }
    function vector(l,name){var root=l.property('ADBE Root Vectors Group'),g=root.addProperty('ADBE Vector Group');g.name=name;return g;}
    function shapePath(group,m,body,closed,fill){var contents=group.property('ADBE Vectors Group'),path=contents.addProperty('ADBE Vector Shape - Group');assign(path.property('ADBE Vector Shape'),clock(m,body));var paint=contents.addProperty(fill?'ADBE Vector Graphic - Fill':'ADBE Vector Graphic - Stroke');assign(paint.property(fill?'ADBE Vector Fill Color':'ADBE Vector Stroke Color'),clock(m,'P("color2",[1,.5,.2,1])'));if(!fill)assign(paint.property('ADBE Vector Stroke Width'),clock(m,'P("stroke",2)'));}
    function paintColor(group,m,body,fill){var contents=group.property('ADBE Vectors Group'),paint=contents.property(fill?'ADBE Vector Graphic - Fill':'ADBE Vector Graphic - Stroke');assign(paint.property(fill?'ADBE Vector Fill Color':'ADBE Vector Stroke Color'),clock(m,body));}
    function background(l,r,p,m){if(!r.legacy){background25(l,r,p,m);return;}var root=l.property('ADBE Root Vectors Group'),master=vector(l,'MA2 artwork'),masterIndex=master.propertyIndex,c=master.property('ADBE Vectors Group'),g,path,i,j,n=p.count||1,body,fill,tr,W=l.containingComp.width,H=l.containingComp.height;
        // Shape coordinates are centered on the layer. No hidden helper layers or plug-ins.
        g=c.addProperty('ADBE Vector Group');g.name='Base';shapePath(g,m,'var w=thisComp.width/2,h=thisComp.height/2;createPath([[-w,-h],[w,-h],[w,h],[-w,h]],[],[],true)',true,true);paintColor(g,m,'P("color1",[.05,.05,.07,1])',true);
        if(r.id==='gradient'){
            var ramp=effect(l,'ADBE Ramp','MA2 native gradient');assign(ramp.property(1),clock(m,'var a=P("angle",0)*Math.PI/180+Math.sin(T*P("cycles",1))*P("drift",20)/100;[thisComp.width/2-Math.cos(a)*thisComp.width/2,thisComp.height/2-Math.sin(a)*thisComp.height/2]'));
            assign(ramp.property(2),clock(m,'var a=P("color2",[1,.5,.2,1]),b=P("color3",[1,.8,.4,1]),v=(1-Math.cos(T*P("cycles",1)))/2;a+(b-a)*v'));
            assign(ramp.property(3),clock(m,'var a=P("angle",0)*Math.PI/180+Math.sin(T*P("cycles",1))*P("drift",20)/100;[thisComp.width/2+Math.cos(a)*thisComp.width/2,thisComp.height/2+Math.sin(a)*thisComp.height/2]'));
            assign(ramp.property(4),clock(m,'var a=P("color3",[1,.8,.4,1]),b=P("color1",[.05,.05,.07,1]),v=(1-Math.cos(T*P("cycles",1)))/2;a+(b-a)*v'));return;
        }
        var total=r.id==='tiles'?n*n:r.id==='grid'?2*(n+1):n;
        for(i=0;i<total;i++){
            // Reacquire indexed groups after each addition, as required by AE.
            master=root.property(masterIndex);c=master.property('ADBE Vectors Group');g=c.addProperty('ADBE Vector Group');g.name='Element '+(i+1);var gi=g.propertyIndex;
            var prefix='var w=thisComp.width,h=thisComp.height,i='+i+',n='+n+',a=[],x,y,j,phase=T*P("cycles",1);';
            fill=r.id==='aurora'||r.id==='bokeh'||r.id==='particles'||r.id==='sunburst'||r.id==='tiles';
            if(r.id==='waves')body=prefix+'for(j=0;j<=64;j++){x=(j/64-.5)*w;y=(i/(n-1)-.5)*h+Math.sin(j/64*6.283/(P("wavelength",50)/100)+phase+i*.35)*P("amplitude",35);a.push([x,y]);}createPath(a,[],[],false)';
            else if(r.id==='aurora')body=prefix+'for(j=0;j<=48;j++){x=(j/48-.5)*w;y=(i/(n-1)-.5)*h+Math.sin(j/48*6.283+phase+i*.6)*P("amplitude",100);a.push([x,y]);}for(j=48;j>=0;j--){x=(j/48-.5)*w;y=(i/(n-1)-.5)*h+Math.sin(j/48*6.283+phase+i*.6)*P("amplitude",100)+P("width",90);a.push([x,y]);}createPath(a,[],[],true)';
            else if(r.id==='contours')body=prefix+'for(j=0;j<96;j++){var ang=j/96*6.283,r=(i+1)/n*Math.max(w,h)*.6*(1+P("amplitude",12)/100*Math.sin(ang*P("lobes",5)+phase+i*.2));a.push([Math.cos(ang)*r,Math.sin(ang)*r]);}createPath(a,[],[],true)';
            else if(r.id==='grid')body=prefix+'var delta=Math.sin(phase)*P("travel",30);a=i<=n?[[(i/n-.5)*w+delta,-h],[(i/n-.5)*w+delta,h]]:[[-w,((i-n-1)/n-.5)*h+delta],[w,((i-n-1)/n-.5)*h+delta]];createPath(a,[],[],false)';
            else if(r.id==='sunburst')body=prefix+'var angle=i/n*6.283+q*P("turns",.25)*6.283,spread=6.283/n*P("spread",45)/100,r=Math.sqrt(w*w+h*h);createPath([[0,0],[Math.cos(angle)*r,Math.sin(angle)*r],[Math.cos(angle+spread)*r,Math.sin(angle+spread)*r]],[],[],true)';
            else if(r.id==='tiles')body=prefix+'var size=Math.min(w,h)/n*P("size",55)/100/2;createPath([[-size,-size],[size,-size],[size,size],[-size,size]],[],[],true)';
            else if(r.id==='speedlines')body=prefix+'seedRandom(i+P("seed",3),true);var a0=i/n*6.283,r0=Math.min(w,h)*.1,r1=Math.sqrt(w*w+h*h)*.6,shift=(q*P("cycles",1)+random())%1,r=r0+(r1-r0)*shift,len=r1*P("length",25)/100;createPath([[Math.cos(a0)*r,Math.sin(a0)*r],[Math.cos(a0)*(r+len),Math.sin(a0)*(r+len)]],[],[],false)';
            else body=prefix+'seedRandom(i+P("seed",7),true);var radius=P("radius",30)*random(.4,1);for(j=0;j<32;j++){var angle=j/32*6.283;a.push([Math.cos(angle)*radius,Math.sin(angle)*radius]);}createPath(a,[],[],true)';
            shapePath(g,m,body,fill,fill);
            // Reacquire group and paint handles after content additions.
            g=root.property(masterIndex).property('ADBE Vectors Group').property(gi);
            paintColor(g,m,'var a=P("color2",[1,.5,.2,1]),b=P("color3",[1,.8,.4,1]);a+(b-a)*'+(total<=1?0:i/(total-1)),fill);
            tr=g.property('ADBE Vector Transform Group');
            if(r.id==='grid')assign(tr.property('ADBE Vector Rotation'),clock(m,'P("angle",0)'));
            if(r.id==='aurora')tr.property('ADBE Vector Group Opacity').setValue(55);
            if(r.id==='bokeh'||r.id==='particles'){
                body='seedRandom('+i+'+P("seed",7),true);var w=thisComp.width,h=thisComp.height,x=random(-w/2,w/2),y=random(-h/2,h/2);';
                body+=r.id==='bokeh'?'var angle=T*P("cycles",1)+'+i+';[x+Math.cos(angle)*P("travel",80),y+Math.sin(angle)*P("travel",80)]':'var angle=P("direction",-20)*Math.PI/180,d=q*P("travel",40)/100*w;[((x+d*Math.cos(angle)+w/2)%w+w)%w-w/2,((y+d*Math.sin(angle)+h/2)%h+h)%h-h/2]';
                assign(tr.property('ADBE Vector Position'),clock(m,body));if(r.id==='bokeh')assign(tr.property('ADBE Vector Group Opacity'),clock(m,'30+20*Math.sin(T*P("cycles",1)+'+i+')'));
            }
            if(r.id==='sunburst')assign(tr.property('ADBE Vector Position'),clock(m,'[(P("centerX",50)/100-.5)*thisComp.width,(P("centerY",50)/100-.5)*thisComp.height]'));
            if(r.id==='tiles'){tr.property('ADBE Vector Position').setValue([((i%n+.5)/n-.5)*W,((Math.floor(i/n)+.5)/n-.5)*H]);assign(tr.property('ADBE Vector Rotation'),clock(m,'q*P("turns",.25)*360+'+(i%3*15)));assign(tr.property('ADBE Vector Scale'),clock(m,'var v=100+Math.sin(T*P("cycles",1)+'+i+')*P("pulse",20);[v,v]'));}
        }
        if(r.id==='aurora'||r.id==='bokeh'){var blur=effect(l,'ADBE Gaussian Blur 2','MA2 native blur');assign(blur.property(1),clock(m,'P("softness",25)'));blur.property(3).setValue(1);}
    }
    // v2.5 native recipe helpers. Effects use stable match names; short parameter lists use explicit indices.
    // The explicit index fallbacks below are isolated so real-host smoke tests can audit them.
    function nativeFx(l,match,key){return effect(l,match,'MA2 native '+key);}
    function nativeParam(e,index){var p=e.property(index);if(!p||!p.setValue)throw Error('Native schema mismatch: '+e.matchName+' parameter '+index);return p;}
    function bind(e,index,m,body){assign(nativeParam(e,index),clock(m,body));}
    function fixed(e,index,value){nativeParam(e,index).setValue(value);}
    function ramp25(l,m){var e=nativeFx(l,'ADBE Ramp','ramp');bind(e,1,m,'[thisLayer.width*(.15+.15*Math.sin(T*P("cycles",1))),0]');bind(e,2,m,'P("color2",P("tint",[1,.75,.25,1]))');bind(e,3,m,'[thisLayer.width*(.8+.15*Math.cos(T*P("cycles",1))),thisLayer.height]');bind(e,4,m,'P("color3",[.16,.08,.025,1])');return e;}
    function blur25(l,m,body,horizontal){var e=nativeFx(l,'ADBE Gaussian Blur 2','blur');bind(e,1,m,body);fixed(e,2,horizontal?2:1);fixed(e,3,1);}
    function distort25(l,m,amount,size){var e=nativeFx(l,'ADBE Turbulent Displace','distortion');bind(e,2,m,amount);bind(e,3,m,size);bind(e,6,m,'q*360*P("cycles",1)');}
    function text25(l,r,p,m){
        if(r.id==='matrix'){assign(source(l),clock(m,sourceBody({id:'decode'},p)));var fill=nativeFx(l,'ADBE Fill','matrix tint');bind(fill,3,m,'P("tint",[.1,1,.5,1])');return;}
        if(r.id==='gold'||r.id==='ember'||r.id==='glass'||r.id==='extrusion'){
            ramp25(l,m);
            if(r.id==='gold'||r.id==='ember')distort25(l,m,'P("amount",60)*'+(r.id==='ember'?'.18':'.08'),'20+P("detail",5)*8');
            if(r.id==='glass'||r.id==='extrusion'){var bevel=nativeFx(l,'ADBE Bevel Alpha','bevel');bind(bevel,1,m,'1+P("amount",60)*.08');}
            if(r.id==='extrusion'){var shadow=nativeFx(l,'ADBE Drop Shadow','depth');bind(shadow,1,m,'[.18,.09,.015,1]');fixed(shadow,2,220);fixed(shadow,3,135);bind(shadow,4,m,'P("amount",60)*.45');fixed(shadow,5,0);}
        }
        var anim=l.property('ADBE Text Properties').property('ADBE Text Animators').addProperty('ADBE Text Animator');anim.name='MA2 '+r.id;
        var g=anim.property('ADBE Text Animator Properties'),sel,body;
        if(r.id==='stretch'){assign(g.addProperty('ADBE Text Scale 3D'),clock(m,'[100+P("amount",60)*2,10,100]'));g.addProperty('ADBE Text Opacity').setValue(0);}
        else if(r.id==='stamp'){g.addProperty('ADBE Text Scale 3D').setValue([160,160,100]);assign(g.addProperty('ADBE Text Rotation'),clock(m,'-P("amount",60)*.25'));g.addProperty('ADBE Text Opacity').setValue(0);blur25(l,m,'(1-q)*P("amount",60)*.2',false);}
        else if(r.id==='vhs'){assign(g.addProperty('ADBE Text Position 3D'),clock(m,'[P("amount",60)*.2,0,0]'));blur25(l,m,'P("amount",60)*.03',true);}
        else if(r.id==='ember')g.addProperty('ADBE Text Opacity').setValue(25);
        else{assign(g.addProperty('ADBE Text Fill Color'),clock(m,'P("tint",[.7,.85,1,1])'));}
        sel=anim.property('ADBE Text Selectors').addProperty('ADBE Text Expressible Selector');
        var local='var delay=P("stagger",45)/100,x=Math.max(0,Math.min(1,(q-(textIndex-1)/Math.max(1,textTotal-1)*delay)/Math.max(.1,1-delay)));';
        if(r.id==='stretch'||r.id==='stamp')body=local+'x<=0?100:x>=1?0:100*(1-x)*Math.exp(-x*3)*Math.cos(x*(5+P("detail",5)))';
        else if(r.id==='vhs')body='seedRandom(textIndex+Math.floor(q*P("detail",5)*12),true);q>=1?0:random(-100,100)';
        else if(r.id==='ember')body='q>=1?0:(.5+.5*Math.sin(T*P("detail",5)+textIndex*2))*P("amount",60)';
        else body='Math.max(0,1-Math.abs((textIndex-.5)/textTotal-q)*5)*P("amount",60)';
        assign(sel.property('ADBE Text Expressible Amount'),clock(m,body));
    }
    // Background artwork uses solid masks, so the generated image has no external media dependency.
    // Each mask is added to an opaque base using native effects, or forms a transparent decorative field.
    function mask25(l,m,index,body){var g=l.property('ADBE Mask Parade');if(!g)throw Error('Masks unavailable on this layer.');var mask=g.addProperty('ADBE Mask Atom');mask.name='MA2 artwork '+index;assign(mask.property('ADBE Mask Shape'),clock(m,body));}
    function background25(l,r,p,m){
        var i,n=p.count,e,prefix='var w=thisLayer.width,h=thisLayer.height,c=[w/2,h/2],phase=T*P("cycles",1),a=[];',body;
        if(r.id==='nebula'||r.id==='smoke'){
            e=nativeFx(l,'ADBE Fractal Noise','clouds');
            // Match names are used for the long Fractal Noise group; English labels are a diagnostic fallback.
            var evolution=findNative(e,'ADBE Fractal Noise-0023','Evolution');assign(evolution,clock(m,'q*360*P("cycles",1)'));
            var contrast=findNative(e,'ADBE Fractal Noise-0004','Contrast');assign(contrast,clock(m,'80+P("amount",40)*2'));
            var tint=nativeFx(l,'ADBE Tint','cloud colors');bind(tint,1,m,'P("color1",[0,0,0,1])');bind(tint,2,m,'P("color2",[.2,.5,1,1])');return;
        }
        ramp25(l,m);
        if(r.id==='liquidgradient'||r.id==='glassbg'){distort25(l,m,'P("amount",40)*2','P("size",50)*4');if(r.id==='glassbg'){mask25(l,m,'card','var w=thisLayer.width,h=thisLayer.height;createPath([[w*.15,h*.2],[w*.85,h*.2],[w*.85,h*.8],[w*.15,h*.8]],[],[],true)');blur25(l,m,'P("softness",25)*.25',false);var edge=nativeFx(l,'ADBE Bevel Alpha','card edge');fixed(edge,1,2);assign(prop(l,'ADBE Opacity'),clock(m,'value*(.65+P("amount",40)*.0025)'));}return;}
        // Geometric fields: closed additive masks with animated points. The underlying footage is visible in the gaps.
        for(i=0;i<(r.id==='neongrid'||r.id==='blueprint'?n*2:n);i++){
            body=prefix+'var i='+i+',n='+n+',s=P("size",50),d=P("amount",40),u=q*P("cycles",1);';
            if(r.id==='neongrid'||r.id==='blueprint')body+='var b=Math.max(1,s*.045),v=Math.sin(phase)*d,x=(i%n+.5)/n*w+v,y=(i%n+.5)/n*h+v;a=i<n?[[x-b,0],[x+b,0],[x+b,h],[x-b,h]]:[[0,y-b],[w,y-b],[w,y+b],[0,y+b]];createPath(a,[],[],true)';
            else if(r.id==='retrosun')body+='var ang=i/n*6.283185+u*d*.005,step=3.14159/n*Math.min(1.9,Math.max(.15,s/50)),r=Math.sqrt(w*w+h*h);createPath([c,[c[0]+Math.cos(ang)*r,c[1]+Math.sin(ang)*r],[c[0]+Math.cos(ang+step)*r,c[1]+Math.sin(ang+step)*r]],[],[],true)';
            else if(r.id==='softbokeh')body+='seedRandom(i+P("seed",7),true);var x=random(w),y=random(h),r=s*random(.3,1);x+=Math.cos(phase+i)*d;y+=Math.sin(phase+i)*d;for(var j=0;j<32;j++){var a0=j/32*6.283185;a.push([x+Math.cos(a0)*r,y+Math.sin(a0)*r]);}createPath(a,[],[],true)';
            else if(r.id==='tunnel')body+='var f=((i/n+u*d/100)%1),x=w*f*.7,y=h*f*.7,b=Math.max(1,s*.05);a=[[c[0]-x,c[1]-y],[c[0]+x,c[1]-y],[c[0]+x,c[1]+y],[c[0]-x,c[1]+y],[c[0]-x,c[1]-y+b],[c[0]-x+b,c[1]-y+b],[c[0]-x+b,c[1]+y-b],[c[0]+x-b,c[1]+y-b],[c[0]+x-b,c[1]-y+b],[c[0]-x,c[1]-y+b]];createPath(a,[],[],true)';
            else body+='seedRandom(i+P("seed",7),true);var ang=i/n*6.283185,r=Math.min(w,h)*(.1+((u+random())%1)*.7),len=s+d*3,b=.003+s*.0001;createPath([[c[0]+Math.cos(ang)*r,c[1]+Math.sin(ang)*r],[c[0]+Math.cos(ang-b)*(r+len),c[1]+Math.sin(ang-b)*(r+len)],[c[0]+Math.cos(ang+b)*(r+len),c[1]+Math.sin(ang+b)*(r+len)]],[],[],true)';
            mask25(l,m,i,body);
        }
        if(r.id==='blueprint'){
            for(i=0;i<3;i++)mask25(l,m,'circle'+i,prefix+'var r=Math.min(w,h)*'+(.1+i*.12)+'*(1+.05*Math.sin(phase)),b=2;for(var j=0;j<=64;j++){var an=j/64*6.283185;a.push([c[0]+Math.cos(an)*r,c[1]+Math.sin(an)*r]);}for(var j=64;j>=0;j--){var an=j/64*6.283185;a.push([c[0]+Math.cos(an)*(r-b),c[1]+Math.sin(an)*(r-b)]);}createPath(a,[],[],true)');
        }
        if(r.id==='softbokeh')blur25(l,m,'P("softness",25)',false);
    }
    function findNative(group,match,label){var i,p;for(i=1;i<=group.numProperties;i++){p=group.property(i);if(p.matchName===match)return p;}for(i=1;i<=group.numProperties;i++){p=group.property(i);if(p.name===label)return p;}throw Error('Native parameter unavailable: '+group.matchName+' / '+label+'. Run tests/AE_SMOKE_TEST.jsx to inspect this host.');}
    function isSolid(l){return l instanceof AVLayer&&l.source&&l.source.mainSource instanceof SolidSource;}
    function isNewBackground(r){return r.category==='Background'&&!r.legacy;}
    function removeOwnedExpressions(g){var i,p;for(i=1;i<=(g.numProperties||0);i++){p=g.property(i);if(p.canSetExpression&&owned(p.expression))p.expression='';else if(p.numProperties)removeOwnedExpressions(p);}}
    function clearArtwork(l){var masks=l.property('ADBE Mask Parade');if(masks)for(var mi=masks.numProperties;mi>=1;mi--)if(masks.property(mi).name.indexOf('MA2 artwork ')===0)masks.property(mi).remove();var g=l.property('ADBE Root Vectors Group'),i;if(g)for(i=g.numProperties;i>=1;i--)if(g.property(i).name==='MA2 artwork')g.property(i).remove();var effects=l.property('ADBE Effect Parade');if(effects)for(i=effects.numProperties;i>=1;i--)if(effects.property(i).name.indexOf('MA2 native ')===0)effects.property(i).remove();}
    function cleanup(l,m){if(m&&/^(zoom|whip|lightleak|rgbglitch|warp|filmburn|bounce|anamorphic|page|pixel)$/.test(m.id))l.enabled=false;removeOwnedExpressions(l);clearArtwork(l);var g=l.property('ADBE Text Properties'),i;if(g){g=g.property('ADBE Text Animators');for(i=g.numProperties;i>=1;i--)if(g.property(i).name.indexOf('MA2 ')===0)g.property(i).remove();}g=l.property('ADBE Effect Parade');if(g)for(i=g.numProperties;i>=1;i--)if(g.property(i).name.indexOf('MA2 ')===0)g.property(i).remove();if(m){removeMarker(l,m.token,'start');removeMarker(l,m.token,'end');}saveMeta(l,null);}
    function controlCheck(l,r){var g=l.property('ADBE Effect Parade'),i,j,d,n;for(i=0;i<r.parameters.length;i++){d=r.parameters[i];if(d.type==='text'||d.type==='textarea')continue;n=0;for(j=1;j<=g.numProperties;j++)if(g.property(j).name==='MA2 '+d.id)n++;if(n!==1)throw Error('Missing or duplicate '+d.label+' control. Undo its deletion or remove/reapply the FX.');}}
    function preflight(l,r,updating){writable(l);if(!l.property('ADBE Effect Parade'))throw Error('Choose a visual layer.');if(r.category==='Text'&&!isText(l))throw Error('Select a Text layer.');if(r.category==='Background'&&(r.legacy?!(l instanceof ShapeLayer):!isSolid(l)))throw Error('Select a Solid layer for this background.');
        if(!updating){if(meta(l))throw Error('This layer already has MotionAstra 2 FX. Use Update or Remove MotionAstra FX.');var g=l.property('ADBE Effect Parade');for(var i=1;i<=g.numProperties;i++)if(g.property(i).name.indexOf('MA2 ')===0)throw Error('Orphan MotionAstra controls: use Remove MotionAstra FX first.');}
        if(r.id==='counter'||r.id==='switcher'||r.id==='typewriter'||r.id==='decode'||r.id==='matrix'){var s=source(l);if(!updating&&(s.expression||s.numKeys))throw Error('Source Text has an expression/keyframes. Use a clean text layer.');if(updating&&!owned(s.expression))throw Error('Source Text was changed outside MotionAstra. Remove/reapply deliberately to avoid replacing your expression.');}
        if(r.id==='glassbg'&&!updating&&prop(l,'ADBE Opacity').expression)throw Error('Opacity already has an expression. Use a clean solid for the glass card.');
        if(r.id==='gradient'&&!l.property('ADBE Effect Parade').canAddProperty('ADBE Ramp'))throw Error('Native Gradient Ramp unavailable.');
        if((r.id==='aurora'||r.id==='bokeh')&&!l.property('ADBE Effect Parade').canAddProperty('ADBE Gaussian Blur 2'))throw Error('Native Gaussian Blur unavailable.');
    }
    function newText(c){var l=c.layers.addText('MotionAstra');l.name='MotionAstra Text';prop(l,'ADBE Position').setValue([c.width/2,c.height/2]);l.inPoint=Math.min(c.time,c.duration-c.frameDuration);l.outPoint=c.duration;return l;}
    // Create editable native layers; no MotionAstra ownership tags or expressions are added.
    function newVisual(c,kind,hexColor){
        if(!/^#[0-9a-f]{6}$/i.test(hexColor))fail('Choose a valid layer color.');
        var l=null,src=null;
        try{
            if(kind==='newSolid'){l=c.layers.addSolid(color(hexColor).slice(0,3),'Solid '+hexColor.toUpperCase(),c.width,c.height,c.pixelAspect,c.duration);src=l.source;}
            else{
                l=c.layers.addShape();l.name='Shape';
                var root=l.property('ADBE Root Vectors Group'),g=root.addProperty('ADBE Vector Group');g.name='Rectangle';
                var contents=g.property('ADBE Vectors Group'),pathGroup=contents.addProperty('ADBE Vector Shape - Group'),shape=new Shape();
                var w=Math.min(320,c.width*.4)/2,h=Math.min(320,c.height*.4)/2;
                shape.vertices=[[-w,-h],[w,-h],[w,h],[-w,h]];shape.inTangents=[[0,0],[0,0],[0,0],[0,0]];shape.outTangents=[[0,0],[0,0],[0,0],[0,0]];shape.closed=true;
                pathGroup.property('ADBE Vector Shape').setValue(shape);
                var fill=contents.addProperty('ADBE Vector Graphic - Fill');fill.property('ADBE Vector Fill Color').setValue(color(hexColor));
                prop(l,'ADBE Position').setValue([c.width/2,c.height/2]);
            }
            l.inPoint=Math.max(0,Math.min(c.time,c.duration-c.frameDuration));l.outPoint=c.duration;
            return l;
        }catch(e){if(l)try{l.remove();}catch(ignore){}if(src&&src.usedIn.length===0)try{src.remove();}catch(ignore2){}throw e;}
    }
    function report(lines,count){return {ok:true,changed:count,severity:count===lines.length?'success':count?'warning':'error',message:lines.join('\n')};}
    function apply(a){var c=comp(),r=recipes[a.id],p;if(!r)fail('Unknown v2 preset.');p=params(r,a.params);if(app.project.expressionEngine!=='javascript-1.0')fail('Project Settings → Expressions → JavaScript is required.');var ls=[],created=false,i,l,m,count=0,lines=[];
        if(r.category==='Background'){
            ls=[];
            {l=r.legacy?c.layers.addShape():c.layers.addSolid(color(p.color1||"#101820").slice(0,3),'MotionAstra • '+r.name,c.width,c.height,c.pixelAspect,c.duration);l.name='MotionAstra • '+r.name;prop(l,'ADBE Position').setValue([c.width/2,c.height/2]);l.inPoint=0;l.outPoint=c.duration;l.moveToEnd();ls=[l];created=true;}
        }else{ls=selection(c);}
        for(i=0;i<ls.length;i++){l=ls[i];m=null;try{preflight(l,r,false);m={id:r.id,token:'i'+new Date().getTime()+'_'+(++serial),values:p,version:2.5};setControls(l,r,p);markers(l,r,m,p.duration,true);if(r.category==='Text')textFx(l,r,p,m);else background(l,r,p,m);saveMeta(l,m);count++;lines.push(l.name+': '+r.name+' applied.');}catch(e){if(m)try{cleanup(l,m);}catch(ignore){}lines.push(l.name+': '+String(e));if(created)try{var deadSource=l.source;l.remove();if(deadSource&&deadSource.usedIn&&deadSource.usedIn.length===0)deadSource.remove();}catch(ignore2){}}}
        if(created&&count){for(i=1;i<=c.numLayers;i++)c.layer(i).selected=false;ls[0].selected=true;}return report(lines,count);
    }
    function generateBackground(a){var r=recipes[a.id];if(!r||r.category!=='Background')fail('Choose a Background preset to generate.');return apply(a);}
    function load(a){var c=comp(),ls=selection(c),m=meta(ls[0]);if(!m||!recipes[m.id])fail('Select a MotionAstra 2 FX layer. V1 effects are not compatible with the v2 inspector.');var r=recipes[m.id];controlCheck(ls[0],r);return {ok:true,id:r.id,params:readControls(ls[0],r,m),message:'Loaded '+r.name+' from '+ls[0].name+'. Update affects matching selected layers only.'};}
    function update(a){var c=comp(),ls=c.selectedLayers,r=recipes[a.id];if(!r)fail('Choose a v2 preset.');var p=params(r,a.params),lines=[],count=0,i,l,m,oldDuration,started=false,errors=0;
        if(r.category==='Background'){var matching=[];for(i=0;i<ls.length;i++){m=meta(ls[i]);if(m&&m.id===r.id)matching.push(ls[i]);}if(!matching.length)return apply(a);ls=matching;}else ls=selection(c);
        for(i=0;i<ls.length;i++){l=ls[i];started=false;try{m=meta(l);if(!m||m.id!==r.id){lines.push(l.name+': No '+r.name+' instance to update. Click Apply first, or select its existing FX layer and Load selected FX settings. No changes made to this layer.');continue;}preflight(l,r,true);controlCheck(l,r);markerTime(l,m.token,'end');oldDuration=fx(l,'duration').property(1).value;started=true;setControls(l,r,p);markers(l,r,m,p.duration,Math.abs(oldDuration-p.duration)>.000001);
                if(r.category==='Background'){clearArtwork(l);background(l,r,p,m);}else if(r.id==='counter'||r.id==='switcher'||r.id==='typewriter'||r.id==='decode'||r.id==='matrix')assign(source(l),clock(m,sourceBody(r,p)));
                m.values=p;saveMeta(l,m);count++;lines.push(l.name+': updated.');}catch(e){errors++;lines.push(l.name+': '+String(e)+(started?' Undo once if this update partially changed the layer.':' No changes made to this layer.'));}}
        var result=report(lines,count);if(!count&&!errors)result.severity='warning';return result;
    }
    // Offset existing values/keyframes, or wrap an existing expression without discarding it.
    function plus(a,b){var i,out;if(Object.prototype.toString.call(a)==='[object Array]'){out=[];for(i=0;i<a.length;i++)out.push(a[i]+(b[i]||0));return out;}return a+b;}
    function snapshot(p){var a=[],i;for(i=1;i<=p.numKeys;i++)a.push(p.keyValue(i));return {p:p,keys:a,value:p.valueAtTime(0,true),expression:p.expression||'',enabled:p.expressionEnabled};}
    function restore(s){var i;s.p.expression='';if(s.keys.length)for(i=0;i<s.keys.length;i++)s.p.setValueAtKey(i+1,s.keys[i]);else s.p.setValue(s.value);s.p.expression=s.expression;if(s.expression)s.p.expressionEnabled=s.enabled;}
    function offset(p,delta){var i,old=p.expression||'',data;if(old&&p.expressionEnabled!==false){
            if(old.indexOf('// MA2_OFFSET ' )===0){data=parse(decodeURIComponent(old.split('\n')[0].substr(14)));data.delta=plus(data.delta,delta);}else data={base:old,delta:delta};
            var s='// MA2_OFFSET '+encodeURIComponent(encode(data))+'\nvar _ma2OffsetValue=eval('+quote(data.base)+');_ma2OffsetValue+'+encode(data.delta)+';';
            try{assign(p,s);}catch(e){p.expression=old;throw e;}
        }else if(p.numKeys){for(i=1;i<=p.numKeys;i++)p.setValueAtKey(i,plus(p.keyValue(i),delta));}
        else p.setValue(plus(p.value,delta));
    }
    function positionProps(l){var p=prop(l,'ADBE Position'),a=[],i;if(!p)throw Error('Layer has no Position.');if(p.dimensionsSeparated){for(i=0;i<(l.threeDLayer?3:2);i++)a.push(p.getSeparationFollower(i));}else a.push(p);return a;}
    function shiftPosition(l,d){var a=positionProps(l),i;if(a.length===1)offset(a[0],l.threeDLayer?d:[d[0],d[1]]);else for(i=0;i<a.length;i++)offset(a[i],d[i]||0);}
    function probe(l,body,t){var g=l.property('ADBE Effect Parade');if(!g||!g.canAddProperty('ADBE Point3D Control'))throw Error('Layer cannot evaluate transform coordinates.');var e=g.addProperty('ADBE Point3D Control'),idx=e.propertyIndex,result;e.name='MotionAstra temporary coordinate probe';try{var p=e.property(1);p.expression=body;if(p.expressionError)throw Error(p.expressionError);result=p.valueAtTime(t,false);if(!result||result.length<2||!isFinite(result[0])||!isFinite(result[1]))throw Error('Could not evaluate transform coordinates.');return result;}finally{g.property(idx).remove();}}
    function anchor(l,x,y,keep,t){writable(l);var ap=prop(l,'ADBE Anchor Point');if(!ap)throw Error('This layer has no Anchor Point (camera/light).');var b;try{b=l.sourceRectAtTime(t,true);}catch(e){b={left:0,top:0,width:l.width||0,height:l.height||0};}if(!b||!isFinite(b.width)||!isFinite(b.height))throw Error('Content bounds unavailable.');
        var old=ap.value,target=[b.left+b.width*x,b.top+b.height*y],delta=[target[0]-old[0],target[1]-old[1]],compensation=[0,0,0];if(old.length===3){target.push(old[2]);delta.push(0);}
        if(keep){compensation=probe(l,'var v=toWorldVec('+encode(delta)+');if(hasParent)v=parent.fromWorldVec(v);[v[0],v[1],v.length>2?v[2]:0];',t);}
        var saved=[snapshot(ap)],pp=positionProps(l),i;for(i=0;i<pp.length;i++)saved.push(snapshot(pp[i]));try{offset(ap,delta);if(keep)shiftPosition(l,compensation);}catch(e){for(i=saved.length-1;i>=0;i--)try{restore(saved[i]);}catch(ignore){}throw e;}
    }
    function selectedSet(ls,l){for(var i=0;i<ls.length;i++)if(ls[i]===l)return true;return false;}
    function arrange(c,ls,mode){var order=[],selected=[],i,j,tmp;for(i=1;i<=c.numLayers;i++)order.push(c.layer(i));for(i=0;i<order.length;i++)if(selectedSet(ls,order[i])){writable(order[i]);selected.push(order[i]);}
        if(mode==='top'||mode==='bottom'){var others=[];for(i=0;i<order.length;i++)if(!selectedSet(ls,order[i]))others.push(order[i]);order=mode==='top'?selected.concat(others):others.concat(selected);}
        else if(mode==='up'){for(i=1;i<order.length;i++)if(selectedSet(ls,order[i])&&!selectedSet(ls,order[i-1])){tmp=order[i-1];order[i-1]=order[i];order[i]=tmp;}}
        else if(mode==='down'){for(i=order.length-2;i>=0;i--)if(selectedSet(ls,order[i])&&!selectedSet(ls,order[i+1])){tmp=order[i+1];order[i+1]=order[i];order[i]=tmp;}}
        else if(mode==='reverse'||mode==='name'){if(mode==='reverse')selected.reverse();else selected.sort(function(a,b){var aa=a.name.toLowerCase(),bb=b.name.toLowerCase();return aa<bb?-1:aa>bb?1:a.index-b.index;});j=0;for(i=0;i<order.length;i++)if(selectedSet(ls,order[i]))order[i]=selected[j++];}
        else fail('Unknown layer order.');
        for(i=order.length-1;i>=0;i--)if(selectedSet(ls,order[i])){if(i===order.length-1)order[i].moveToEnd();else order[i].moveBefore(order[i+1]);}
    }
    function clearLegacy(l){var groups=[l.property('ADBE Effect Parade'),l.property('ADBE Root Vectors Group')],text=l.property('ADBE Text Properties'),i,j;
        function walk(g){for(var n=1;n<=(g.numProperties||0);n++){var p=g.property(n);if(p.canSetExpression&&p.expression&&p.expression.indexOf('// MotionAstra ')===0&&!owned(p.expression))p.expression='';else if(p.numProperties)walk(p);}}walk(l);
        if(text)groups.push(text.property('ADBE Text Animators'));for(i=0;i<groups.length;i++)if(groups[i])for(j=groups[i].numProperties;j>=1;j--)if(/^MA i/.test(groups[i].property(j).name))groups[i].property(j).remove();
        var m=l.property('ADBE Marker'),v,p,k,changed,base,keep;if(m)for(i=m.numKeys;i>=1;i--){v=m.keyValue(i);p=v.getParameters();changed=false;for(k in p)if(p.hasOwnProperty(k)&&/^MA i.*marker /.test(k)){delete p[k];changed=true;}if(changed){base=p.MA_BASE||'';keep=p.MA_KEEP==='1';delete p.MA_BASE;delete p.MA_KEEP;if(keep||base){v.comment=base;v.setParameters(p);m.setValueAtTime(m.keyTime(i),v);}else m.removeKey(i);}}
    }
    function easeTool(c,ls,a){var count=0,lines=[],i,j,p,props,keys,k,d,inE,outE,n,s=number(a.strength,1,100),mode=a.mode;if(mode!=='in'&&mode!=='out'&&mode!=='both'&&mode!=='linear')fail('Choose an easing mode.');
        for(i=0;i<ls.length;i++){try{writable(ls[i]);props=ls[i].selectedProperties;for(j=0;j<props.length;j++){p=props[j];if(!p.selectedKeys||!p.selectedKeys.length||!p.setTemporalEaseAtKey)continue;keys=p.selectedKeys;d=p.isSpatial?1:(Object.prototype.toString.call(p.value)==='[object Array]'?p.value.length:1);inE=[];outE=[];for(k=0;k<d;k++){inE.push(new KeyframeEase(0,s));outE.push(new KeyframeEase(0,s));}for(k=0;k<keys.length;k++){n=keys[k];if(mode==='linear')p.setInterpolationTypeAtKey(n,KeyframeInterpolationType.LINEAR,KeyframeInterpolationType.LINEAR);else{p.setInterpolationTypeAtKey(n,mode==='out'?KeyframeInterpolationType.LINEAR:KeyframeInterpolationType.BEZIER,mode==='in'?KeyframeInterpolationType.LINEAR:KeyframeInterpolationType.BEZIER);p.setTemporalEaseAtKey(n,inE,outE);}count++;}}}catch(e){lines.push(ls[i].name+': '+String(e));}}
        return {ok:true,changed:count,severity:count?(lines.length?'warning':'success'):'warning',message:count+' keys adjusted.'+(lines.length?'\n'+lines.join('\n'):'')+(count?'':' Select property keyframes in the timeline first.')};
    }
    function tool(a){var c=comp(),ls=c.selectedLayers,i,j,l,lines=[],count=0,m;if(a.name==='newText'||a.name==='newShape'||a.name==='newSolid'){l=a.name==='newText'?newText(c):newVisual(c,a.name,a.color||'#ff943f');for(i=1;i<=c.numLayers;i++)c.layer(i).selected=false;l.selected=true;return {message:'Created and selected '+(a.name==='newText'?'a text layer':a.name==='newShape'?'an editable shape layer':'a colored solid')+'.',changed:1};}if(!ls.length)fail('Select one or more layers first.');
        if(a.name==='arrange'){arrange(c,ls,a.mode);return {message:'Reordered '+ls.length+' selected layer(s).',changed:ls.length};}
        if(a.name==='ease')return easeTool(c,ls,a);
        if(a.name==='parent'){
            var center=[0,0,0],three=false,eligible=[];for(i=0;i<ls.length;i++){try{writable(ls[i]);if(!prop(ls[i],'ADBE Anchor Point'))throw Error('Visual layers only.');var v=probe(ls[i],'var p=toWorld(anchorPoint);[p[0],p[1],p.length>2?p[2]:0];',c.time);eligible.push(ls[i]);center[0]+=v[0];center[1]+=v[1];center[2]+=v[2];three=three||ls[i].threeDLayer;}catch(e){lines.push(ls[i].name+': '+String(e));}}
            if(!eligible.length)return report(lines,0);l=c.layers.addNull(c.duration);l.name='MotionAstra Controller';l.threeDLayer=three;for(i=0;i<3;i++)center[i]/=eligible.length;prop(l,'ADBE Position').setValue(three?center:[center[0],center[1]]);for(i=0;i<eligible.length;i++){eligible[i].parent=l;lines.push(eligible[i].name+': parented.');}return report(lines,eligible.length);
        }
        ls.sort(function(a,b){return a.index-b.index;});var base=ls[0].inPoint;
        for(i=0;i<ls.length;i++){l=ls[i];try{
            if(a.name==='unlock'){l.locked=false;}
            else{writable(l);
                if(a.name==='anchor')anchor(l,number(a.x,0,1),number(a.y,0,1),checkbox(a.keep,true,'Keep artwork'),c.time);
                else if(a.name==='offset')shiftPosition(l,[number(a.x,-100000,100000),number(a.y,-100000,100000),number(a.z||0,-100000,100000)]);
                else if(a.name==='stagger')l.startTime+=base+i*number(a.seconds,-60,60)-l.inPoint;
                else if(a.name==='rename'){var prefix=String(a.prefix||'Layer');if(prefix.length>80)throw Error('Name prefix is too long.');l.name=prefix+' '+('0'+(i+1)).slice(-2);}
                else if(a.name==='unparent')l.parent=null;
                else if(a.name==='style'){if(!isText(l))throw Error('Text layers only.');var sp=source(l),doc=sp.valueAtTime(c.time,true);doc.fontSize=number(a.size,1,1000);if(!/^#[0-9a-f]{6}$/i.test(a.color))throw Error('Invalid text color');doc.applyFill=true;doc.fillColor=color(a.color).slice(0,3);if(a.align==='left')doc.justification=ParagraphJustification.LEFT_JUSTIFY;else if(a.align==='center')doc.justification=ParagraphJustification.CENTER_JUSTIFY;else if(a.align==='right')doc.justification=ParagraphJustification.RIGHT_JUSTIFY;else throw Error('Invalid text alignment');set(sp,doc,c.time);}
                else if(a.name==='remove'||a.name==='eraseAll'){m=meta(l);cleanup(l,m);clearLegacy(l);if(a.name==='eraseAll'){var effects=l.property('ADBE Effect Parade');if(effects)for(j=effects.numProperties;j>=1;j--)effects.property(j).remove();}}
                else throw Error('Unknown tool.');
            }count++;lines.push(l.name+': done.');
        }catch(e){lines.push(l.name+': '+String(e));}}
        var result=report(lines,count);if(a.name==='anchor'&&count)result.message+='\nArtwork is preserved at the playhead when Keep artwork is enabled. Animated rotation/scale may change other frames.';return result;
    }
    function dispatch(raw){var a,result,undo=false;try{a=parse(decodeURIComponent(raw));if(a.action==='status'){var c=app.project?app.project.activeItem:null;result={ok:true,hostVersion:'2.8.0',version:app.version,composition:c instanceof CompItem?c.name:null,selected:c instanceof CompItem?c.selectedLayers.length:0};}
        else if(a.action==='load'||a.action==='reconnect'){try{result=load(a);}catch(e){e.noChanges=true;throw e;}}
        else{if(a.action!=='generateBackground'&&a.action!=='apply'&&a.action!=='update'&&a.action!=='tool')fail('Unknown action.');app.beginUndoGroup('MotionAstra 2');undo=true;result=a.action==='generateBackground'?generateBackground(a):a.action==='apply'?apply(a):a.action==='update'?update(a):tool(a);result.ok=true;}
    }catch(e){result={ok:false,message:String(e)+(e.line?' (line '+e.line+')':'')+(e.noChanges?' — No changes were made.':' — Check the timeline; Undo once if the operation partially changed it.')};}
    if(undo)try{app.endUndoGroup();}catch(e){result={ok:false,message:'Could not close Undo group. Check the timeline before retrying.'};}return encode(result);}
    // Fail before any layer mutation if this host cannot preserve transport booleans.
    var transportProbe=parse('{"keep":true,"loop":false,"empty":null,"n":1.25}');
    if(transportProbe.keep!==true||transportProbe.loop!==false||transportProbe.empty!==null||transportProbe.n!==1.25)throw Error('MotionAstra JSON transport self-check failed. Restart AE and install the full package.');
    return {dispatch:dispatch,version:'2.8.0'};
}());
if(typeof $!=='undefined'&&$.global)$.global.MotionAstra=MotionAstra;
