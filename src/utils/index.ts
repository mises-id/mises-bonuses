import { BigNumberish, ethers } from "ethers";

export const MBChainId = 421613;

export const MBChainInfo = {
  chainId: MBChainId,
  chainName: 'Arbitrum Goerli Testnet',
  rpcUrls: ['https://goerli-rollup.arbitrum.io/rpc'],
  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
  blockExplorerUrls: ['https://goerli.arbiscan.io/'],
}

export enum ErrorCode {
  addChain=4902,
  notFoundMises=9999,
  pleaseWait=-32002
}

export const MBCoinInfo = {
  "address": '0x361377e6ec0b0e457356f0a6da1b1957df22ece9',
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

export const misesBurnAddress = "mises1y4x4fyf07l54n3p0mw393guzugn0he8k7zkr4v"

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

export function getToken() {
  return localStorage.getItem('token')
}

export const TRUNCATED_ADDRESS_START_CHARS = 5;
export const TRUNCATED_NAME_CHAR_LIMIT = 11;
export const TRUNCATED_ADDRESS_END_CHARS = 4;

export function shortenAddress(
  address = '',
  prefix = TRUNCATED_ADDRESS_START_CHARS,
) {
  if (address.length < TRUNCATED_NAME_CHAR_LIMIT) {
    return address;
  }

  return `${address.slice(0, prefix)}...${address.slice(
    -TRUNCATED_ADDRESS_END_CHARS,
  )}`;
}