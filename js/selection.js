/* Selected-layer context is advisory; host target validation remains authoritative. */
window.ZxTSelection = (() => {
  'use strict';
  let current = null, adapter, signature = '', connected = false;
  const $ = id => document.getElementById(id);
  function match(a,b){return !!a&&!!b&&a.comp===b.comp&&a.layer===b.layer&&a.token===b.token;}
  function eligibility(category,id,operation,target){
    if(!connected)return {allowed:false,reason:'Connect to After Effects first.'};
    if(!current)return {allowed:true,reason:''}; // Older hosts without inspector metadata.
    if(current.compId===null)return {allowed:false,reason:'Open a composition in After Effects.'};
    const layers=current.layers||[],count=current.total;
    if(target){
      const row=count===1&&layers[0],actual=row&&(category==='YU'?row.animations.map(a=>a.target):[row.core&&row.core.target]);
      if(!row||!actual.some(t=>match(t,target)))return {allowed:false,reason:'Selection changed. Load this layer’s settings again.'};
      if(row.locked)return {allowed:false,reason:'Unlock the selected layer first.'};
      return {allowed:true,reason:'Updates the loaded layer. Existing keyframes are preserved unless explicitly edited.'};
    }
    if(category==='Background'){
      const matching=layers.filter(l=>l.core&&l.core.id===id);
      if(matching.length&&!matching.some(l=>!l.locked))return {allowed:false,reason:'Unlock the matching background before updating it.'};
      return {allowed:true,reason:matching.length?'Updates matching selected backgrounds.':'Generates one new background in the active composition.'};
    }
    if(!count)return {allowed:false,reason:'Select a text layer in After Effects.'};
    const text=layers.filter(l=>l.type==='Text'&&!l.locked);
    if(!text.length&&!current.truncated)return {allowed:false,reason:'Select an unlocked text layer.'};
    if(operation==='update'&&category!=='YU'&&!layers.some(l=>!l.locked&&l.core&&l.core.id===id)&&!current.truncated)return {allowed:false,reason:'Apply this preset first, or load an existing instance.'};
    return {allowed:true,reason:text.length<count?'Applies to unlocked text layers; other selected layer types are skipped.':'Ready for the selected text layer'+(count===1?'':'s')+'.'};
  }
  function render(){
    if(!adapter)return;
    const box=$('selection-content'),summary=$('selection-summary');box.textContent='';
    if(!connected){summary.textContent='Layer Inspector · Preview mode';return;}
    if(!current){summary.textContent='Layer Inspector · Refresh to inspect selection';return;}
    if(current.compId===null){summary.textContent='Layer Inspector · Open a composition';return;}
    if(!current.total){summary.textContent='Layer Inspector · No layers selected';box.textContent='Select a layer to inspect its FX. SolidGen can generate without a selection.';return;}
    summary.textContent=current.total===1?current.layers[0].name+' · '+current.layers[0].type+(current.layers[0].locked?' · Locked':''):current.total+' layers selected';
    current.layers.forEach(row=>{
      const item=document.createElement('div');item.className='selection-layer';
      const heading=document.createElement('strong');heading.textContent=row.name+' · '+row.type+(row.locked?' · Locked':'');item.appendChild(heading);
      const names=[];if(row.core)names.push(row.core.name);
      row.animations.forEach(a=>{const p=window.YTMCore&&YTMCore.presets.find(p=>p.id===a.id);names.push((p?p.name:'Text animation '+a.id)+' · '+a.phase);});
      const text=document.createElement('p');text.textContent=names.length?names.join(' / '):'No ZxT-Motions preset detected.';item.appendChild(text);
      if(current.total===1){
        const add=(label,fn)=>{const b=document.createElement('button');b.textContent=label;b.dataset.host='';b.onclick=fn;b.disabled=adapter.busy();item.appendChild(b);};
        if(row.core)add('Load FX settings',()=>adapter.loadCore());
        row.animations.forEach(a=>add('Load '+a.phase+' animation',()=>adapter.loadAnimation(a.phase)));
      }
      if(row.effectCount){const d=document.createElement('details'),s=document.createElement('summary'),p=document.createElement('p');s.textContent=row.effectCount+' native effects';p.textContent=row.effects.join(' · ')+(row.effectCount>row.effects.length?' · …':'');d.append(s,p);item.appendChild(d);}
      if(row.warning){const warning=document.createElement('p');warning.textContent=row.warning;warning.className='selection-warning';item.appendChild(warning);}
      box.appendChild(item);
    });
    if(current.truncated){const p=document.createElement('p');p.textContent='Showing the first 50 selected layers.';box.appendChild(p);}
  }
  function update(response,ready){connected=ready;current=response&&response.selection||null;const next=JSON.stringify([connected,current]);if(next!==signature){signature=next;render();}}
  return {init(a){adapter=a;$('selection-refresh').onclick=a.refresh;render();},update,eligibility};
})();
