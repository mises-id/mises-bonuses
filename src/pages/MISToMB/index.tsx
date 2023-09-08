import React, { useCallback, useEffect, useMemo, useState } from 'react'
import './index.less'
import TokenInput from '@/components/tokenInput'
import { Button, Popup } from 'antd-mobile'
import { useWeb3React } from '@web3-react/core'
import { hooks, metaMask } from '@/components/Web3Provider/metamask'
import { ErrorCode, MBChainId, MBChainInfo, MBCoinInfo, MisInfo } from '@/utils'
import { useMisesWallet } from '@/hooks/useMisesWallet'
const { useChainId, useAccounts, useIsActivating, useIsActive } = hooks

function MISToMB() {
  const [showConfirmDialog, setshowConfirmDialog] = useState(false)

  const [formValue, setformValue] = useState<string | undefined>('')
  const [toValue, settoValue] = useState<string | undefined>('')

  const [formBalance, setformBalance] = useState<string | undefined>('')
  const [toBalance, settoBalance] = useState<string | undefined>('')


  const { connector } = useWeb3React();

  const { activate: misesProviderActivate, isActivating: misesWalletIsActivating, account: misesAccount } = useMisesWallet();
  const chainId = useChainId()
  const accounts = useAccounts()
  const isActivating = useIsActivating()

  const isActive = useIsActive()

  // const provider = useProvider()
  // const ENSNames = useENSNames(provider)

  const fetchBonusesBalance = () => {
    console.log("fetchBonusesBalance")
    setformBalance('123')
  }

  const fetchMBBalance = () => {
    console.log("fetchMBBalance")
    settoBalance('456 MB')
  }

  useEffect(() => {
    if(accounts && accounts.length) {
      fetchBonusesBalance()
      fetchMBBalance()
    }
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
      return 'Connect wallet for MIS';
    }

    // ethereum account connected
    if(stepStatus === 2) {
      return 'Connect wallet for MB';
    }
    return 'Redeem';

  }, [stepStatus])

  // button state text
  const ButtonText = useMemo(() => {
    if (isActivating) {
      return 'Connecting wallet...'
    }
    if(misesWalletIsActivating) {
      return 'Connecting Mises wallet...'
    }

    return stepStatusText
  }, [isActivating, stepStatusText, misesWalletIsActivating])

  // button status 
  const buttonDisabled = useMemo(() => {
    if (isActivating || misesWalletIsActivating) {
      return true;
    }
    return false;
  }, [isActivating, misesWalletIsActivating])

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
    if (accounts && accounts.length) {
      return Promise.resolve()
    }
    return Promise.reject({
      code: 9998,
      message: 'Invalid address'
    })
  }

  // const signMsg = async () => {

  // }

  const resetData = () => {
    setformValue('')
    settoValue('')
    setshowConfirmDialog(true)
  }

  const swap = async () => {
    try {
      if(toValue && formValue) {
        resetData()
      }else {

      }
    } catch (error) {

    }
  }

  const buttonClick = async () => {
    try {
      if(stepStatus === 1) {
        await misesProviderActivate()
        return;
      }

      if(stepStatus === 2) {
        await connectWallet();
        await checkChainId();
        await checkUserAddress();
        return;
      }

      if(stepStatus === 3) {
        await swap()
      }
      
    } catch (error: any) {
      if(error && error.code) {
        if(error.code === ErrorCode.notFoundMises) {
          // show not found error message tips
        }
      }
      console.log(error, 'error')
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
          onChange={(e) => {
            setformValue(e)
          }}
          showMax
          balance={formBalance}
        />
        <div className='h-35 w-35 rounded-[12px] mx-auto my-[-18px] border-4 border-solid relative z-10 border-[#fff] dark:border-[#0d111c] dark:bg-[#293249] bg-[#e8ecfb] flex items-center justify-center'>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#98A1C0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>
        </div>
        <TokenInput 
          coinInfo={MBCoinInfo}
          value={toValue}
          onChange={(e) => {
            settoValue(e)
          }}
          balance={toBalance}
        />
        <div className='mt-10'>
          <Button
            block
            disabled={buttonDisabled}
            style={{ "--background-color": "#5d61ff", "--border-color": "#5d61ff", 'padding': '12px', borderRadius: 12 }}
            onClick={buttonClick}
          >
            <span className='text-[white] text-18'>{ButtonText}</span>
          </Button>
        </div>
      </div>
      <div className='container w-[95%]  md:w-[450px] bg-white dark:bg-[#0d111c]'>
        <div className='flex flex-row items-center'>
          <div className='w-40 h-40 flex-none'>
            <svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="40" height="40"><path d="M640 224c19.2 0 38.4 9.6 51.2 25.6l118.4 156.8c19.2 25.6 16 57.6-3.2 80l-246.4 275.2c-22.4 25.6-64 28.8-89.6 6.4-3.2 0-3.2-3.2-3.2-3.2l-249.6-275.2c-19.2-22.4-22.4-57.6-3.2-83.2l118.4-156.8c12.8-16 32-25.6 51.2-25.6h256z m0 64h-256l-118.4 156.8 246.4 275.2 246.4-275.2L640 288z m-32 96c19.2 0 32 12.8 32 32s-12.8 32-32 32h-192c-19.2 0-32-12.8-32-32s12.8-32 32-32h192z" fill="#5D61FF" data-spm-anchor-id="a313x.search_index.0.i0.72cd3a81Rm0qVB"></path></svg>
          </div>
          <p className='flex-auto text-[16px] font-200 text-gray-500'>
            The existing exchange rate between bonus and MB stands at 1 to 1.
          </p>
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