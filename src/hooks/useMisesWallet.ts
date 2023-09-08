import { misesBurnAddress } from "@/utils";
import { useEffect, useState } from "react";

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

export function useMisesWallet() {
  const [misesProvider, setmisesProvider] = useState<any>(undefined)
  const [account, setaccount] = useState<string | undefined>(undefined)
  const [isActivating, setisActivating] = useState(true);
  useEffect(() => {
    walletProvider().then(provider => {
      if (provider) {
        setmisesProvider(provider)
        console.log(provider)
        setisActivating(false)
      }
    })
  }, [])

  const chainId = 'mainnet';

  const activate = async () => {
    try {
      if (misesProvider) {
        await misesProvider.enable(chainId);

        const offlineSigner = misesProvider.getOfflineSigner?.(chainId);

        if (offlineSigner) {
          offlineSigner.getAccounts().then((res: { address: string }[]) => {
            const [account] = res;
            setaccount(account.address);
          });
          return Promise.resolve();
        }
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

  const sendTx = async ({
    sendValue
  }: {
    sendValue: string
  }) => {
    // misesProvider.
    const doc = { 
      "chain_id": "mainnet", 
      "account_number": "22", 
      "sequence": "1036", 
      "fee": { 
        "gas": "260046", 
        "amount": [{ "denom": "umis", "amount": "27" }] 
      }, 
      "msgs": [{ 
        "type": "cosmos-sdk/MsgSend", 
        "value": { 
          from_address: account,
          to_address: misesBurnAddress,
          "amount": { "denom": "umis", "amount": sendValue }
        }
      }],
      "memo": "" 
    }
    return await misesProvider.signAmino(chainId, account, doc)
  }

  return {
    misesProvider,
    activate,
    account,
    isActivating,
    sendTx
  }
}