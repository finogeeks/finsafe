import {createRequire} from 'node:module';
import {join} from 'node:path';

// All handles and peer facts stay in the plugin DLL. No generic CLI transport.
export function nativeAdapter(root,{require=createRequire(join(root,'package.json'))}={}) {
  const koffi=require('koffi');
  const library=koffi.load(join(root,'bin','finshield_dsh_native.dll'));
  const invoke=library.func('void* finshield_dsh_call(str input)');
  const free=library.func('void finshield_dsh_free(void* value)');
  let callbackType;
  const call=request=>new Promise((resolve,reject)=>{
    const input=JSON.stringify(request);
    if(Buffer.byteLength(input)>16384) return reject(Error('Native request exceeds 16 KiB'));
    invoke.async(input,(error,pointer)=>{
      if(error) return reject(error);
      try {
        const result=JSON.parse(koffi.decode(pointer,'char',-1));
        if(!result.ok) throw Error(result.error);
        resolve(result.value);
      } catch(error) {reject(error);} finally {free(pointer);}
    });
  });
  call.watchMain=(request,onExit)=>{
    callbackType??=koffi.proto('void FinShieldMainExitCallback(void)');
    const callback=koffi.register(onExit,koffi.pointer(callbackType));
    const watch=library.func('void* finshield_dsh_watch_main(str input, void* callback)');
    let pointer,observer;
    try {
      pointer=watch(JSON.stringify(request),callback);
      const result=JSON.parse(koffi.decode(pointer,'char',-1));
      if(!result.ok)throw Error(result.error);
      observer=result.value.observer;
    }catch(error){koffi.unregister(callback);throw error;}
    finally{if(pointer)free(pointer);}
    return async()=>{
      await call({action:'unwatch_main',observer});
      koffi.unregister(callback);
    };
  };
  return call;
}
