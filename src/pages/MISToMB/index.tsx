import React, { useEffect, useMemo, useState } from 'react'
import './index.less'
import TokenInput from '@/components/tokenInput'
import { Button, Popup, Toast } from 'antd-mobile'
import { useWeb3React } from '@web3-react/core'
import { hooks, metaMask } from '@/components/Web3Provider/metamask'
import { MBCoinInfo, MisInfo, formatAmount, getErc20Balance, removeToken } from '@/utils'
import { useMisesWallet } from '@/hooks/useMisesWallet'
import { getAmount } from '@/hooks/useInitialBankBalance'
import { useBoolean, useRequest } from 'ahooks'
import { Coins } from '@terra-money/terra.js'
import { useLCDClient } from '@/hooks/uselcdClient'
import BigNumber from 'bignumber.js'
import { claimAirdrop } from '@/api'
import { usePageValue } from '@/components/pageProvider'
import DownloadPop from '@/components/DownloadPop'
const { useAccounts, useIsActivating, useIsActive } = hooks

function MISToMB() {
  const [showConfirmDialog, setshowConfirmDialog] = useState(false)
  const [showSubmitDialog, setshowSubmitDialog] = useState(false)

  const [loading, {setTrue, setFalse}] = useBoolean(false)

  const [formValue, setformValue] = useState<string | undefined>('')
  const [toValue, settoValue] = useState<string | undefined>('')

  const [toBalance, settoBalance] = useState<string | undefined>('')
  const [errorTxt, seterrorTxt] = useState('')

  const [downloadPop, setDownloadPop] = useState(false)


  const { connector } = useWeb3React();

  const { activate: misesProviderActivate, isActivating: misesWalletIsActivating, account: misesAccount, checkAccountData, misesAccountData, sendMisTx, refreshLimit } = useMisesWallet();
  // const chainId = useChainId()
  const accounts = useAccounts()
  
  const isActivating = useIsActivating()

  const isActive = useIsActive()

  const { accountData } = usePageValue()

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

  const initFormData = () => {
    formValueChange('');

    if(Number(balance) > 0) {
      // min exchange
      if(accountData?.mb_airdrop?.min_redeem_mis_amount && balance) {
        const compared = BigNumber(balance).comparedTo(accountData?.mb_airdrop?.min_redeem_mis_amount)
        if(compared === -1) {
          seterrorTxt('Insufficient balance')
          return
        }
      }
      if(checkAccountData?.current_airdrop_limit === 0) {
        seterrorTxt('No redemption limit left')
      }
      if(checkAccountData?.current_airdrop_limit) {
        const limit = formatAmount(`${checkAccountData.current_airdrop_limit}`, 6)
        const value = BigNumber.min(limit, balance)
        const compared = BigNumber(balance).comparedTo(checkAccountData.current_airdrop_limit)
        if(compared === -1) {
          formValueChange(value.minus(0.003).toString())
        }else {
          formValueChange(value.toString())
        }
      }
    }
  }
  useEffect(() => {
    initFormData()
    // eslint-disable-next-line
  }, [balance, checkAccountData?.current_airdrop_limit, accountData?.mb_airdrop?.min_redeem_mis_amount])
  
  const claimReceiveAddress = async (tx_hash?: string) => {
    if(misesAccount && accounts?.length && misesAccountData?.pubkey) {
      try {
        await claimAirdrop({receive_address: accounts[0], tx_hash: tx_hash})
      } catch (error: any) {
        if(error.response && error.response.status === 403 && error.response.data.code === 403002) {
          removeToken('mises-token')
          misesProviderActivate()
        }
        return Promise.reject(error)
      }
    }
  }

  const { run: setClaimReceiveAddress } = useRequest(claimReceiveAddress, {
    manual: true,
    retryCount: 3
  })

  useEffect(() => {
    if(accounts && accounts.length) {
      getErc20Balance(accounts[0]).then(res => {
        if(res?.formatted) {
          const balance = BigNumber(res?.formatted).decimalPlaces(6, BigNumber.ROUND_DOWN).toString()
          settoBalance(balance)
        }
      })
      // setClaimReceiveAddress()
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
    // if(misesWalletIsActivating) {
    //   return 'Connecting Mises wallet...'
    // }
    
    if(errorTxt) {
      return errorTxt
    }

    return stepStatusText
  }, [isActivating, stepStatusText, errorTxt])

  // button status 
  const buttonDisabled = useMemo(() => {
    if (isActivating || errorTxt) {
      return true;
    }

    if((!formValue && !toValue && misesAccount && accounts) || (formValue && BigNumber(formValue).isZero())) {
      return true
    }

    return false;
  }, [isActivating, errorTxt, formValue, toValue, misesAccount, accounts])

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

  const resetData = async () => {
    setformValue('')
    settoValue('')
    setshowConfirmDialog(true)
    setFalse()
    await refreshMis()
    await refreshLimit()
    initFormData()
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
        return;
      }

      // redeem token
      setshowSubmitDialog(true)
      
    } catch (error: any) {
      if(error && error.message === 'Please download the latest version of Mises Browser.') {
        setDownloadPop(true)
        return
      }
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

  const closeConfirm = async () => {
    setshowConfirmDialog(false)
  }


  const redeemSubmit = async () => {
    try {
      setTrue();
      if(stepStatus === 3) {
        await checkUserAddress()
        setshowSubmitDialog(false)
        if(formValue && accounts) {
          const txData = await sendMisTx(formValue, accounts[0])
          await setClaimReceiveAddress(txData.transactionHash)
        }
        resetData()
      }
    } catch (error: any) {
      setFalse();
      setshowSubmitDialog(false)
      if(error.message) {
        Toast.show(error.message)
      }
    }
  }


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
          <p className="text-16">Redeem</p>
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
      <div className='container w-[95%]  md:w-[450px] bg-white dark:bg-[#0d111c] animate__animated animate__zoomIn'>
        <div className='text-[16px] font-200 text-gray-500 leading-6 p-10 pre whitespace-pre-line'>
          {`1. The maximum redeemable quantity is based on the snapshot on Sept 7th.
2. The exchange rate between MIS and MB is 1:1.
3. Only one redemption is allowed, make sure to redeem all at once.
4. The minimum redemption quantity is ${accountData?.mb_airdrop?.min_redeem_mis_amount} MIS.`}
        <p className='mt-10 text-gray-300'>*The gas fee will be deducted from the exchanged MB, so the actual amount of tokens received would be less than the estimated amount.</p>
        </div>
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
          Congratulations！You've successfully redeemed your MB. It will be sent to your Mises wallet within 24 hours.
          </p>
          <div className='flex justify-center items-center mt-40'>
            <Button className='w-[40%]' onClick={closeConfirm} style={{ "--background-color": "#5d61ff", "--border-color": "#5d61ff", borderRadius: 12 }}>
              <span className='text-white'>Confirm</span>
            </Button>
          </div>
        </div>
      </Popup>

      <Popup
        position='bottom'
        showCloseButton
        bodyClassName="rounded-t-10"
        onMaskClick={() => {
          setshowSubmitDialog(false)
        }}
        visible={showSubmitDialog}
        onClose={() => {
          setshowSubmitDialog(false)
        }}>
        <div className='py-30 px-20'>
          <p className='text-16 leading-[24px] text-gray-500'>
            Please ensure all MIS for redemption are in your account, as you only have one chance to redeem.
          </p>
          <div className='flex justify-center items-center mt-40'>
            <Button className='w-[40%]' onClick={redeemSubmit} style={{ "--background-color": "#5d61ff", "--border-color": "#5d61ff", borderRadius: 12 }}>
              <span className='text-white'>Comfirm</span>
            </Button>
          </div>
        </div>
      </Popup>
      <DownloadPop setDownloadPop={setDownloadPop} downloadPop={downloadPop} />
    </div>
  )
}

export default MISToMB