import childProcess from 'node:child_process';
import { closeSync, openSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export function launchHelper(pwsh, {operationPath,mainPid,hostPid}, directory) {
  return new Promise((resolve, reject) => {
    const stdout = openSync(join(directory, 'helper.stdout'), 'a');
    const stderr = openSync(join(directory, 'helper.stderr'), 'a');
    let helper;
    try {
      helper = childProcess.spawn(pwsh, ['-NoProfile', '-File', fileURLToPath(new URL('./start-helper.ps1', import.meta.url)),
        '-OperationPath',operationPath,'-MainPid',String(mainPid),'-HostPid',String(hostPid)], {
        stdio: ['ignore', stdout, stderr], windowsHide: true,
      });
    } finally { closeSync(stdout); closeSync(stderr); }
    helper.once('error', reject);
    helper.once('exit', (code, signal) => writeFileSync(join(directory, 'helper-exit.json'), JSON.stringify({pid:helper.pid,code,signal})));
    helper.once('spawn', () => {
      writeFileSync(join(directory, 'helper-start.json'), JSON.stringify({pid:helper.pid,executable:pwsh}));
      helper.unref(); resolve();
    });
  });
}
