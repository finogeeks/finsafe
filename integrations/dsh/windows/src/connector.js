import { execFile } from 'node:child_process';


/** Invoke an installed executable directly. No shell or model-supplied arguments. */
export function runFinSafe(executable, args, { signal, timeoutMs = 30000, env } = {}) {
  return new Promise((resolve, reject) => {
    execFile(executable, args, { signal, env, timeout: timeoutMs, windowsHide: true, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
      let result;
      try {
        result = JSON.parse(stdout);
        if (!result || typeof result !== 'object' || Array.isArray(result)) throw new Error('Invalid JSON result');
      } catch {
        reject(error ?? new Error(`FinSAFE returned invalid JSON: ${stderr.trim() || stdout.trim()}`));
        return;
      }
      if (error || (typeof result.exit_code === 'number' && result.exit_code !== 0)) {
        const failure=new Error(result.detail || result.error || stderr.trim() || error?.message || `FinSAFE failed: ${result.exit_code}`);
        failure.authority=result.authority;
        reject(failure);
        return;
      }
      resolve(result);
    });
  });
}
