import { config } from 'tiny-env-config'

// ENV VARIABLE CONFIG
export const ONCHFSCLI_TEZOS_PRIVATE_KEY = config('ONCHFSCLI_TEZOS_PRIVATE_KEY', '') 

// SUPPORTED NETWORKS AND THEIR DEFAULTs
export const NETWORKS = {
  'tezos:mainnet': {
    'key': 'tezos:mainnet',
    'RPC': 'https://mainnet.smartpy.io',
    'ONCHFS_CONTRACT_ADDRESS': 'KT1Ae7dT1gsLw2tRnUMXSCmEyF74KVkM6LUo',
    'MAX_FILE_SIZE': 32000
  },
  'tezos:ghostnet': {
    'key': 'tezos:ghostnet',
    'RPC': 'https://ghostnet.smartpy.io',
    'ONCHFS_CONTRACT_ADDRESS': 'KT1FA8AGGcJha6S6MqfBUiibwTaYhK8u7s9Q',
    'MAX_FILE_SIZE': 32000
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

