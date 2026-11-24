function projectStatus(status) {
  if(!status)return 'loading';
  if(['downloading','installing','authorizing','waiting-authorization','exiting','ready'].includes(status.phase))return status.phase;
  if((status.currentProtected??status.protected)===true)return 'protected';
  if(['failed','cancelled','reboot-required'].includes(status.phase)) return 'failed';
  return 'loading';
}

function createProtectionStore(read,exit,later) {
  let snapshot={status:null,notice:false,pageVisible:false,requesting:false,requestError:undefined};
  let readySeen=false,reminderSeen,readVersion=0,requesting=false;
  const listeners=new Set();
  const publish=next=>{snapshot=next;for(const listener of listeners)listener();};
  return {
    getSnapshot:()=>snapshot,
    subscribe(listener){listeners.add(listener);return ()=>listeners.delete(listener);},
    async refresh(){
      const version=++readVersion;
      let status;
      try {status=await read();}catch(error){status={error:error.message};}
      if(version!==readVersion)return;
      const ready=status.phase==='ready';
      const canConfirm=ready;
      const notice=canConfirm&&!status.reminderDismissed?(!readySeen||reminderSeen!==status.reminderId||snapshot.notice):false;
      if(canConfirm){readySeen=true;reminderSeen=status.reminderId;}
      else if(['starting','installing','authorizing','protected'].includes(status.phase))readySeen=false;
      publish({...snapshot,status,notice,requesting:requesting&&snapshot.requesting});
    },
    dismiss(){publish({...snapshot,notice:false,requestError:undefined});return Promise.resolve(later?.()).catch(error=>{
      publish({...snapshot,requestError:error.message});
    });},
    showPage(pageVisible){publish({...snapshot,pageVisible});},
    async exit(){
      if(snapshot.requesting)return;
      readVersion++;
      requesting=true;
      publish({...snapshot,requesting:true,requestError:undefined,notice:false});
      try{const result=await exit();readVersion++;return result;}
      catch(error){publish({...snapshot,requesting:false,requestError:error.message});throw error;}
      finally{requesting=false;}
    },
  };
}
module.exports={projectStatus,createProtectionStore};
