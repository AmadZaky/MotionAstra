"""Build an offline panel + click-to-run installer ZIP; no git or runtime dependencies."""
import argparse, hashlib
from pathlib import Path
import zipfile
root=Path(__file__).resolve().parent.parent
version=(root/'VERSION').read_text().strip()
parser=argparse.ArgumentParser();parser.add_argument('--output',default=str(root/('MotionAstra_FX_v'+version+'-pre-alpha.zip')))
args=parser.parse_args();payload={}
for folder in ['CSXS','css','js','jsx','vendor']:
 for p in sorted((root/folder).rglob('*')):
  if p.is_symlink(): raise ValueError('No payload symlinks: '+str(p))
  if p.is_file(): payload[p.relative_to(root).as_posix()]=p.read_bytes()
for name in ['.debug','index.html','catalog.html','presets.json','VERSION','README.md','INSTALLATION_GUIDE.md','RELEASE_NOTES.md','EFFECTS_REFERENCE.md','THIRD_PARTY_NOTICES.md','tests/AE_SMOKE_TEST.jsx']:
 payload[name]=(root/name).read_bytes()
sums=''.join(hashlib.sha256(data).hexdigest()+'  '+name+'\n' for name,data in sorted(payload.items()))
payload['SHA256SUMS']=sums.encode()
with zipfile.ZipFile(args.output,'w',zipfile.ZIP_DEFLATED) as z:
 def put(name,data,mode=0o644):
  info=zipfile.ZipInfo(name);info.create_system=3;info.external_attr=(0o100000|mode)<<16;info.compress_type=zipfile.ZIP_DEFLATED;z.writestr(info,data)
 for name,data in sorted(payload.items()):put('MotionAstra-FX/'+name,data)
 for source,destination,mode in [('Install MotionAstra.cmd','Install MotionAstra.cmd',0o644),('install-windows.ps1','Install MotionAstra.ps1',0o644),('install-macos.command','Install MotionAstra.command',0o755),('INSTALLATION_GUIDE.md','INSTALLATION_GUIDE.md',0o644)]:
  data=(root/source).read_bytes()
  if destination.endswith('.cmd'):data=data.decode().replace('\r\n','\n').replace('\n','\r\n').encode()
  put(destination,data,mode)
print(args.output)
