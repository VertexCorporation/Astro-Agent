const { execSync } = require('child_process');
try {
  const out = execSync('wmic process where "name=\'node.exe\'" get ProcessId,CommandLine').toString();
  const lines = out.split('\n');
  for (const line of lines) {
    if (line.includes('standalone.js')) {
      const pid = line.trim().split(/\s+/).pop();
      console.log('Killing ' + pid);
      execSync('taskkill /F /PID ' + pid);
    }
  }
} catch(e) {
  console.error(e);
}
