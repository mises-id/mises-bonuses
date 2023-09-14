import React, { useCallback, useEffect, useMemo, useState } from 'react'
import './index.less'
import TokenInput from '@/components/tokenInput'
import { Button, Popup, Toast } from 'antd-mobile'
import { useWeb3React } from '@web3-react/core'
import { hooks, metaMask } from '@/components/Web3Provider/metamask'
import { ErrorCode, MBChainId, MBChainInfo, MBCoinInfo, MisInfo, formatAmount, getErc20Balance } from '@/utils'
import { useMisesWallet } from '@/hooks/useMisesWallet'
import { getAmount } from '@/hooks/useInitialBankBalance'
import { useBoolean, useRequest } from 'ahooks'
import { Coins } from '@terra-money/terra.js'
import { useLCDClient } from '@/hooks/uselcdClient'
import BigNumber from 'bignumber.js'
import { claimAirdrop } from '@/api'
import { usePageValue } from '@/components/pageProvider'
const { useChainId, useAccounts, useIsActivating, useIsActive } = hooks

function MISToMB() {
  const [showConfirmDialog, setshowConfirmDialog] = useState(false)

  const [loading, {setTrue, setFalse}] = useBoolean(false)

  const [formValue, setformValue] = useState<string | undefined>('')
  const [toValue, settoValue] = useState<string | undefined>('')

  const [toBalance, settoBalance] = useState<string | undefined>('')
  const [errorTxt, seterrorTxt] = useState('')


  const { connector } = useWeb3React();

  const { activate: misesProviderActivate, isActivating: misesWalletIsActivating, account: misesAccount, checkAccountData, misesAccountData, sendMisTx, refreshLimit } = useMisesWallet();
  const chainId = useChainId()
  const accounts = useAccounts()
  const isActivating = useIsActivating()

  const isActive = useIsActive()

  // const provider = useProvider()
  // const ENSNames = useENSNames(provider)

  const lcd = useLCDClient()
  const { data: misBalance, refresh: refreshMis } = useRequest(async () => {
    if (!misesAccount) return new Coins()
    const [coins] = await lcd.bank.balance(misesAccount)
    return coins
  }, {
    retryCount: 10,
    refreshDeps: [misesAccount],
    staleTime: Infinity
  })

  const balance = useMemo(() => {
    if(misesWalletIsActivating) {
      return ''
    }
   return formatAmount(getAmount(misBalance!, "umis"), 6)
   // eslint-disable-next-line
  }, [misBalance])

  useEffect(() => {
    if(Number(balance) > 0) {
      // min exchange
      if(accountData?.mb_airdrop?.min_redeem_mis_amount && balance) {
        const compared = BigNumber(balance).comparedTo(accountData?.mb_airdrop?.min_redeem_mis_amount)
        if(compared === -1) {
          return
        }
      }
      console.log(checkAccountData?.current_airdrop_limit)
      if(checkAccountData?.current_airdrop_limit === 0) {
        seterrorTxt('No redemption limit left')
      }
      if(checkAccountData?.current_airdrop_limit) {
        const limit = formatAmount(`${checkAccountData.current_airdrop_limit}`, 6)
        const value = BigNumber.min(limit, balance).toString()
        formValueChange(value)
      }
    }
    // eslint-disable-next-line
  }, [balance])
  
  const setClaimReceiveAddress = async () => {
    if(misesAccount && accounts?.length && misesAccountData?.pubkey) {
      try {
        await claimAirdrop({receive_address: accounts[0]})
      } catch (error: any) {
        if(error.response && error.response.status === 403 && error.response.data.code === 403002) {
          localStorage.removeItem('token');
          misesProviderActivate()
        }
        return Promise.reject(error)
      }
    }
  }

  useEffect(() => {
    if(accounts && accounts.length) {
      getErc20Balance(accounts[0]).then(res => {
        settoBalance(Number(res?.formatted).toFixed(6) || '')
      })
      setClaimReceiveAddress()
    }
    // eslint-disable-next-line
  }, [accounts])


  const stepStatus = useMemo(() => {
    if(!misesAccount) {
      return 1;
    }

    // ethereum account connected
    if(!isActive) {
      return 2;
    }
    return 3;

  }, [misesAccount, isActive])

  const stepStatusText = useMemo(() => {
    if(stepStatus === 1) {
      return 'Step1: Connect wallet for MIS';
    }

    // ethereum account connected
    if(stepStatus === 2) {
      return 'Step2: Connect wallet for MB';
    }
    if((!formValue && !toValue) || (formValue && BigNumber(formValue).isZero())) {
      return 'Enter an amount'
    }
    return 'Redeem';

  }, [formValue, stepStatus, toValue])

  // button state text
  const ButtonText = useMemo(() => {
    if (isActivating) {
      return 'Connecting wallet...'
    }
    if(misesWalletIsActivating) {
      return 'Connecting Mises wallet...'
    }
    
    if(errorTxt) {
      return errorTxt
    }

    return stepStatusText
  }, [isActivating, stepStatusText, misesWalletIsActivating, errorTxt])

  // button status 
  const buttonDisabled = useMemo(() => {
    if (isActivating || misesWalletIsActivating || errorTxt) {
      return true;
    }

    if((!formValue && !toValue && misesAccount && accounts) || (formValue && BigNumber(formValue).isZero())) {
      return true
    }

    return false;
  }, [isActivating, misesWalletIsActivating, errorTxt, formValue, toValue, misesAccount, accounts])

  const connectWallet = async () => {
    try {
      if (!isActivating && !isActive) {
        return await connector.activate()
      }
      return Promise.resolve()
    } catch (error) {
      return Promise.reject(error)
    }
  }

  const checkChainId = useCallback(
    async () => {
      try {
        if (chainId !== MBChainId) {
          return await connector.activate(MBChainId)
        }
        return Promise.resolve()
      } catch (error: any) {
        if (error.code === ErrorCode.addChain) {
          return connector.activate(MBChainInfo)
        }
        return Promise.reject(error)
      }
    },
    [connector, chainId],
  )

  const checkUserAddress = async () => {
    console.log(accounts)
    if (accounts && accounts.length) {
      return Promise.resolve()
    }
    return Promise.reject({
      code: 9998,
      message: 'Check user address failed'
    })
  }

  const resetData = () => {
    setformValue('')
    settoValue('')
    setshowConfirmDialog(true)
    setFalse()
    refreshMis()
    refreshLimit()
  }

  const buttonClick = async () => {
    try {
      // connect mises wallet
      if(stepStatus === 1) {
        await misesProviderActivate()
        return;
      }
      // connect eth wallet
      if(stepStatus === 2) {
        await connectWallet();
        await checkChainId();
        return;
      }

      // redeem token
      setTrue();
      if(stepStatus === 3) {
        await checkUserAddress()
        await setClaimReceiveAddress()
        if(formValue) {
          const aaa = await sendMisTx(formValue)
          console.log(aaa)
        }
        resetData()
      }
      
    } catch (error: any) {
      setFalse()
      if(error.message) {
        Toast.show(error.message)
      }
      console.log(error.message, 'error')
    }
  }

  // attempt to connect eagerly on mount
  useEffect(() => {
    metaMask.connectEagerly().catch(() => {
      console.debug('Failed to connect eagerly to metamask')
    })
  }, [])

  const addMB = () => {
    connector.watchAsset?.(MBCoinInfo)
    setshowConfirmDialog(false)
  }

  const { accountData } = usePageValue()

  const replaceValue = (val: string, decimals: number = 18) => {
    const valueRegex = new RegExp( `^\\d*[.]?\\d{0,${decimals}}`,'g')
    return val.replace(/[^\d^.?]+/g, "")?.replace(/^0+(\d)/, "$1")?.replace(/^\./, "0.")?.match(valueRegex)?.[0] || ""
  }

  const formValueChange = (e: string) => {
    const value = replaceValue(e)
    setformValue(value)
    settoValue(value)
    const compared = BigNumber(balance || '0').comparedTo(value)
    if(compared === -1) {
      seterrorTxt('Insufficient balance')
      return
    }

    if(accountData?.mb_airdrop?.min_redeem_mis_amount && value) {
      const compared = BigNumber(value).comparedTo(accountData?.mb_airdrop?.min_redeem_mis_amount)
      if(compared === -1) {
        seterrorTxt(`Minimum redeem ${accountData?.mb_airdrop?.min_redeem_mis_amount} MIS`)
        return
      }
    }

    if(checkAccountData?.current_airdrop_limit && value) {
      const limit = formatAmount(`${checkAccountData.current_airdrop_limit}`, 6)
      const redeemCompared = BigNumber(limit).comparedTo(value)
      if(redeemCompared === -1) {
        seterrorTxt(`Exceeded the exchange limit, maximum exchange amount is ${formatAmount(`${checkAccountData.total_airdrop_limit}`, 6)}MIS, already exchanged ${limit}MIS.`)
        return 
      }
    }
    seterrorTxt('')
  }

  const Extra = () => {
    // const token = getToken()
    if(!misesAccount) { return null }
    const limit = formatAmount(`${checkAccountData?.current_airdrop_limit || 0}`, 6)
    return <div className='text-right mt-10 text-[#7780a0]'>limit: {limit}MIS</div>
  }

  return (
    <div>
      <p className='p-20 text-16 m-0'>Redeem <span className='font-bold text-[#5d61ff]'>MIS</span> for <span className='font-bold text-[#5d61ff]'>MB</span></p>
      <div className='container bg-white dark:bg-[#0d111c] w-[95%] md:w-[450px]'>
        <div className="flex justify-between items-center px-8 py-12 mb-8 text-18">
          <p className="title">Redeem</p>
        </div>
        <TokenInput
          coinInfo={MisInfo}
          value={formValue}
          onChange={formValueChange}
          showMax={false}
          readOnly
          balance={balance}
          extra={<Extra />}
          account={misesAccount}
        />
        <div className='h-35 w-35 rounded-[12px] mx-auto my-[-18px] border-4 border-solid relative z-10 border-[#fff] dark:border-[#0d111c] dark:bg-[#293249] bg-[#e8ecfb] flex items-center justify-center'>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#98A1C0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>
        </div>
        <TokenInput 
          coinInfo={MBCoinInfo}
          value={toValue}
          readOnly
          balance={toBalance}
          account={accounts && accounts[0]}
        />
        <div className='mt-10'>
          <Button
            block
            loading={loading}
            disabled={buttonDisabled}
            loadingText="Sent TX"
            style={{ "--background-color": "#5d61ff", "--border-color": "#5d61ff", 'padding': '12px', borderRadius: 12, "--text-color": 'white' }}
            onClick={buttonClick}
          >
            <span className='text-[white] text-18'>{ButtonText}</span>
          </Button>
        </div>
      </div>
      <div className='container w-[95%]  md:w-[450px] bg-white dark:bg-[#0d111c]'>
        <p className='text-[16px] font-200 text-gray-500 leading-6 p-10'>
        On September 7, 2023, a snapshot of the Mis chain was taken to determine the amount you can redeem. The redeemable quantity is based on this snapshot and cannot exceed the snapshot value. The exchange rate from Mis to MB is set at a 1:1 ratio. Minimum exchange {accountData?.mb_airdrop?.min_redeem_mis_amount} MIS
        </p>
      </div>
      <Popup
        position='bottom'
        showCloseButton
        bodyClassName="rounded-t-10"
        onMaskClick={() => {
          setshowConfirmDialog(false)
        }}
        visible={showConfirmDialog}
        onClose={() => {
          setshowConfirmDialog(false)
        }}>
        <div className='py-30 px-20'>
          <p className='text-16 leading-[24px] text-gray-500'>
            Your request for exchange has been duly acknowledged and is anticipated to be processed within several hours. Kindly monitor your wallet for updates.
          </p>
          <div className='flex justify-center items-center mt-40'>
            <Button className='w-[40%]' onClick={addMB} style={{ "--background-color": "#5d61ff", "--border-color": "#5d61ff", borderRadius: 12 }}>
              <span className='text-white'>Add $MB</span>
            </Button>
          </div>
        </div>
      </Popup>
    </div>
  )
}

export default MISToMB