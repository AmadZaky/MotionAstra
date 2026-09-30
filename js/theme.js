/* Early theme bootstrap prevents a light/dark flash when reopening CEP. */
(function(){
'use strict';
let theme='dark';try{theme=localStorage.getItem('ma-theme')==='light'?'light':'dark';}catch(e){}
function apply(value){theme=value;document.documentElement.dataset.theme=theme;try{localStorage.setItem('ma-theme',theme);}catch(e){}const b=document.getElementById('theme-toggle');if(b){b.textContent=theme==='dark'?'Light ☀':'Dark ☾';b.setAttribute('aria-label','Switch to '+(theme==='dark'?'light':'dark')+' mode');b.setAttribute('aria-pressed',String(theme==='light'));}}
apply(theme);document.addEventListener('DOMContentLoaded',()=>{apply(theme);document.getElementById('theme-toggle').onclick=()=>apply(theme==='dark'?'light':'dark');});
})();
