// OpenCode management. Plugin removal must retain the FinSAFE installation.
import {createUpdater} from '../updater/coordinator.js';
export function createManagement(options){
  const updater=createUpdater(options),request=updater.request;
  updater.request=(id,operation,fields)=>operation==='uninstall'
    ?Promise.reject(Error('Plugin removal retains FinSAFE runtime, configuration and authorization'))
    :request(id,operation,fields);
  return updater;
}
