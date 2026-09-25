"""Run once before each new code push to main, then rebuild offline bundles."""
from pathlib import Path
import subprocess,sys
root=Path(__file__).resolve().parent.parent
old=(root/'VERSION').read_text().strip()
new='2.8.'+str(int(old.split('.')[-1])+1)
paths=['CSXS/manifest.xml','index.html','js/bridge.js','jsx/hostscript.jsx','presets.json']
paths += [str(f.relative_to(root)) for f in (root/'tests').glob('*.cjs')]
for name in paths:
 f=root/name;f.write_text(f.read_text().replace(old,new))
(root/'VERSION').write_text(new+'\n')
for script in ['build-data.py','build-catalog.py']:
 subprocess.run([sys.executable,str(root/'tools'/script)],check=True)
print('Next push version:',new)
