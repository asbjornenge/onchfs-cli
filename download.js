import zlib from 'zlib';
import onchfs from 'onchfs'
import { CONFIG } from './config.js'
import {
  decodeHeaders,
  hexToUint8Array 
} from './utils.js'

async function read_file({ onchfsContract, cid }) {
  const fileInode = await onchfsContract.contractViews
    .read_file('0x' + cid)
    .executeView({ viewCaller: CONFIG.viewCaller });

  const contentHex = fileInode.content;
  const metadataHex = fileInode.metadata;
  const metadataBytes = hexToUint8Array(metadataHex);
  const headers = decodeHeaders(metadataBytes);
  const fileData = hexToUint8Array(contentHex);
  const isGzipped = headers.filter(h => h[0] === 'content-encoding' && h[1] === 'gzip').length > 0

  let data = Buffer.from(fileData).toString('utf-8')
  if (isGzipped) data = zlib.gunzipSync(Buffer.from(fileData))
  process.stdout.write(data)
}

async function read_dir({ onchfsContract, out }) {
  const files = {}
  for (const [name, pointer] of out.inode.directory.entries()) {
    files[name] = pointer
  }
  console.log(files)
}

export async function download({ Tezos, URI }) {
  if (!URI.startsWith('onchfs://')) throw new Error('Invalid URI. Must start with onchfs://')
  const onchfsContract = await Tezos.contract.at(CONFIG.network.ONCHFS_CONTRACT_ADDRESS);
  const rpath = URI.split('onchfs://')[1]
  const path = rpath.split('/').slice(1).filter(p => p != '')
  const cid = '0x' + rpath.split('/')[0]
  const out = await onchfsContract.contractViews.get_inode_at({ cid, path }).executeView({ viewCaller: CONFIG.viewCaller })
  if (out.inode.directory) await read_dir({ onchfsContract, out })
  else await read_file({ onchfsContract, cid: out.cid })
}
