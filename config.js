import { config } from 'tiny-env-config'

// ENV VARIABLE CONFIG
export const ONCHFSCLI_TEZOS_PRIVATE_KEY = config('ONCHFSCLI_TEZOS_PRIVATE_KEY', '') 

// SUPPORTED NETWORKS AND THEIR DEFAULTs
export const NETWORKS = {
  'tezos:mainnet': {
    'RPC': 'https://mainnet.smartpy.io',
    'ONCHFS_CONTRACT_ADDRESS': 'KT1Ae7dT1gsLw2tRnUMXSCmEyF74KVkM6LUo'
  },
  'tezos:ghostnet': {
    'RPC': 'https://ghostnet.smartpy.io',
    'ONCHFS_CONTRACT_ADDRESS': 'KT1FA8AGGcJha6S6MqfBUiibwTaYhK8u7s9Q'
  }
}

// CONFIG Object
export const CONFIG = {
  network: NETWORKS['tezos:mainnet'],
  rpcs: [],
  max_file_size: 32000 
}

// Functions to set config
export const set_network = (n) => {
  if (Object.keys(NETWORKS).indexOf(n) < 0) throw new Error(`Unsupported network: ${n}`)
  let network = NETWORKS[n]
  CONFIG.network = network
  return network
}

export const set_config = (key, val) => CONFIG[key] = val

