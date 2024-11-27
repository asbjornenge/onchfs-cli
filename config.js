import { config } from 'tiny-env-config'

export const TEZOS_RPC = config('TEZOS_RPC', 'https://ghostnet.smartpy.io')
export const MAX_FILE_SIZE = config('MAX_FILE_SIZE', 32000) 
export const TEZOS_PRIVATE_KEY = config('TEZOS_PRIVATE_KEY', '') 
export const ONCHFS_CONTRACT_ADDRESS = config('ONCHFS_CONTRACT_ADDRESS', 'KT1FA8AGGcJha6S6MqfBUiibwTaYhK8u7s9Q') 
