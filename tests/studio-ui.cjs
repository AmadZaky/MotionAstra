/* Studio navigation, responsive editors and appearance preferences. */
const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright':'playwright');
const assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:380,height:850}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href);
 const originalColors=await page.evaluate(()=>JSON.stringify(MA_PRESETS));
 for(const theme of ['dark','light']){
  if(await page.locator('html').getAttribute('data-theme')!==theme)await page.locator('#theme-toggle').click();
  await page.locator('[data-tab="Settings"]').click();
  for(const accent of ['orange','lime','blue','burgundy','white']){
   await page.locator('button[data-accent="'+accent+'"]').click();
   assert.equal(await page.locator('html').getAttribute('data-accent'),accent);
   assert.equal(await page.locator('#accent-options [aria-pressed=true]').count(),1);
   // Readable foreground for filled primary buttons in either theme.
   const colors=await page.evaluate(()=>{const s=getComputedStyle(document.documentElement);return ['--accent-fill','--on-accent'].map(k=>s.getPropertyValue(k).trim());});
   const luminance=hex=>{const rgb=hex.slice(1).match(/../g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;};
   const l=colors.map(luminance).sort((a,b)=>b-a);assert((l[0]+.05)/(l[1]+.05)>=4.5,'Button contrast '+theme+' '+accent);
   await page.reload();assert.equal(await page.locator('html').getAttribute('data-accent'),accent);assert.equal(await page.locator('html').getAttribute('data-theme'),theme);
   await page.locator('[data-tab="Settings"]').click();
  }
 }
 assert.equal(await page.evaluate(()=>JSON.stringify(MA_PRESETS)),originalColors,'Appearance must not mutate presets');
 await page.locator('button[data-accent="lime"]').click();await page.locator('#theme-toggle').click();
 await page.waitForTimeout(250);await page.screenshot({path:'/tmp/zxt-studio-settings.png'});
 for(const width of [300,380,768,1200]){
  await page.setViewportSize({width,height:720});await page.locator('[data-tab="YU"]').click();
  await page.locator('.yu-customize').first().click();
  assert.equal(await page.locator('#yu-browser').isVisible(),width>=920);
  assert(await page.locator('#yu-editor').isVisible());
  if(width>=920){const a=await page.locator('#yu-browser').boundingBox(),b=await page.locator('#yu-editor').boundingBox();assert(b.x>=a.x+a.width,'Animation split overlaps');
   await page.locator('#cards .customize').first().click();assert(await page.locator('#yu-editor').isHidden());assert(await page.locator('#inspector').isVisible());
   await page.locator('.yu-customize').first().click();assert(await page.locator('#inspector').isHidden());
  }
  const actions=await page.locator('.yu-actions').boundingBox(),footer=await page.locator('footer').boundingBox();assert(actions.y+actions.height<=footer.y+1);
  await page.locator('#yu-back').click();assert(await page.locator('#yu-browser').isVisible());
  await page.locator('#text-animate-group>summary').click();assert(await page.locator('#yu-cards').isHidden());await page.locator('#text-animate-group>summary').click();
  await page.locator('[data-tab="Background"]').click();
  assert(await page.locator('.card-actions button').evaluateAll(a=>a.every(b=>b.scrollWidth<=b.clientWidth)),'Card button clipped '+width);
  await page.locator('.customize').first().click();
  assert.equal(await page.locator('main').isVisible(),width>=920);
  assert(await page.locator('#inspector').isVisible());
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Overflow '+width);
  await page.screenshot({path:'/tmp/zxt-studio-'+width+'.png'});
  await page.locator('#close').click();assert(await page.locator('main').isVisible());
 }
 await page.evaluate(()=>localStorage.setItem('zxt-accent','invalid'));await page.reload();assert.equal(await page.locator('html').getAttribute('data-accent'),'orange');
 // Self-contained preview catalog includes the same Studio and accent styles.
 const offline=await browser.newPage();await offline.goto(pathToFileURL(path.resolve(__dirname,'../catalog.html')).href);await offline.locator('[data-tab="Settings"]').click();await offline.locator('button[data-accent="blue"]').click();assert.equal(await offline.locator('html').getAttribute('data-accent'),'blue');
 assert.deepEqual(errors,[]);await browser.close();console.log('PASS: Studio core/animation split views, exclusive editors, compact back navigation, collapsible collections, five persistent accents in both themes, contrast and offline catalog.');
})().catch(e=>{console.error(e);process.exit(1);});
