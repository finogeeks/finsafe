import {createHash} from 'node:crypto';

export function verifyPayload(bytes,sums,name) {
  const matches=sums.split(/\r?\n/).map(line=>/^([a-f0-9]{64})\s+\*?(.+)$/i.exec(line))
    .filter(match=>match?.[2]===name);
  if(matches.length!==1)throw new Error('Expected exactly one official Windows payload checksum');
  if(createHash('sha256').update(bytes).digest('hex')!==matches[0][1].toLowerCase())
    throw new Error('FinSAFE payload SHA256 mismatch');
}

/** Race the two official sources; only verified bytes can win. */
export async function downloadInstaller(version,cdnBaseUrl,options={}) {
  options.signal?.throwIfAborted();
  const controller=new AbortController();
  const signal=options.signal?AbortSignal.any([options.signal,controller.signal]):controller.signal;
  const name=`finshield-${version}-x64-setup.exe`;
  async function download(url,format) {
    try {
      const response=await fetch(url,{signal:AbortSignal.any([signal,AbortSignal.timeout(30_000)])});
      if(!response.ok)throw new Error(`HTTP ${response.status}`);
      return await response[format]();
    } catch(error) {
      throw new Error(`FinShield download failed: ${error.message}: ${url}`,{cause:error});
    }
  }
  async function cdn() {
    const base=`${cdnBaseUrl.replace(/\/$/,'')}/releases/download/v${version}`;
    const metadata=await download(`${base}/release.json`,'json');
    const assets=metadata?.version===version&&Array.isArray(metadata.assets)
      ?metadata.assets.filter(asset=>asset?.name===name&&asset.kind==='windows-installer'):[];
    const asset=assets[0],prefix=`finshield-${version}-x64-setup-`;
    if(assets.length!==1||typeof asset.mirror_name!=='string'||!asset.mirror_name.startsWith(prefix)
      ||!(/^[a-f0-9]{32}\.exe$/).test(asset.mirror_name.slice(prefix.length))
      ||!(/^[a-f0-9]{64}$/i).test(asset.sha256))
      throw new Error('Invalid FinShield release metadata for requested Windows installer');
    const bytes=Buffer.from(await download(`${base}/${asset.mirror_name}`,'arrayBuffer'));
    verifyPayload(bytes,`${asset.sha256}  ${name}`,name);
    return bytes;
  }
  async function github() {
    const base=`https://github.com/finogeeks/finsafe/releases/download/v${version}`;
    const [payload,sums]=await Promise.all([
      download(`${base}/${name}`,'arrayBuffer'),download(`${base}/SHA256SUMS`,'text')]);
    const bytes=Buffer.from(payload);
    verifyPayload(bytes,sums,name);
    return bytes;
  }
  try {
    return await Promise.any([cdn(),github()]);
  } catch(error) {
    options.signal?.throwIfAborted();
    throw new AggregateError(error.errors,
      `FinShield CDN and GitHub download failed: ${error.errors.map(e=>e.message).join('; ')}`);
  } finally {
    controller.abort();
  }
}
