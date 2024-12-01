import zlib from 'zlib'
import onchfs from './onchfs.js'
import treeify from 'treeify'
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
  const isGzipped = headers.some(h => h[0] === 'content-encoding' && h[1] === 'gzip')

  let data = Buffer.from(fileData).toString('utf-8')
  if (isGzipped) data = zlib.gunzipSync(Buffer.from(fileData))
  process.stdout.write(data)
}

async function buildTree({ onchfsContract, cid }) {
  const inode = await onchfsContract.contractViews.get_inode_at({ cid, path: [] }).executeView({ viewCaller: CONFIG.viewCaller })
  if (!inode.inode.directory) {
    return {}
  }

  const tree = {}
  for (const [name, pointer] of inode.inode.directory.entries()) {
    const childCid = '0x' + pointer
    const childInode = await onchfsContract.contractViews.get_inode_at({ cid: childCid, path: [] }).executeView({ viewCaller: CONFIG.viewCaller })
    if (childInode.inode.directory) {
      tree[name + `: ${pointer}`] = await buildTree({ onchfsContract, cid: childCid })
    } else {
      tree[name] = pointer
    }
  }
  return tree
}

export async function download({ Tezos, URI }) {
  if (!URI.startsWith('onchfs://')) throw new Error('Invalid URI. Must start with onchfs://')
  const onchfsContract = await Tezos.contract.at(CONFIG.network.ONCHFS_CONTRACT_ADDRESS);
  const rpath = URI.split('onchfs://')[1]
  const pathSegments = rpath.split('/')
  const cid = '0x' + pathSegments[0]
  const path = pathSegments.slice(1).filter(p => p != '')
  const out = await onchfsContract.contractViews.get_inode_at({ cid, path }).executeView({ viewCaller: CONFIG.viewCaller })
  if (out.inode.directory) {
    const tree = await buildTree({ onchfsContract, cid: out.cid })
    console.log([`⛓️`].concat(path).join('/'))
    console.log(treeify.asTree(tree, true))
  }
  else {
    await read_file({ onchfsContract, cid: out.cid })
  }
}
