using System;
using System.Diagnostics;
using System.IO;
using System.Windows.Forms;
using System.Reflection;
using System.Threading;
[assembly: AssemblyTitle("MotionAstra Installer")]
[assembly: AssemblyProduct("MotionAstra FX")]
[assembly: AssemblyCompany("MotionAstra")]
internal static class Launcher {
    [STAThread]
    private static int Main() {
        Application.EnableVisualStyles();
        bool first;
        using (var gate = new Mutex(true, @"Local\MotionAstra.Setup", out first)) {
        if (!first) { MessageBox.Show("MotionAstra Setup is already open.", "MotionAstra"); return 0; }
        string root = AppDomain.CurrentDomain.BaseDirectory;
        string script = Path.Combine(root, "Installer", "WindowsUI.ps1");
        if (!File.Exists(script)) {
            MessageBox.Show("Extract the complete MotionAstra ZIP before opening the installer.", "MotionAstra", MessageBoxButtons.OK, MessageBoxIcon.Error);
            return 1;
        }
        try {
            string powershell = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.System), @"WindowsPowerShell\v1.0\powershell.exe");
            var start = new ProcessStartInfo(powershell, "-NoLogo -NoProfile -STA -ExecutionPolicy Bypass -File \"" + script + "\"");
            start.WorkingDirectory = root;
            start.UseShellExecute = false;
            start.CreateNoWindow = true;
            start.WindowStyle = ProcessWindowStyle.Hidden;
            using (var process = Process.Start(start)) {
                process.WaitForExit();
                if (process.ExitCode != 0) MessageBox.Show("MotionAstra Setup did not finish. Check that the full ZIP is extracted and that your Windows policy allows local PowerShell scripts. See INSTALLATION_GUIDE.md for help.", "MotionAstra", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return process.ExitCode;
            }
        } catch (Exception error) {
            MessageBox.Show("Unable to start MotionAstra Setup.\n\n" + error.Message, "MotionAstra", MessageBoxButtons.OK, MessageBoxIcon.Error);
            return 1;
        }
        }
    }
}
