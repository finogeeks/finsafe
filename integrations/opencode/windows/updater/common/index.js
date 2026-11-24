export {createActivation} from './activation.js';
export {createUpdater,decideStartup} from './coordinator.js';
export {connectUpdater,obtainUpdater,handleRequest} from './transport.js';
export * from './protocol.js';
import {appendFile} from 'node:fs/promises';

// Diagnostics never participate in an operation's result or readiness.
export function createDiagnostics(destination,{append=appendFile}={}) {
  return fields=>{
    try {if(destination)void append(destination,JSON.stringify(fields)+'\n').catch(()=>{});}catch{}
  };
}
