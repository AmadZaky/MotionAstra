"""Require one patch increment per main push and matching runtime versions."""
from pathlib import Path
import json,re,subprocess,xml.etree.ElementTree as ET
root=Path(__file__).resolve().parent.parent
version=(root/'VERSION').read_text().strip()
assert re.fullmatch(r'2\.8\.\d+',version),'Version must be 2.8.N'
manifest=ET.parse(root/'CSXS/manifest.xml').getroot()
assert manifest.attrib['ExtensionBundleVersion']==version
assert all(e.attrib['Version']==version for e in manifest.findall('./ExtensionList/Extension'))
assert json.loads((root/'presets.json').read_text())['version']==version
for path in ['js/bridge.js','jsx/hostscript.jsx']:
 assert version in (root/path).read_text(),path+' is stale'
try:
 previous=subprocess.check_output(['git','show','HEAD^:VERSION'],cwd=root,stderr=subprocess.DEVNULL,text=True).strip()
except subprocess.CalledProcessError:
 text=subprocess.check_output(['git','show','HEAD^:CSXS/manifest.xml'],cwd=root,text=True)
 previous=ET.fromstring(text).attrib['ExtensionBundleVersion']
assert previous.startswith('2.8.') and int(version.split('.')[-1])==int(previous.split('.')[-1])+1, f'Expected next patch after {previous}, got {version}'
print('PASS: patch increment and runtime version parity:',version)
