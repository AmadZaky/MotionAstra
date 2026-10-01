const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright':'playwright'),assert=require('node:assert/strict'),path=require('node:path'),{create}=require('./host-model.cjs');
(async()=>{
 const e=create(),l=e.comp.add('text');l.selected=true;assert.equal(e.rpc({action:'apply',id:'counter',layout:'legacy',params:{}}).changed,1);
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']}),page=await browser.newPage({viewport:{width:380,height:850}}),errors=[];
 page.on('pageerror',x=>errors.push(x.message));await page.exposeFunction('hostRpc',a=>e.rpc(a));
 await page.addInitScript(()=>{const bridge={isAvailable:()=>true,isReady:()=>true,call:async a=>{const r=await window.hostRpc(a);if(a.action!=='status')window.lastReply=r;if(!r.ok)throw Error(r.message);return r;}};Object.defineProperty(window,'MotionAstraBridge',{get:()=>bridge,set(){}});});
 await page.goto('file://'+path.resolve(__dirname,'../index.html'));assert.equal(await page.locator('#control-layout').inputValue(),'compact');
 await page.locator('[data-tab="Tools"]').click();await page.locator('#tweaker-load').click();await page.waitForFunction(()=>document.querySelector('#loaded-layout').textContent==='Individual');
 assert(await page.locator('#apply').isHidden());assert(await page.locator('#compact-fx').isVisible());
 await page.locator('#compact-fx').click();await page.waitForFunction(()=>document.querySelector('#loaded-layout').textContent==='Compact');assert.equal(l.fx.items.filter(x=>x.name.startsWith('MA2 ')&&!x.name.startsWith('MA2 native ')).length,1);
 await page.locator('#parameter-search').fill('loop');assert.equal(await page.locator('#parameters .parameter:visible').count(),1);assert(await page.locator('#param-loopMode').isVisible());await page.locator('#parameter-search').fill('');
 const group=page.locator('#parameters details').first();await group.locator('summary').click();assert.equal(await group.getAttribute('open'),null);await group.locator('summary').click();
 await page.locator('#param-start').fill('35');await page.locator('#update').click();await page.waitForFunction(()=>!document.querySelector('#update').disabled);assert.equal(e.rpc({action:'load'}).params.start,35);
 l.selected=false;const other=e.comp.add('text');other.selected=true;await page.locator('#param-start').fill('70');await page.locator('#update').click();await page.waitForFunction(()=>window.lastReply&&window.lastReply.ok===false);assert.equal(other.fx.numProperties,0);
 other.selected=false;l.selected=true;assert.equal(e.rpc({action:'load'}).params.start,35);await page.locator('#load-fx').click();await page.waitForFunction(()=>document.querySelector('#param-start').value==='35');
 await page.locator('#fold-quick').click();await page.locator('#parameter-search').fill('color');await page.screenshot({path:process.env.MA_TWEAKER_SCREENSHOT||'/tmp/motionastra-tweaker.png'});
 assert.deepEqual(errors,[]);await browser.close();console.log('PASS: FX Tweaker navigation, compact conversion, parameter search, collapsible groups, updates and stale-selection protection.');
})().catch(e=>{console.error(e);process.exit(1);});
