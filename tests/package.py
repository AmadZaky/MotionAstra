import hashlib,pathlib,subprocess,sys,tempfile,zipfile
root=pathlib.Path(__file__).resolve().parent.parent
assert (root/'tools/package-release.py').is_file(), 'Release must bundle click-to-run installers beside the panel folder'
with tempfile.TemporaryDirectory() as t:
 out=pathlib.Path(t)/'release.zip'
 subprocess.run([sys.executable,str(root/'tools/package-release.py'),'--output',str(out)],check=True)
 with zipfile.ZipFile(out) as z:
  names=z.namelist()
  for name in ['Install MotionAstra.cmd','Install MotionAstra.ps1','Install MotionAstra.command','INSTALLATION_GUIDE.md','MotionAstra-FX/CSXS/manifest.xml','MotionAstra-FX/jsx/hostscript.jsx']:
   assert name in names,name
  assert z.getinfo('Install MotionAstra.command').external_attr>>16 & 0o111
  sums=z.read('MotionAstra-FX/SHA256SUMS').decode().splitlines()
  checked=set()
  for line in sums:
   expected,name=line.split('  ',1);key='MotionAstra-FX/'+name
   assert hashlib.sha256(z.read(key)).hexdigest()==expected;checked.add(key)
  assert checked=={n for n in names if n.startswith('MotionAstra-FX/') and not n.endswith('/SHA256SUMS')}
  assert not any('/node_modules/' in n or '/.github/' in n for n in names)
 print('PASS: ZIP includes panel, clickable launchers, executable macOS permissions and complete checksums.')
