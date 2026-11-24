import {basename,dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {packageSdk} from './common/package.js';

const root=fileURLToPath(new URL('../',import.meta.url));
// Published 0.11.6/0.11.8 senders copied scripts without dependencies. Their
// fixed profile layout selects this installed DSH package, never a host SDK.
export const sourceRoot=basename(dirname(root))==='.finshield-runtime'
  ?join(dirname(dirname(root)),'node_modules','@finogeeks2026','finshield-dsh'):root;
const packaged=packageSdk(root,{sourceRoot});
export const sdkRoot=packaged.root;
export const sdk=packaged.load();
export const loadKoffi=sdk.loadKoffi;

// Application adaptation stays in DSH; the declared SDK owns its product DLL.
export function nativeAdapter(root,{require,
  sdk:clientSdk=sdk,libraryRoot}={}) {
  const native=clientSdk.createClient({require,libraryRoot});
  const call=request=>native({module:request.action==='identity'?'prepare':'app_seam.dsh',
    request:['select_slot','stage_configuration'].includes(request.action)?
      {candidate:join(root,'policy','candidate.yaml'),...request}:request});
  call.watchMain=(request,onExit)=>native.watchMain({module:'app_seam.dsh',request},onExit);
  call.buildInfo=native.buildInfo;
  call.libraryPath=native.libraryPath;
  call.sdkRoot=native.sdkRoot;
  return call;
}
