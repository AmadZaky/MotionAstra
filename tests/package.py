import hashlib,pathlib,subprocess,sys,tempfile,zipfile
root=pathlib.Path(__file__).resolve().parent.parent
assert (root/'tools/package-release.py').is_file(), 'Release must bundle click-to-run installers beside the panel folder'
with tempfile.TemporaryDirectory() as t:
 out=pathlib.Path(t)/'release.zip'
 subprocess.run([sys.executable,str(root/'tools/package-release.py'),'--output',str(out)],check=True)
 with zipfile.ZipFile(out) as z:
  names=z.namelist()
  for name in ['Install MotionAstra.cmd','Install MotionAstra.ps1','INSTALLATION_GUIDE.md','MotionAstra-FX/CSXS/manifest.xml','MotionAstra-FX/jsx/hostscript.jsx','Installer/WindowsUI.ps1','Installer/Window.xaml','Installer/Backend.ps1']:
   assert name in names,name
  assert not any(n.endswith('.command') for n in names), 'Windows-only package must not ship macOS launchers'
  assert not any(n.endswith(('fx-tools.js','fx-tools-data.js','fx-tools.jsx','fx-tools.json')) for n in names)
  sums=z.read('MotionAstra-FX/SHA256SUMS').decode().splitlines()
  checked=set()
  for line in sums:
   expected,name=line.split('  ',1);key='MotionAstra-FX/'+name
   assert hashlib.sha256(z.read(key)).hexdigest()==expected;checked.add(key)
  assert checked=={n for n in names if n.startswith('MotionAstra-FX/') and not n.endswith('/SHA256SUMS')}
  assert not any('/node_modules/' in n or '/.github/' in n for n in names)
 print('PASS: ZIP includes panel, Windows launchers only and complete checksums.')
