// ExtendScript uses ES3 with reserved property-name access allowed by Adobe.
// Node's modern parser alone misses ES3 future reserved identifiers like native.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),acorn=require('acorn');
const reserved=new Set('abstract boolean byte char class const double enum export extends final float goto implements import int interface long native package private protected public short static super synchronized throws transient volatile let yield'.split(' '));
function check(source,file){
 const tree=acorn.parse(source,{ecmaVersion:3,allowReserved:true,locations:true});
 function visit(n,parent,key){if(!n||typeof n!=='object')return;
  if(n.type==='ConditionalExpression' && n.consequent.type==='ConditionalExpression')throw Error(file+':'+n.loc.start.line+': nested true-branch ternary is unsafe in ExtendScript; use if/else');
  if(n.type==='Identifier'&&reserved.has(n.name)&&!(parent&&((parent.type==='MemberExpression'&&key==='property'&&!parent.computed)||(parent.type==='Property'&&key==='key'))))throw Error(file+':'+n.loc.start.line+': reserved identifier '+n.name);
  for(const k of Object.keys(n)){if(k==='loc')continue;const v=n[k];if(Array.isArray(v))v.forEach(x=>visit(x,n,k));else if(v&&typeof v==='object')visit(v,n,k);}
 }visit(tree);
}
assert.throws(()=>check('var native=1;','fixture'),/reserved identifier native/);assert.throws(()=>check('const value=1;','fixture'));check('var p={"default":1};p.default;','Adobe property access');
assert.throws(()=>check('var v=color ? rgba : checkbox ? enabled ? 1 : 0 : input;','AE line 380 regression'),/nested true-branch ternary/);
check('var v;if(checkbox){v=enabled?1:0;}else{v=input;}','explicit branch');
const root=path.resolve(__dirname,'..');for(const folder of ['jsx','tests'])for(const f of fs.readdirSync(path.join(root,folder)))if(f.endsWith('.jsx')){const file=folder+'/'+f;check(fs.readFileSync(path.join(root,file),'utf8').replace(/^#.*$/gm,''),file);}
console.log('PASS: ExtendScript ES3 grammar and reserved binding/reference identifiers.');
