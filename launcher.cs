using System;
using System.Diagnostics;
using System.IO;
using System.Reflection;

namespace AstroAgentLauncher
{
    class Program
    {
        static void Main(string[] args)
        {
            try
            {
                string basePath = AppDomain.CurrentDomain.BaseDirectory;
                string scriptPath = Path.Combine(basePath, "packages", "cli", "dist", "main.js");
                
                if (!File.Exists(scriptPath)) {
                    Console.WriteLine("AstroAgent not found. Ensure it is installed correctly.");
                    Console.ReadLine();
                    return;
                }

                ProcessStartInfo psi = new ProcessStartInfo();
                psi.FileName = "node";
                psi.Arguments = string.Format("\"{0}\"", scriptPath);
                psi.UseShellExecute = false;
                
                Process p = Process.Start(psi);
                p.WaitForExit();
            }
            catch (Exception ex)
            {
                Console.WriteLine("Error launching AstroAgent: " + ex.Message);
                Console.ReadLine();
            }
        }
    }
}
