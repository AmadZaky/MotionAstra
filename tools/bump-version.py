"""Run once before each new code push to main, then rebuild offline bundles."""
from pathlib import Path
import subprocess,sys,argparse,re
root=Path(__file__).resolve().parent.parent
old=(root/'VERSION').read_text().strip()
parser=argparse.ArgumentParser();parser.add_argument('--version');args=parser.parse_args()
parts=old.split('.')
new=args.version or '.'.join(parts[:2]+[str(int(parts[2])+1)])
if not re.fullmatch(r'\d+\.\d+\.\d+',new):raise ValueError('Use a numeric major.minor.patch version')
if tuple(map(int,new.split('.'))) <= tuple(map(int,parts)):raise ValueError('Version must increase')
paths=['CSXS/manifest.xml','index.html','js/bridge.js','jsx/hostscript.jsx','presets.json']
paths += [str(f.relative_to(root)) for f in (root/'tests').glob('*.cjs')]
for name in paths:
 f=root/name;f.write_text(f.read_text().replace(old,new))
(root/'VERSION').write_text(new+'\n')
for script in ['build-data.py','build-yu.py','build-fxtools.py','build-catalog.py']:
 subprocess.run([sys.executable,str(root/'tools'/script)],check=True)
print('Next push version:',new)
