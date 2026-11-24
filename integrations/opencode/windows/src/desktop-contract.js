import {Ipc} from '@opencode/plugin/gui/main';

// Fixed Main operation: resend this Main's identity to the current native Host.
export const DesktopAttachment=Ipc.define({id:'finshield.opencode.desktop',methods:{attach:{}}});
