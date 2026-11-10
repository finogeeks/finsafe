import { appendFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, statSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, isAbsolute, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import Schema from '@deepseek-ai/schemastery';
import { activatePlugin } from '../handoff/activation.js';
import { launchHelper } from '../handoff/launch-helper.js';
import { readCurrentToken, readKnownFolders } from '../handoff/token.js';
import { resolveSettings, readPluginInstallation, securityDomain } from './settings.js';
import { registerStatus } from './status.js';
import {installRuntime,runProcess,observeSetupResult,resumeSetup,waitForSetup} from '../install/runtime.js';
import {prepareRuntime,readPreparation} from './preparation.js';

export const name = 'finsafe-windows';
export const inject = ['typert'];
export const Config = Schema.object({
  installation:Schema.string(), configuration:Schema.string(), pwsh:Schema.string(),
  stateDirectory:Schema.string(),
});

/** Standard Desktop plugin. Keep installed DSH's home, login data and executable. */
export async function apply(ctx, config = {}) {
  if (process.platform !== 'win32' || !/dsh-desktop-host[\\/]lib[\\/]index\.js$/.test(process.argv[1] || '')) {
    throw new Error('FinSAFE desktop handoff requires the Windows DSH Desktop Host');
  }
  const runtimeRoot = process.argv[2];
  if (!runtimeRoot || !isAbsolute(runtimeRoot)) throw new Error('Missing DSH runtime directory');
  const require = createRequire(join(runtimeRoot, 'node_modules', '@deepseek-ai', 'dsh', 'package.json'));
  const { resolveDshHome } = await import(pathToFileURL(require.resolve('@deepseek-ai/dsh-home-paths')).href);
  const dshHome = resolveDshHome();
  let state = {phase:'starting',securityDomain,pid:process.pid,parentPid:process.ppid};
  let settings;
  let setupResultPath;
  const observe = () => {
    return readCurrentToken(runtimeRoot);
  };
  const {bindTypertRemote} = await import(pathToFileURL(require.resolve('@deepseek-ai/dsh-typert-protocol')).href);
  let startRestart;
  let preparationAvailable=false;
  const currentState=async()=>{
    if(active && preparationAvailable && ['authorizing','ready'].includes(state.phase)) {
      const native=await readPreparation(settings);
      if(active && ['authorizing','ready'].includes(state.phase)) state={...state,...native,phase:native.phase==='ready'&&!startRestart?'authorizing':native.phase};
    }
    if(active && state.phase==='restarting' && operation) {
      const failure=join(operation.root,'handoff-error.txt');
      if(existsSync(failure)) state={...state,phase:'failed',error:readFileSync(failure,'utf8')};
    }
    return observeSetupResult(state,setupResultPath);
  };
  registerStatus(ctx,currentState,observe,bindTypertRemote,async()=>{
    if(state.phase!=='ready' || !startRestart) throw new Error('FinShield is not ready to restart');
    state={...state,phase:'restarting'};
    try {await startRestart();return {accepted:true};}
    catch(error){state={...state,phase:'failed',error:error.message};throw error;}
  });
  let operation;
  let active=true;
  ctx.effect(()=>()=>{active=false;});
  let stateDirectory = join(dshHome,'finsafe-windows');
  // Activation must return before downloads, native setup or Windows consent.
  void initialize();
  async function initialize() {
  try {
    let inputs = config;
    if (process.env.FINSAFE_DSH_PLUGIN_ATTEMPT) {
      operation = JSON.parse(readFileSync(process.env.FINSAFE_DSH_PLUGIN_ATTEMPT, 'utf8'));
      if (operation.scope !== 'installed-desktop-plugin' || realpathSync.native(operation.desktop) !== realpathSync.native(process.execPath)) {
        throw new Error('Invalid Desktop handoff operation');
      }
      // Carry the resolved launch inputs across confinement; LocalAppData can change there.
      inputs = {...operation.settings,...config};
    }
    settings=resolveSettings(inputs,{dshHome,...readKnownFolders(runtimeRoot)});
    stateDirectory=settings.stateDirectory;
    mkdirSync(stateDirectory,{recursive:true});
    const version=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8')).version;
    const marker=join(stateDirectory,`setup-${version}.json`);
    const previous=existsSync(marker)?JSON.parse(readFileSync(marker,'utf8')):undefined;
    const resumed=previous?resumeSetup(state,previous):undefined;
    if(previous) {
      setupResultPath=previous.resultPath;
      state=resumed.state;
      if(resumed.blocked) {
        writeFileSync(join(stateDirectory,'status.json'),JSON.stringify(state));
        return;
      }
      if(resumed.waiting) {
        state=await waitForSetup(state,setupResultPath,{active:()=>active,onState:value=>{state=value;}});
        if(!active) return;
        if(state.phase!=='completed') throw new Error(state.error || `Native setup: ${state.phase}`);
      }
    }
    let installedVersion;
    try {
      statSync(settings.executable);
      const result=await runProcess(settings.executable,['--version']);
      if(result.code) throw new Error(result.stderr || 'Cannot read installed FinSAFE version');
      installedVersion=/^finsafe (\d+\.\d+\.\d+)\s*$/.exec(result.stdout.trim())?.[1];
      if(!installedVersion) throw new Error('Invalid installed FinSAFE version result');
    } catch(error) { if(error.code!=='ENOENT') throw error; }
    const installedRecord=await readPluginInstallation(settings);
    if(!active) return;
    if(installedVersion!==version || !installedRecord) {
      if(previous && !resumed.retry) {
        setupResultPath=previous.resultPath;
        state=observeSetupResult({...state,phase:'installing'},setupResultPath);
        if(!state.nativeSetup && previous.error) state={...state,phase:previous.phase || 'failed',error:previous.error};
        throw new Error(state.nativeSetup?.detail || previous.error || `Previous native setup: ${state.phase}. The coordinated plugin installation did not complete.`);
      }
      writeFileSync(marker,JSON.stringify({version,phase:'started'}));
      const token=readCurrentToken(runtimeRoot);
      state={...state,phase:'installing'};
      writeFileSync(join(stateDirectory,'config.json'),JSON.stringify(settings));
      let result;
      try {
        const downloads=token.appContainer ? join(stateDirectory,'downloads') : settings.downloads;
        result=await installRuntime(downloads,version,{...settings,confined:token.appContainer,
          record:installedRecord,
          onRequest:request=>{
            setupResultPath=request.resultPath || join(dirname(request.package),'setup-result.json');
            // Native replacement can stop this Host before dispatch returns.
            writeFileSync(marker,JSON.stringify({version,phase:'installing',resultPath:setupResultPath}));
          },
        });
      } catch(error) {
        writeFileSync(marker,JSON.stringify({version,resultPath:setupResultPath,
          handoff:!setupResultPath?'not-started':error.handoff || 'unconfirmed',
          phase:[2,1223,1602].includes(error.setupCode)?'cancelled':'failed',error:error.message}));
        throw error;
      }
      setupResultPath=result.resultPath;
      writeFileSync(marker,JSON.stringify({version,...result}));
      if(result.pending) {
        state={...state,phase:'installing'};
        writeFileSync(join(stateDirectory,'status.json'),JSON.stringify(state));
        state=await waitForSetup(state,setupResultPath,{active:()=>active,onState:value=>{state=value;}});
        if(!active) return;
        if(state.phase!=='completed') throw new Error(state.error || `Native setup: ${state.phase}`);
      }
      if(result.rebootRequired) {
        state={...state,phase:'reboot-required'};
        writeFileSync(join(stateDirectory,'status.json'),JSON.stringify(state));
        return;
      }
    }
    if(!active) return;
    const initialToken=readCurrentToken(runtimeRoot);
    if(!initialToken.appContainer) {
      state={...state,phase:'authorizing'};
      writeFileSync(join(stateDirectory,'status.json'),JSON.stringify(state));
      preparationAvailable=true;
      const native=await prepareRuntime(settings);
      if(!active) return;
      state={...state,...native};
      writeFileSync(join(stateDirectory,'status.json'),JSON.stringify(state));
    }
    if(!active || ['cancelled','failed'].includes(state.phase)) return;
    const {executable:finsafe,yamlPath:policy}=settings;
    const effective=require('yaml').parse(readFileSync(policy,'utf8'));
    if(effective.security_domain_id!==securityDomain) throw new Error('The plugin requires its independent finshield.dsh security domain');
    const token = observe();
    if (!operation && !token.appContainer) {
      const root = mkdtempSync(join(stateDirectory, 'handoff-'));
      operation = {scope:'installed-desktop-plugin',root,desktop:process.execPath,dshHome,runtimeRoot,
        finsafe,policy,pwsh:settings.pwsh,stateDirectory,settings};
      writeFileSync(join(stateDirectory, 'last-attempt.json'), JSON.stringify(operation));
    }
    const record = event => {
      const observation = {...event,securityDomain,pid:process.pid,parentPid:process.ppid,at:new Date().toISOString()};
      state = {...state,...observation,logDirectory:operation?.root};
      writeFileSync(join(stateDirectory, 'status.json'), JSON.stringify(state));
      if (operation) {
        appendFileSync(join(operation.root, 'activations.jsonl'), JSON.stringify(observation) + '\n');
        writeFileSync(join(operation.root, `${event.phase}.json`), JSON.stringify(observation));
      }
      ctx.logger.info(`FinSAFE ${observation.phase}: ${securityDomain}; Host PID ${process.pid}`);
    };
    startRestart=async()=>{
      const operationPath=join(operation.root,'operation.json');
      writeFileSync(operationPath,JSON.stringify(operation));
      await launchHelper(operation.pwsh,{operationPath,mainPid:process.ppid,hostPid:process.pid},operation.root);
    };
    await activatePlugin({ token }, {
      record,
      ready: async () => {
        const native=await readPreparation(settings);
        if(!active) return;
        state={...state,...native};
        writeFileSync(join(stateDirectory,'status.json'),JSON.stringify(state));
      },
    });
  } catch (error) {
    if(!active) return;
    if([2,1223,1602].includes(error.setupCode) || error.authority==='uac_cancelled') state={...state,phase:'cancelled'};
    state = {...state,phase:['cancelled','reboot-required'].includes(state.phase)?state.phase:'failed',error:error.message};
    mkdirSync(stateDirectory,{recursive:true});
    writeFileSync(join(stateDirectory,'status.json'),JSON.stringify(state));
    if (operation) writeFileSync(join(operation.root, 'plugin-error.txt'), error.stack || String(error));
    ctx.logger.error(`FinSAFE protection failed: ${error.message}`);
  }
  }
}
