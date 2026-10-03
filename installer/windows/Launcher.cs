using System;
using System.Diagnostics;
using System.IO;
using System.Windows.Forms;
using System.Reflection;
using System.Threading;
[assembly: AssemblyTitle("ZxT-Motions Installer")]
[assembly: AssemblyProduct("ZxT-Motions")]
[assembly: AssemblyCompany("ZxT-Motions")]
internal static class Launcher {
    [STAThread]
    private static int Main() {
        Application.EnableVisualStyles();
        bool first;
        using (var gate = new Mutex(true, @"Local\MotionAstra.Setup", out first)) {
        if (!first) { MessageBox.Show("ZxT-Motions Setup is already open.", "ZxT-Motions"); return 0; }
        string root = Path.Combine(Path.GetTempPath(), "MotionAstra-Setup-" + Guid.NewGuid().ToString("N"));
        string script = Path.Combine(root, "WindowsUI.ps1");
        try {
            Directory.CreateDirectory(root);
            var assembly = Assembly.GetExecutingAssembly();
            foreach (string name in new [] { "WindowsUI.ps1", "Window.xaml", "Backend.ps1", "Download.ps1", "SetupVersion.txt" }) {
                using (var input = assembly.GetManifestResourceStream(name)) {
                    if (input == null) throw new Exception("Setup resource missing: " + name);
                    using (var output = File.Create(Path.Combine(root, name))) input.CopyTo(output);
                }
            }
            string powershell = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.System), @"WindowsPowerShell\v1.0\powershell.exe");
            var start = new ProcessStartInfo(powershell, "-NoLogo -NoProfile -STA -ExecutionPolicy Bypass -File \"" + script + "\"");
            start.WorkingDirectory = root;
            start.UseShellExecute = false;
            start.CreateNoWindow = true;
            start.WindowStyle = ProcessWindowStyle.Hidden;
            using (var process = Process.Start(start)) {
                process.WaitForExit();
                if (process.ExitCode != 0) MessageBox.Show("ZxT-Motions Setup did not finish. Check your internet connection and Windows PowerShell policy, then retry.", "ZxT-Motions", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return process.ExitCode;
            }
        } catch (Exception error) {
            MessageBox.Show("Unable to start ZxT-Motions Setup.\n\n" + error.Message, "ZxT-Motions", MessageBoxButtons.OK, MessageBoxIcon.Error);
            return 1;
        } finally {
            try { if (Directory.Exists(root)) Directory.Delete(root, true); } catch { }
        }
        }
    }
}
