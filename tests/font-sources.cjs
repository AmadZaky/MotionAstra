const assert=require('node:assert/strict'),{create}=require('./host-model.cjs');
const e=create();const face=(name,extra)=>Object.defineProperties({postScriptName:name,familyName:name,styleName:'Regular'},Object.getOwnPropertyDescriptors(extra));
e.context.app.fonts={allFonts:[[face('User',{location:'C:\\Users\\A\\AppData\\Local\\Microsoft\\Windows\\Fonts\\user.ttf'}),face('Arial',{location:'C:\\Windows\\Fonts\\Arial.ttf'}),face('Cloud',{isFromAdobeFonts:true}),face('Unknown',{}),face('Unavailable',{get location(){throw Error('not exposed');}})]]};
assert.deepEqual(Object.fromEntries(e.rpc({action:'fonts'}).fonts.map(f=>[f.family,f.source])),{Arial:'system',Cloud:'adobe',Unavailable:'unknown',Unknown:'unknown',User:'user'});
console.log('PASS: user/system/Adobe metadata classification and unavailable-metadata fallback.');
