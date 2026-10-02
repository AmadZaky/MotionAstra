const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright':'playwright'),assert=require('node:assert/strict'),path=require('node:path');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']});const page=await browser.newPage({viewport:{width:380,height:850}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('file://'+path.resolve(__dirname,'../index.html'));
assert.equal(await page.locator('[data-tab="Text"],#yu-load,#yu-search').count(),0);
assert.equal(await page.locator('#yu-browser #library .card').count(),6);assert.equal(await page.locator('.yu-card').count(),120);
assert.match(await page.locator('#library-title').textContent(),/Text Tools FX/);
for(const width of [300,380,1200]){await page.setViewportSize({width,height:850});for(const sel of ['.card canvas','.yu-card canvas']){const box=await page.locator(sel).first().boundingBox();assert(Math.abs(box.width-box.height)<2,sel+' must be square at '+width);}assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
await page.locator('#text-tools-group > summary').click();
assert(await page.locator('#library').isHidden());assert(await page.locator('.yu-card').first().isVisible());
await page.waitForFunction(()=>localStorage.getItem('ma-text-tools-folded')==='true');
await page.reload();assert.equal(await page.locator('#text-tools-group').evaluate(e=>e.open),false);
await page.locator('[data-tab="Background"]').click();assert(await page.locator('#library').isVisible());
await page.locator('[data-tab="YU"]').click();assert(await page.locator('#library').isHidden());
await page.locator('#text-tools-group > summary').click();assert(await page.locator('#library').isVisible());
async function search(q){if(await page.locator('#global-search').isHidden())await page.locator('#toggle-search').click();await page.locator('#search').fill(q);}
await search('Panning Transition');assert.equal(await page.locator('#search-results button').count(),0);
await search('Gold Extrusion');assert.equal(await page.locator('#search-results button').count(),0);
await search('Counter Text');await page.locator('#search-results button').click();assert(await page.locator('#inspector').isVisible());assert(await page.locator('#global-search').isHidden());let box=await page.locator('#preview').boundingBox();assert(Math.abs(box.width-box.height)<2);await page.locator('#close').click();
await search('Neon Grid');await page.locator('#search-results button').click();assert.match(await page.locator('#fx-title').textContent(),/Neon Grid/);await page.locator('#close').click();
const preset=await page.evaluate(()=>YTMCore.presets[0]);await search(preset.name);await page.locator('#search-results button').filter({hasText:preset.name+' · Text Animate'}).click();assert(await page.locator('#yu-editor').isVisible());box=await page.locator('#yu-preview').boundingBox();assert(Math.abs(box.width-box.height)<2);
await page.evaluate(()=>{window.drawn=[];const c=document.querySelector('#yu-preview').getContext('2d'),original=c.fillText.bind(c);c.fillText=(text,...args)=>{window.drawn.push(text);return original(text,...args);};});await page.locator('#yu-group').selectOption('all');await page.locator('#yu-replay').click();await page.waitForFunction(()=>window.drawn.includes('MotionAstra'));
await search('Create background');await page.locator('#search-results button').click();assert(await page.locator('#create').isVisible());assert(await page.locator('[data-create="newSolid"]').isDisabled());
await search('anchor');assert(await page.locator('#search-results button').count()>0);await page.locator('#search').press('Escape');assert(await page.locator('#global-search').isHidden());assert.equal(await page.locator('#toggle-search').getAttribute('aria-expanded'),'false');
await page.locator('[data-tab="YU"]').click();await page.setViewportSize({width:380,height:850});await page.screenshot({path:'/tmp/motionastra-307.png'});assert.deepEqual(errors,[]);await browser.close();console.log('PASS: merged collection, removal, square previews at three widths, MotionAstra preview text, cross-panel search navigation, keyboard dismissal and offline mutation guard.');})().catch(e=>{console.error(e);process.exit(1);});
