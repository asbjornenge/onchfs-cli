import { config } from 'tiny-env-config'

// ENV VARIABLE CONFIG
export const ONCHFSCLI_TEZOS_PRIVATE_KEY = config('ONCHFSCLI_TEZOS_PRIVATE_KEY', '') 

// SUPPORTED NETWORKS AND THEIR DEFAULTs
export const NETWORKS = {
  'tezos:mainnet': {
    'key': 'tezos:mainnet',
    'RPC': 'https://mainnet.smartpy.io',
    'ONCHFS_CONTRACT_ADDRESS': 'KT1M3JKHiEzo8iLve8AWtRVHd1vW2jiCjXd1',
    // older contracts, only used as read fallback by `get`
    'FALLBACK_CONTRACTS': ['KT1BFSXud4o9NLqauoxiB7oUHxS1wfaf98Gu'],
    // "cheap" CIDs are identical across Tezos L1, Tezos X and EVM onchfs
    'FILE_HASHING_STRATEGY': 'cheap',
    'BATCH_SIZE_LIMIT': 32000
  },
  'tezosx:mainnet': {
    'key': 'tezosx:mainnet',
    'RPC': 'https://michelson.etherlink.mainnet.octez.io',
    'ONCHFS_CONTRACT_ADDRESS': 'KT1JYZ2o6keUiTChNKUQnWDcMkjzES3djjRY',
    'FALLBACK_CONTRACTS': [],
    'FILE_HASHING_STRATEGY': 'cheap',
    // the Etherlink node rejects Taquito's suggested fees as too low
    'FEE_MULTIPLIER': 2,
    'BATCH_SIZE_LIMIT': 32000
  },
  'tezos:ghostnet': {
    'key': 'tezos:ghostnet',
    'RPC': 'https://ghostnet.smartpy.io',
    'ONCHFS_CONTRACT_ADDRESS': 'KT1FA8AGGcJha6S6MqfBUiibwTaYhK8u7s9Q',
    'FALLBACK_CONTRACTS': [],
    'FILE_HASHING_STRATEGY': 'consistent',
    'BATCH_SIZE_LIMIT': 32000
  }
}

// CONFIG Object
export const CONFIG = {
  network: NETWORKS['tezos:mainnet'],
  rpc: null,
  viewCaller: 'tz1burnburnburnburnburnburnburjAYjjX'
}

// Functions to set config
export const set_network = (n) => {
  if (Object.keys(NETWORKS).indexOf(n) < 0) throw new Error(`Unsupported network: ${n}`)
  let network = NETWORKS[n]
  CONFIG.network = network
  return network
}

export const set_config = (key, val) => CONFIG[key] = val

