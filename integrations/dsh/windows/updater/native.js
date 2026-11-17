import {createRequire} from 'node:module';
import {join} from 'node:path';

const packageRequire=createRequire(import.meta.url);

// Application adaptation stays in DSH; the declared SDK owns its product DLL.
export function nativeAdapter(root,{require=createRequire(join(root,'package.json')),
  sdk=packageRequire('@finogeeks2026/finsafe-sdk'),libraryRoot}={}) {
  const native=sdk.createClient({require,libraryRoot});
  const call=request=>native({module:request.action==='identity'?'prepare':'app_seam.dsh',
    request:['select_slot','stage_configuration'].includes(request.action)?
      {candidate:join(root,'policy','candidate.yaml'),...request}:request});
  call.watchMain=(request,onExit)=>native.watchMain({module:'app_seam.dsh',request},onExit);
  return call;
}
