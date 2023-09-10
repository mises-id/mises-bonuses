import { BigNumberish, ethers } from "ethers";

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

export function formatAmount(value: string, unitName?: BigNumberish): string {
  const formatAmount = ethers.formatUnits(value || 0, Number(unitName))
  return formatAmount
}

const erc20ABI = [
  {
    "constant": true,
    "inputs": [],
    "name": "name",
    "outputs": [
      {
        "name": "",
        "type": "string"
      }
    ],
    "payable": false,
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "decimals",
    "outputs": [
      {
        "name": "",
        "type": "uint8"
      }
    ],
    "payable": false,
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      {
        "name": "_owner",
        "type": "address"
      }
    ],
    "name": "balanceOf",
    "outputs": [
      {
        "name": "balance",
        "type": "uint256"
      }
    ],
    "payable": false,
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "symbol",
    "outputs": [
      {
        "name": "",
        "type": "string"
      }
    ],
    "payable": false,
    "type": "function"
  }
]

export const getErc20Balance = async (address: string) => {
  const tokenAddress = MBCoinInfo.address;
  if (address && tokenAddress) {
    try {
      const provider = new ethers.JsonRpcProvider(MBChainInfo.rpcUrls[0]);

      const tokenContract = new ethers.Contract(tokenAddress, erc20ABI, provider);
      
      const balance = await tokenContract.balanceOf(address);
      const decimals = await tokenContract.decimals()
      return {
        value: balance,
        formatted: formatAmount(balance.toString(), decimals)
      }
    } catch (error) {
      return Promise.reject(error);
    }
    
    // return fetchBalance({
    //   address: address,
    //   token: tokenAddress,
    //   chainId: chainId
    // })
  }
}