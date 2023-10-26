import { checkMisesAccount, signin } from "@/api";
import { Uint8ArrayToHexString, setToken, misesBurnAddress } from "@/utils";
import { useRequest } from "ahooks";
import { useEffect, useState } from "react";
import { useLCDClient } from "./uselcdClient";
import BigNumber from "bignumber.js";
import { Buffer } from "buffer"
import { AuthInfo, Coin, Coins, Fee, MsgSend, SignDoc, TxBody, SignerInfo, ModeInfo, SimplePublicKey } from "@terra-money/terra.js";
import { AuthInfo as CosmosAuthInfo } from "@terra-money/terra.proto/cosmos/tx/v1beta1/tx";
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
          console.log('activate', 'case 1')
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
      console.log('activate', 'case 2')
      activate(provider)
    }
  }

  const chainId = 'mainnet';

  // function delay(ms: number) {
  //   return new Promise(resolve => setTimeout(resolve, ms));
  // }
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
        //await delay(30000);
        setToken('mises-token', tokenRes.token)

        localStorage.setItem('misesAccount', result.address)
        const params = new URLSearchParams(`?${result.auth}`)
        if (params.get('pubkey') && params.get('sig') && params.get('nonce')) {
          console.log('set pubkey', params.get('pubkey'))
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
      
      //const gasFee = { amount: gasAmount, denom: 'umis' }
      const gasCoins = new Coins([])
      const fee = new Fee(estimatedGas, gasCoins)
      const messages = [new MsgSend(account, burnAddress, new Coins([Coin.fromData({ "denom": "umis", "amount": sendValue })]))]
      const sequence =  accountInfo.getSequenceNumber()
      let pubkey =  accountInfo.getPublicKey()

      await misesProvider.enable(chainId);

      if (pubkey === null) {
        const key = await misesProvider.getKey(chainId)
        pubkey = new SimplePublicKey(Buffer.from(key.pubKey).toString('base64'))
      }
      const signerInfo = new SignerInfo(
        pubkey!,
        sequence,
        new ModeInfo(
          new ModeInfo.Single(ModeInfo.SignMode.SIGN_MODE_DIRECT)
        )
      );
      const doc = new SignDoc(
        chainId,
        accountInfo.getAccountNumber(),
        sequence,
        new AuthInfo([signerInfo], fee),
        new TxBody(messages, memo)
      )
      
      const signResp = await misesProvider.signDirect(chainId, account, doc.toProto(), {})
      console.log( CosmosAuthInfo.decode(doc.toProto().authInfoBytes))
      // const txString = signTx.map((val: Msg) => {
      //   const msg = JSON.parse(val.toJSON())
      //   const newMsg = {} as { [key: string]: any }
      //   for (const key in msg) {
      //     const labelKey = key as string
      //     newMsg[`${toHump(labelKey)}`] = msg[key]
      //   }
      //   delete newMsg["@type"]
      //   return {
      //     typeUrl: msg["@type"],
      //     value: newMsg,
      //   }
      // })
      const tx = doc.toUnSignedTx()
      console.log(signResp)
      // const sig = Buffer.from(signResp.signature.signature, 'base64').toString()
      // const sigv2 = new SignatureV2(
      //   new SimplePublicKey(signResp.signature.pub_key.value),
      //   new SignatureV2.Descriptor(
      //     new SignatureV2.Descriptor.Single(SignatureV2.SignMode.SIGN_MODE_DIRECT, sig)
      //   ),
      //   sequence
      // );
      // tx.clearSignatures()
      tx.signatures.push(signResp.signature.signature)
      console.log(CosmosAuthInfo.decode(signResp.signed.authInfoBytes))
      const txhash = await lcd.tx.hash(tx)
      console.log(txhash)
      const broadcastResp = await lcd.tx.broadcastBlock(tx)

      console.log(broadcastResp)
      return txhash;
      
      // return await misesProvider.staking({
      //   msgs: txString,
      //   memo: memo,
      //   gasLimit: fee.gas_limit,
      //   gasFee: [gasFee],
      // })
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