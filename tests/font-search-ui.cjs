const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright':'playwright');
const assert=require('node:assert/strict'),path=require('node:path'),{create}=require('./host-model.cjs');
(async()=>{
 const env=create(),calls=[],errors=[];
 env.context.app.fonts={allFonts:[[
  {postScriptName:'Inter-Regular',familyName:'Inter',styleName:'Regular'},
  {postScriptName:'Inter-Bold',familyName:'Inter',styleName:'Bold'},
  {postScriptName:'Roboto-Regular',familyName:'Roboto',styleName:'Regular'},
  {postScriptName:'Missing',familyName:'Missing',styleName:'Regular',isSubstitute:true}
 ]]};
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:300,height:720}});
 page.on('pageerror',e=>errors.push(e.message));
 await page.exposeFunction('hostRpc',p=>{calls.push(p);return env.rpc(p);});
 await page.addInitScript(()=>{const bridge={isAvailable:()=>true,isReady:()=>true,call:async p=>{const r=await window.hostRpc(p);if(!r.ok)throw Error(r.message);return r;}};Object.defineProperty(window,'MotionAstraBridge',{get:()=>bridge,set(){}});});
 await page.goto('file://'+path.resolve(__dirname,'../index.html'));
 assert.equal(await page.locator('[data-tab="FXTools"], [data-tab="Tweaker"], #fx-tools').count(),0);
 assert.equal(await page.locator('#tools #tweaker').count(),1);
 await page.locator('#font-search').focus();
 await page.waitForFunction(()=>document.querySelector('#new-text-font').options.length===4);
 assert.equal(calls.filter(p=>p.action==='fonts').length,1);
 await page.locator('#font-search').fill('bold');
 assert.deepEqual(await page.locator('#new-text-font option').evaluateAll(a=>a.map(x=>x.value)),['','Inter-Bold']);
 await page.locator('#new-text-font').selectOption('Inter-Bold');
 await page.locator('#font-search').fill('Roboto-Regular');
 assert.equal(await page.locator('#new-text-font').inputValue(),'Inter-Bold');
 await page.locator('[data-tool="newText"]').click();
 await page.waitForFunction(()=>!document.querySelector('[data-tool="newText"]').disabled);
 assert.equal(env.comp.selectedLayers[0].text.property('ADBE Text Document').value.font,'Inter-Bold');
 await page.locator('#font-search').fill('nothing-matches');
 assert.match(await page.locator('#font-status').textContent(),/No matching/);
 env.context.app.fonts.allFonts[0]=[{postScriptName:'NewFont',familyName:'New Font',styleName:'Regular'}];
 await page.locator('#refresh-fonts').click();
 await page.waitForFunction(()=>!document.querySelector('#refresh-fonts').disabled);
 assert.equal(await page.locator('#new-text-font').inputValue(),'');
 await page.locator('#font-search').fill('');
 assert.equal(await page.locator('#new-text-font option[value="NewFont"]').count(),1);
 assert.equal(await page.locator('#new-text-font option[value="Missing"]').count(),0);
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 assert.deepEqual(errors,[]);await browser.close();
 console.log('PASS: native font search, exact PostScript creation, retained selection, refreshed missing fonts, merged navigation, narrow layout.');
})().catch(e=>{console.error(e);process.exit(1);});
