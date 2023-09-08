
export const MBChainId = 56;

export const MBChainInfo = {
  chainId: MBChainId,
  chainName: 'BNB Chain LlamaNodes',
  rpcUrls: ['https://binance.llamarpc.com'],
  nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
  blockExplorerUrls: ['https://bscscan.com'],
}

export enum ErrorCode {
  addChain=4902,
  notFoundMises=9999
}

export const MBCoinInfo = {
  "address": '0xb60e8dd61c5d32be8058bb8eb970870f07233155',
  "symbol": 'MB',
  "decimals": 18,
  "image": 'logo.png'
}

export const BonusesInfo = {
  "address": '',
  "symbol": 'Bonuses',
  "decimals": 1,
  "image": 'logo.png'
}
export const MisInfo = {
  "address": '',
  "symbol": 'MIS',
  "decimals": 18,
  "image": 'logo.png'
}

export const misesBurnAddress = "0xb60e8dd61c5d32be8058bb8eb970870f07233155"