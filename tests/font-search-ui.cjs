const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright':'playwright');
const assert=require('node:assert/strict'),path=require('node:path'),{create}=require('./host-model.cjs');
(async()=>{
 const env=create(),calls=[],errors=[];let failBackground=false;
 env.context.app.fonts={allFonts:[[
  {postScriptName:'Inter-Regular',familyName:'Inter',styleName:'Regular'},
  {postScriptName:'Inter-Bold',familyName:'Inter',styleName:'Bold'},
  {postScriptName:'Inter-Italic',familyName:'Inter',styleName:'Italic'},
  {postScriptName:'Inter-Medium',familyName:'Inter',styleName:'Medium'},
  {postScriptName:'Inter-SemiBold',familyName:'Inter',styleName:'Semibold'},
  {postScriptName:'Roboto-Regular',familyName:'Roboto',styleName:'Regular'},
  {postScriptName:'Missing',familyName:'Missing',styleName:'Regular',isSubstitute:true}
 ]]};
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:300,height:720}});
 page.on('pageerror',e=>errors.push(e.message));
 await page.exposeFunction('hostRpc',p=>{calls.push(p);if(failBackground&&p.name==='newSolid')return {ok:false,message:'Test failure'};return env.rpc(p);});
 await page.addInitScript(()=>{const bridge={isAvailable:()=>true,isReady:()=>true,call:async p=>{const r=await window.hostRpc(p);if(!r.ok)throw Error(r.message);return r;}};Object.defineProperty(window,'MotionAstraBridge',{get:()=>bridge,set(){}});});
 await page.goto(require('node:url').pathToFileURL(path.resolve(__dirname,'../index.html')).href);
 assert.equal(await page.locator('#quick [data-create]').count(),0);
 await page.locator('[data-tab="Create"]').click();
 await page.waitForFunction(()=>document.querySelector('#new-text-font').options.length===3);
 assert.equal(calls.filter(p=>p.action==='fonts').length,1);
 assert.deepEqual(await page.locator('.create-grid h2').allTextContents(),[' Text',' Shape',' Solid Color']);
 for(const [shape,count] of [['circle',4],['square',4],['polygon',7]]){
  await page.locator('#new-shape-type').selectOption(shape);
  if(shape==='polygon')await page.locator('#new-shape-sides').fill('7');
  await page.locator('[data-create="newShape"]').click();
  await page.waitForFunction(()=>!document.querySelector('[data-create="newShape"]').disabled);
  assert.equal(env.comp.selectedLayers[0].vectors.property(1).property('ADBE Vectors Group').property('ADBE Vector Shape - Group').property('ADBE Vector Shape').value.vertices.length,count);
 }
 await page.locator('#font-search').fill('semibold');
 assert.deepEqual(await page.locator('#new-text-font option').evaluateAll(a=>a.map(x=>x.value)),['','Inter']);
 await page.locator('#new-text-font').selectOption('Inter');
 assert.deepEqual(await page.locator('#new-text-style option').allTextContents(),['Bold','Italic','Medium','Regular','Semibold']);
 await page.locator('#new-text-style').selectOption('Inter-SemiBold');
 await page.locator('#font-search').fill('Roboto');
 assert.equal(await page.locator('#new-text-font').inputValue(),'Inter');
 assert.equal(await page.locator('#new-text-style').inputValue(),'Inter-SemiBold');
 await page.locator('#new-text-size').fill('96.5');
 await page.locator('#new-text-color').fill('#12abef');
 await page.locator('#new-text-content').fill('Native typography');
 assert.equal(await page.locator('#font-preview-sample').textContent(),'Native typography');
 assert.equal(await page.locator('#font-preview-sample').evaluate(e=>e.style.fontSize),'40px');
 assert.equal(await page.locator('#font-preview-sample').evaluate(e=>e.style.color),'rgb(18, 171, 239)');
 await page.waitForFunction(()=>document.querySelector('#font-preview-status').textContent.includes('Fallback shown'));
 await page.locator('[data-create="newText"]').click();
 await page.waitForFunction(()=>!document.querySelector('[data-create="newText"]').disabled);
 const doc=env.comp.selectedLayers[0].text.property('ADBE Text Document').value;
 assert.equal(doc.font,'Inter-SemiBold');assert.equal(doc.fontSize,96.5);assert.equal(doc.text,'Native typography');assert.deepEqual(Array.from(doc.fillColor),[18/255,171/255,239/255]);
 await page.locator('#font-search').fill('nothing-matches');
 assert.match(await page.locator('#font-status').textContent(),/No matching/);
 env.context.app.fonts.allFonts[0]=[{postScriptName:'NewFont',familyName:'New Font',styleName:'Regular'}];
 await page.locator('#refresh-fonts').click();await page.waitForFunction(()=>!document.querySelector('#refresh-fonts').disabled);
 assert.equal(await page.locator('#new-text-font').inputValue(),'');assert.equal(await page.locator('#new-text-style').inputValue(),'');
 await page.locator('#font-search').fill('');assert.equal(await page.locator('#new-text-font option[value="New Font"]').count(),1);
 const before=env.comp.numLayers;
 await page.locator('#background-hex').fill('zzzzzz');await page.locator('[data-create="newSolid"]').click();assert.equal(env.comp.numLayers,before);
 await page.locator('#background-hex').fill('aabbcc');await page.locator('[data-create="newSolid"]').click();await page.waitForFunction(()=>!document.querySelector('[data-create="newSolid"]').disabled);
 assert.equal(env.comp.numLayers,before+1);assert.equal(env.comp.items.at(-1),env.comp.selectedLayers[0]);assert.equal(calls.filter(p=>p.name==='newSolid').at(-1).color,'#AABBCC');
 assert.equal(await page.locator('#recent-colors button').count(),1);
 await page.locator('#new-background-color').fill('#123456');assert.equal(await page.locator('#background-hex').inputValue(),'#123456');
 failBackground=true;await page.locator('[data-create="newSolid"]').click();await page.waitForFunction(()=>!document.querySelector('[data-create="newSolid"]').disabled);assert.equal(await page.locator('#recent-colors button').count(),1);failBackground=false;
 await page.reload();await page.locator('[data-tab="Create"]').click();await page.waitForFunction(()=>!document.querySelector('#refresh-fonts').disabled);
 await page.locator('#recent-colors button').click();assert.equal(await page.locator('#background-hex').inputValue(),'#AABBCC');assert.equal(await page.locator('#new-background-color').inputValue(),'#aabbcc');
 for(const width of [300,380,1200]){await page.setViewportSize({width,height:650});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
 await page.locator('main').evaluate(e=>e.scrollTop=0);
 await page.screenshot({path:'/tmp/motionastra-create.png',fullPage:true});
 const offline=await browser.newPage();await offline.goto(require('node:url').pathToFileURL(path.resolve(__dirname,'../catalog.html')).href);await offline.locator('[data-tab="Create"]').click();assert(await offline.locator('[data-create="newText"]').isDisabled());
 assert.deepEqual(errors,[]);await browser.close();
 console.log('PASS: Create tab, shape geometry, family/style font selection, text size/color, HEX validation, picker sync, recent-color persistence and failure guard, responsive/offline UI.');
})().catch(e=>{console.error(e);process.exit(1);});
