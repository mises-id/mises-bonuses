import { checkMisesAccount, signin } from "@/api";
import { Uint8ArrayToHexString, setToken, misesBurnAddress } from "@/utils";
import { useRequest } from "ahooks";
import { useEffect, useState } from "react";
import { useLCDClient } from "./uselcdClient";
import BigNumber from "bignumber.js";
import { AuthInfo, Coin, Coins, Fee, Msg, MsgSend, SignDoc, TxBody } from "@terra-money/terra.js";

export async function walletProvider() {
  if (window.misesWallet) {
    return window.misesWallet;
  }
  if (document.readyState === "complete") {
    return window.misesWallet;
  }

  return new Promise((resolve, reject) => {
    const documentStateChange = (event: any) => {
      if (event.target && event.target.readyState === "complete") {
        window.misesWallet ? resolve(window.misesWallet) : reject('Get wallet state failed');

        document.removeEventListener("readystatechange", documentStateChange);
      }
    };

    document.addEventListener("readystatechange", documentStateChange);
  });
}

export const toHump = (name: string) => {
  // eslint-disable-next-line no-useless-escape
  return name.replace(/\_(\w)/g, (all, letter) => letter.toUpperCase())
}

export function useMisesWallet() {
  const [misesProvider, setmisesProvider] = useState<any>(undefined)
  const [account, setaccount] = useState<string | undefined>(undefined)
  const [misesAccountData, setmisesAccountData] = useState<{
    pubkey: string,
    sig: string,
    nonce: string,
  } | undefined>(undefined)
  const [isActivating, setisActivating] = useState(true);

  const { data: checkAccountData, run, refresh } = useRequest(checkMisesAccount, {
    retryCount: 3,
    manual: true
  })

  useEffect(() => {
    walletProvider().then(provider => {
      if (provider) {
        setmisesProvider(provider)
        setisActivating(false)
        checkConnect(provider)
        window.addEventListener("mises_keystorechange", async () => {
          activate(provider)
        })
      }
    })
    // eslint-disable-next-line
  }, [])

  const checkConnect = async (provider: any) => {
    const getMisesAccount = localStorage.getItem("misesAccount");
    const isUnlock = await provider.isUnlocked()
    console.log(isUnlock, getMisesAccount)
    if (getMisesAccount && isUnlock) {
      activate(provider)
    }
  }

  const chainId = 'mainnet';

  const activate = async (provider = misesProvider) => {
    console.log(provider)
    try {
      if (provider) {
        await provider.enable(chainId);

        const result: {
          address: string,
          auth: string
        } = await provider.misesAccount()
        setaccount(result.address)
        
        const tokenRes = await signin(result.auth)
        setToken('mises-token', tokenRes.token)

        localStorage.setItem('misesAccount', result.address)
        const params = new URLSearchParams(`?${result.auth}`)
        if (params.get('pubkey') && params.get('sig') && params.get('nonce')) {
          setmisesAccountData({
            pubkey: params.get('pubkey')!,
            sig: params.get('sig')!,
            nonce: params.get('nonce')!
          })
        }
        run(result.address)
        return Promise.resolve();
      } else {
        return Promise.reject({
          code: 9999,
          message: 'Please download Mises Browser'
        })
      }
    } catch (error) {
      return Promise.reject(error)
    }
  }

  const lcd = useLCDClient()
  
  const sendMisTx = async (
    value: string,
    memo: string,
    serverBurnAddress?: string
  ) => {
    if (!account) {
      return Promise.reject({
        code: 9998,
        message: 'Not found Mises account'
      });
    }
    const burnAddress = process.env.REACT_APP_NODE_ENV==='production' ? serverBurnAddress : misesBurnAddress;

    if(!burnAddress) {
      return Promise.reject({
        code: 9998,
        message: 'Not found Mises burnAddress'
      });
    }

    try {
      const sendValue = BigNumber(value).multipliedBy(BigNumber(10).pow(6)).toString()
      const accountInfo = await lcd.auth.accountInfo(account)
      const estimatedGas = 2000000

      const gasAmount = BigNumber(estimatedGas)
        .times(0.0001)
        .integerValue(BigNumber.ROUND_CEIL)
        .toString()
      console.log(gasAmount)
      
      const gasFee = { amount: gasAmount, denom: 'umis' }
      const gasCoins = new Coins([Coin.fromData(gasFee)])
      const fee = new Fee(estimatedGas, gasCoins)
      const signTx = [new MsgSend(account, burnAddress, new Coins([Coin.fromData({ "denom": "umis", "amount": sendValue })]))]
      
      const doc = new SignDoc(
        chainId,
        accountInfo.getAccountNumber(),
        accountInfo.getSequenceNumber(),
        new AuthInfo([], fee),
        new TxBody(signTx, memo)
      )
      await misesProvider.enable(chainId);

      await misesProvider.signAmino(chainId, account, doc.toAmino(), {})

      const txString = signTx.map((val: Msg) => {
        const msg = JSON.parse(val.toJSON())
        const newMsg = {} as { [key: string]: any }
        for (const key in msg) {
          const labelKey = key as string
          newMsg[`${toHump(labelKey)}`] = msg[key]
        }
        delete newMsg["@type"]
        return {
          typeUrl: msg["@type"],
          value: newMsg,
        }
      })

      return await misesProvider.staking({
        msgs: txString,
        gasLimit: fee.gas_limit,
        gasFee: [gasFee],
      })
    } catch (error) {
      return Promise.reject(error)
    }
  }

  const signMessage = async (signData: string) => {
    try {
      const msg: Uint8Array = await misesProvider.signEthereum(chainId, account, signData, 'message');
    
      return `${Uint8ArrayToHexString(msg)}`;
    } catch (error) {
      return Promise.reject(error)
    }
  }

  return {
    misesProvider,
    activate,
    account,
    isActivating,
    sendMisTx,
    checkAccountData,
    misesAccountData,
    signMessage,
    refreshLimit: refresh
  }
}