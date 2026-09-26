"""Exercise the actual macOS installer file transaction in temporary directories."""
import os, hashlib, pathlib, subprocess, tempfile, unittest
ROOT=pathlib.Path(__file__).resolve().parent.parent
class InstallerTests(unittest.TestCase):
 def setUp(self):
  self.temp=tempfile.TemporaryDirectory(prefix='MotionAstra test ');self.root=pathlib.Path(self.temp.name)
  self.payload=self.root/'download'/'MotionAstra-FX';self.payload.mkdir(parents=True)
  for name in ['CSXS/manifest.xml','index.html','jsx/hostscript.jsx','jsx/presets-data.jsx','VERSION']:
   dest=self.payload/name;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes((ROOT/name).read_bytes())
  self.hashes();self.user=self.root/'user extensions';self.backups=self.root/'backups';self.system=self.root/'system extensions';self.user.mkdir();self.system.mkdir()
 def tearDown(self): self.temp.cleanup()
 def hashes(self):
  (self.payload/'SHA256SUMS').write_text(''.join(hashlib.sha256(p.read_bytes()).hexdigest()+'  '+p.relative_to(self.payload).as_posix()+'\n' for p in sorted(self.payload.rglob('*')) if p.is_file() and p.name!='SHA256SUMS'))
 def old(self,name='renamed-old',system=False):
  old=(self.system if system else self.user)/name;(old/'CSXS').mkdir(parents=True);(old/'CSXS/manifest.xml').write_bytes((self.payload/'CSXS/manifest.xml').read_bytes());(old/'sentinel').write_text('old');return old
 def run_install(self,answer='yes\n',preamble=''):
  self.assertIn('ma_install()', (ROOT/'install-macos.command').read_text(), 'Installer needs a testable staged replacement transaction')
  return subprocess.run([os.environ.get('MA_TEST_BASH','/bin/bash'),'-c','source "$1"; '+(preamble+'; ' if preamble else '')+'if ma_install "$2" "$3" "$4" "$5"; then exit 0; else exit $?; fi','test',str(ROOT/'install-macos.command'),str(self.payload),str(self.user),str(self.backups),str(self.system)],input=answer,text=True,capture_output=True)
 def test_clean(self):
  r=self.run_install();self.assertEqual(r.returncode,0,r.stdout+r.stderr);self.assertTrue((self.user/'MotionAstra-FX/index.html').is_file())
 def test_decline_keeps_old(self):
  old=self.old();r=self.run_install('no\n');self.assertEqual(r.returncode,2,r.stdout+r.stderr);self.assertTrue((old/'sentinel').exists(),r.stdout+r.stderr);self.assertFalse((self.user/'MotionAstra-FX').exists())
 def test_replace_detects_renamed_and_system(self):
  a=self.old();b=self.old('system-old',True);r=self.run_install();self.assertEqual(r.returncode,0,r.stdout+r.stderr);self.assertFalse(a.exists());self.assertFalse(b.exists());self.assertEqual(len(list(self.backups.rglob('sentinel'))),2)
 def test_corruption_preserves_old(self):
  old=self.old();(self.payload/'index.html').write_text('damaged');r=self.run_install();self.assertNotEqual(r.returncode,0);self.assertTrue((old/'sentinel').exists())
 def test_unrelated_destination_preserved(self):
  d=self.user/'MotionAstra-FX';d.mkdir();(d/'mine').write_text('do not delete');r=self.run_install();self.assertNotEqual(r.returncode,0);self.assertTrue((d/'mine').exists())
 def test_symlink_rejected(self):
  (self.payload/'link').symlink_to(self.root);r=self.run_install();self.assertNotEqual(r.returncode,0);self.assertFalse((self.user/'MotionAstra-FX').exists())
 def test_failed_activation_rolls_back(self):
  old=self.old();r=self.run_install(preamble='mv(){ if [[ "$1" == */new ]]; then return 1; fi; command mv "$@"; }');self.assertNotEqual(r.returncode,0);self.assertTrue((old/'sentinel').exists(),r.stdout+r.stderr);self.assertFalse((self.user/'MotionAstra-FX').exists())
if __name__=='__main__': unittest.main()
