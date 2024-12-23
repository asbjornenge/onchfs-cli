import { config } from 'tiny-env-config'

// ENV VARIABLE CONFIG
export const ONCHFSCLI_TEZOS_PRIVATE_KEY = config('ONCHFSCLI_TEZOS_PRIVATE_KEY', '') 
export const ONCHFSCLI_ETHEREUM_PRIVATE_KEY = config('ONCHFSCLI_ETHEREUM_PRIVATE_KEY', '') 

// SUPPORTED NETWORKS AND THEIR DEFAULTs
export const NETWORKS = {
  'tezos:mainnet': {
    'key': 'tezos:mainnet',
    'RPC': 'https://mainnet.smartpy.io',
    'ONCHFS_CONTRACT_ADDRESS': 'KT1BFSXud4o9NLqauoxiB7oUHxS1wfaf98Gu',
    'BATCH_SIZE_LIMIT': 32000
  },
  'tezos:ghostnet': {
    'key': 'tezos:ghostnet',
    'RPC': 'https://ghostnet.smartpy.io',
    'ONCHFS_CONTRACT_ADDRESS': 'KT1FA8AGGcJha6S6MqfBUiibwTaYhK8u7s9Q',
    'BATCH_SIZE_LIMIT': 32000
  },
  'ethereum:1': {
    'key': 'ethereum:1',
    'RPC': 'https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID',
    'ONCHFS_CONTRACT_ADDRESS': '0xb0e58801d1b4d69179b7bc23fe54a37cee999b09',
    'BATCH_SIZE_LIMIT': 32000
  },
  'ethereum:5': {
    'key': 'ethereum:5',
    'RPC': 'https://goerli.infura.io/v3/YOUR_INFURA_PROJECT_ID',
    'ONCHFS_CONTRACT_ADDRESS': '0xfcfdfa971803e1cc201f80d8e74de71fddea6551',
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

