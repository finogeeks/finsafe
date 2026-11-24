import {Plugin} from '@opencode/plugin';
import {activateHost} from './host.js';
import {createDesktopAttachment} from './attachment.js';
import {loadNative} from '../updater/bootstrap.js';
import {registerManagement} from './management.js';

export default Plugin.define({id:'finshield.opencode',async setup(ctx){
  return registerManagement(ctx,Promise.resolve(createDesktopAttachment({
      activate:(mainPid,desktop,connectedHostPid,intent)=>activateHost(ctx.options,{mainPid,desktop,connectedHostPid,...intent}),
      observe:()=>loadNative()({action:'identity'}),
      report:error=>console.error('FinShield:',error.message)})));
}});
