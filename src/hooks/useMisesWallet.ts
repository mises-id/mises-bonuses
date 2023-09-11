import { checkMisesAccount } from "@/api";
import { misesBurnAddress } from "@/utils";
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

  const { data: checkAccountData, run } = useRequest(checkMisesAccount, {
    retryCount: 3,
    manual: true
  })

  useEffect(() => {
    walletProvider().then(provider => {
      if (provider) {
        setmisesProvider(provider)
        setisActivating(false)
      }
    })
  }, [])

  const chainId = 'mainnet';

  const activate = async () => {
    try {
      if (misesProvider) {
        await misesProvider.enable(chainId);

        const result: {
          address: string,
          auth: string
        } = await misesProvider.misesAccount()
        setaccount(result.address)
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
          message: 'Not found Mises Provider'
        })
      }
    } catch (error) {
      return Promise.reject(error)
    }
  }

  const lcd = useLCDClient()

  const sendMisTx = async (
    value: string
  ) => {
    if (!account) {
      return Promise.reject();
    }

    const sendValue = BigNumber(value).multipliedBy(BigNumber(10).pow(6)).toString()
    const accountInfo = await lcd.auth.accountInfo(account)
    const estimatedGas = 2000000

    const gasAmount = BigNumber(estimatedGas)
      .times(0.0001)
      .integerValue(BigNumber.ROUND_CEIL)
      .toString()
    
    const gasFee = { amount: gasAmount, denom: 'umis' }
    const gasCoins = new Coins([Coin.fromData(gasFee)])
    const fee = new Fee(estimatedGas, gasCoins)
    const signTx = [new MsgSend(account, misesBurnAddress, new Coins([Coin.fromData({ "denom": "umis", "amount": sendValue })]))]
    
    const doc = new SignDoc(
      chainId,
      accountInfo.getAccountNumber(),
      accountInfo.getSequenceNumber(),
      new AuthInfo([], fee),
      new TxBody(signTx, '')
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
  }

  const refreshMisesAccount = () => {
    
  }

  return {
    misesProvider,
    activate,
    account,
    isActivating,
    sendMisTx,
    checkAccountData,
    misesAccountData,
    refreshMisesAccount
  }
}