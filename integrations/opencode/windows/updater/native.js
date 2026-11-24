import {createRequire} from 'node:module';
import {join} from 'node:path';
import {packageSdk} from './common/package.js';

export function nativeAdapter(root,{require=createRequire(join(root,'package.json')),
  sdk=packageSdk(root).load()}={}) {
  const native=sdk.createClient();
  const call=request=>native({
    module:'app_seam.opencode',
    request:request.action==='stage_configuration'
      ?{...request,candidate:join(root,'policy','candidate.yaml')}:request,
  });
  call.watchMain=(request,onExit)=>native.watchMain({module:'app_seam.opencode',request},onExit);
  call.buildInfo=native.buildInfo;
  call.libraryPath=native.libraryPath;
  call.sdkRoot=native.sdkRoot;
  return call;
}
