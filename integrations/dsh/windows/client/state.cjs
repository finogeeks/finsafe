function projectStatus(status) {
  if(!status || status.phase==='loading') return 'loading';
  if(status.phase==='protected') return status.protected===true?'protected':'failed';
  if(status.currentProtected===true&&['failed','cancelled','reboot-required'].includes(status.phase))return 'protected';
  if(['ready','restarting'].includes(status.phase)) return status.phase;
  if(['failed','cancelled','reboot-required'].includes(status.phase)) return 'failed';
  return 'authorizing';
}

function createProtectionStore(read,restart,later) {
  let snapshot={status:null,notice:false,pageVisible:false};
  let readySeen=false,reminderSeen,requesting=false,readVersion=0;
  const listeners=new Set();
  const publish=next=>{snapshot=next;for(const listener of listeners)listener();};
  return {
    getSnapshot:()=>snapshot,
    subscribe(listener){listeners.add(listener);return ()=>listeners.delete(listener);},
    async refresh(){
      const version=++readVersion;
      let status;
      try {status=await read();}catch(error){status={phase:'failed',protected:false,error:error.message};}
      if(version!==readVersion)return;
      const ready=status.phase==='ready';
      const notice=ready&&!status.reminderDismissed?(!readySeen||reminderSeen!==status.reminderId||snapshot.notice):false;
      if(ready){readySeen=true;reminderSeen=status.reminderId;}
      else if(['starting','installing','authorizing','protected'].includes(status.phase))readySeen=false;
      publish({...snapshot,status,notice});
    },
    dismiss(){publish({...snapshot,notice:false});return Promise.resolve(later?.()).catch(error=>{
      publish({...snapshot,status:{...snapshot.status,error:error.message}});
    });},
    showPage(pageVisible){publish({...snapshot,pageVisible});},
    async restart(){
      if(requesting)return;
      readVersion++;
      requesting=true;publish({...snapshot,status:{...snapshot.status,phase:'restarting'},notice:false});
      try{return await restart();}
      catch(error){publish({...snapshot,status:{...snapshot.status,phase:'failed',error:error.message}});throw error;}
      finally{requesting=false;}
    },
  };
}
module.exports={projectStatus,createProtectionStore};
