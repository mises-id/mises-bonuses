import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './index.less'
import TokenInput from '@/components/tokenInput'
import { Button, Popup, Toast } from 'antd-mobile'
import { useWeb3React } from '@web3-react/core'
import { hooks, metaMask } from '@/components/Web3Provider/metamask'
import { BonusesInfo, ErrorCode, MBChainId, MBChainInfo, MBCoinInfo, getErc20Balance, getToken, removeToken, setToken, shortenAddress } from '@/utils'
import { fetchBonusCount, redeemBonusCount, signin } from '@/api'
import { useBoolean, useDocumentVisibility, useRequest } from 'ahooks'
import { usePageValue } from '@/components/pageProvider'
import BigNumber from 'bignumber.js'
const { useChainId, useAccounts, useIsActivating, useProvider } = hooks

function Bonuses() {
  const [showConfirmDialog, setshowConfirmDialog] = useState(false)

  const [login, {setTrue: setLoginTrue, setFalse: setLoginFalse}] = useBoolean(false)

  const [loading, {setTrue, setFalse}] = useBoolean(false)

  const [errorTxt, seterrorTxt] = useState('')

  const [formValue, setformValue] = useState<string | undefined>('')
  const [toValue, settoValue] = useState<string | undefined>('')

  const accountRef = useRef<string>('')

  // const [formBalance, setformBalance] = useState<string | undefined>('')
  const [toBalance, settoBalance] = useState<string | undefined>('')

  const { connector } = useWeb3React();

  const chainId = useChainId()
  const accounts = useAccounts()
  const isActivating = useIsActivating()


  const provider = useProvider()

  const currentAccount = useMemo(() => {
    if(accounts?.length) {
      accountRef.current = accounts[0]
      return accounts[0]
    }
    return ''
  }, [accounts])

  useEffect(() => {
    const token = getToken()
    if(token) {
      setLoginTrue()
      run()
    }
    // eslint-disable-next-line
  }, [])

  const documentVisibility = useDocumentVisibility();

  useEffect(() => {
    console.log(`Current document visibility state: ${documentVisibility}`);
    if(documentVisibility === 'visible') {
      const oldConnectAddress = localStorage.getItem('ethAccount')

      if(currentAccount && oldConnectAddress !== currentAccount) {
        setformValue('')
        settoValue('')
        setLoginFalse()
        removeToken('token')
        signMsg().then(auth => {
          signin(auth).then(res=> {
            setToken('token', res.token);
            localStorage.setItem('ethAccount', currentAccount)
            refresh()
            setLoginTrue()
          }).catch(() => {
          })
        })
      }
    }
    if(!currentAccount) {
      setformValue('')
      settoValue('')
      removeToken('token')
      settoBalance('')
      refresh()
      localStorage.removeItem('ethAccount')
      setLoginFalse()
    }

    console.log(currentAccount, "currentAccount")
    // eslint-disable-next-line
  }, [documentVisibility, currentAccount]);


  
  
  const { data: formBalance, run, refresh } = useRequest(async () => {
    const token = getToken()
    if(!token) return '';
    try {
      const data = await fetchBonusCount();
      return `${data.bonus}`
    } catch (error: any) {
      if(error.response && error.response.status === 403 && error.response.data.code === 403002) {
        localStorage.removeItem('token');
        setLoginFalse()
      }
      return ''
    }
  }, {
    retryCount: 3,
    refreshDeps: [currentAccount],
    manual: true
  })

  const fetchMBBalance = () => {
    console.log("fetchMBBalance")
    getErc20Balance(currentAccount).then(res => {
      if(res?.formatted) {
        const balance = BigNumber(res?.formatted).decimalPlaces(6, BigNumber.ROUND_DOWN).toString()
        settoBalance(balance)
      }
    })
  }

  useEffect(() => {
    if(currentAccount) {
      fetchMBBalance()
    }
    // eslint-disable-next-line
  }, [currentAccount])
  

  // button state text
  const ButtonText = useMemo(() => {
    if (isActivating) {
      return 'Connecting wallet...'
    }
    console.log(login)
    if (!login) {
      return 'Connect Wallet'
    }

    if((!formValue && !toValue) || (formValue && BigNumber(formValue).isZero())) {
      return 'Enter an amount'
    }

    if(errorTxt) {
      return errorTxt
    }

    return 'Redeem'
  }, [isActivating, errorTxt, formValue, toValue, login])

  // button status 
  const buttonDisabled = useMemo(() => {
    if(!login) return false;
    if (isActivating) {
      return true;
    }

    if(errorTxt) {
      return true
    }

    if((!formValue && !toValue) || (formValue && BigNumber(formValue).isZero())) {
      return true
    }
    return false;
  }, [isActivating, errorTxt, formValue, toValue, login])

  const connectWallet = async () => {
    try {
      if (!isActivating) {
        await connector.activate()
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

  const sleep = (milliseconds: number) => {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  };

  const signMsg = async () => {
    try {
      await sleep(1000);
      const timestamp = new Date().getTime();
      if (accountRef.current) {
        const address = accountRef.current
        const nonce = `${timestamp}`;
        const sigMsg = `address=${address}&nonce=${timestamp}`
        console.log(provider, "provider")
        const data = await window.misesEthereum?.signMessageForAuth(address, nonce)
        if (data?.sig) {
          const auth = `${sigMsg}&sig=${data?.sig}`
          return auth
        }
        return Promise.reject({
          code: 9998,
          message: 'Not found personal sign message'
        })
      }
      return Promise.reject({
        code: 9998,
        message: 'Invalid address'
      })
    } catch (error) {
      return Promise.reject(error)
    }
  }
  

  const resetData = () => {
    setformValue('')
    settoValue('')
    setshowConfirmDialog(true)
    refresh()
    fetchMBBalance()
    setFalse()
  }

  const swap = async () => {
    try {
      if(toValue && formValue) {
        setTrue()
        await redeemBonusCount(Number(formValue))
        resetData()
      }else {

      }
    } catch (error) {
      return Promise.reject(error)
    }
  }

  const checkSign = async () => {
    try {
      const token = localStorage.getItem('token')
      const oldConnectAddress = localStorage.getItem('ethAccount')
      if(!token || currentAccount !== oldConnectAddress) {
        const auth = await signMsg()
        const res = await signin(auth)
        setToken('token', res.token);
        localStorage.setItem('ethAccount', currentAccount)
        refresh()
        setLoginTrue()
      }
    } catch (error) {
      setLoginFalse()
      return Promise.reject(error)
    }
  }

  const buttonClick = async () => {
    try {
      await connectWallet();
      await checkSign()
      await checkChainId();
      await swap()
    } catch (error: any) {
      setFalse()
      Toast.show(error.message)
    }
  }

  // attempt to connect eagerly on mount
  useEffect(() => {
    metaMask.connectEagerly().catch(() => {
      console.debug('Failed to connect eagerly to metamask')
    })
  }, [])

  const closeConfirm = () => {
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

    const compared = BigNumber(formBalance || '0').comparedTo(value)

    if(compared === -1) {
      seterrorTxt('Insufficient balance')
      return 
    }
    if(accountData?.bonus?.min_redeem_bonus_amount && value) {
      const redeemCompared = BigNumber(value).comparedTo(accountData?.bonus.min_redeem_bonus_amount)
      if(redeemCompared === -1) {
        seterrorTxt('Insufficient Reward Points')
        return 
      }
    }
    seterrorTxt('')
    if(accountData?.bonus?.bonus_to_mb_rate && value) {
      settoValue(BigNumber(value).multipliedBy(accountData?.bonus.bonus_to_mb_rate).toString())
      return
    }else {
      settoValue(value)
    }
  }

  return (
    <div>
      <div className='flex justify-between'>
        <p className='p-20 text-16 m-0'>Redeem <span className='font-bold text-[#5d61ff]'>Rewards</span> for <span className='font-bold text-[#5d61ff]'>MB</span></p>
        {currentAccount && <div className='flex items-center mr-15'>
          <div className='rounded-2xl p-10 bg-white dark:bg-[#131a2a]'>
            {shortenAddress(currentAccount)}
          </div>
        </div>}
      </div>
      <div className='container bg-white dark:bg-[#0d111c] w-[95%] md:w-[450px]'>
        <div className="flex items-center px-8 py-12 mb-8 text-18">
          <p className="title">Redeem</p>
          <p className="title ml-10 text-gray-400" onClick={() => {window.open('https://mining.test.mises.site/mining', 'target=_blank')}}>Mining</p>
        </div>
        <TokenInput
          coinInfo={BonusesInfo}
          value={formValue}
          toFixed={2}
          onChange={formValueChange}
          showMax
          symbol=" "
          balance={formBalance}
        />
        <div className='h-35 w-35 rounded-[12px] mx-auto my-[-18px] border-4 border-solid relative z-10 border-[#fff] dark:border-[#0d111c] dark:bg-[#293249] bg-[#e8ecfb] flex items-center justify-center'>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#98A1C0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>
        </div>
        <TokenInput 
          coinInfo={MBCoinInfo}
          value={toValue}
          readOnly
          balance={toBalance}
        />
        <div className='mt-10'>
          <Button
            block
            loading={loading}
            disabled={buttonDisabled}
            loadingText="Redeeming"
            style={{ "--background-color": "#5d61ff", "--border-color": "#5d61ff", 'padding': '12px', borderRadius: 12, "--text-color": 'white' }}
            onClick={buttonClick}
          >
            <span className='text-[white] text-18'>{ButtonText}</span>
          </Button>
        </div>
      </div>
      <div className='container w-[95%]  md:w-[450px] bg-white dark:bg-[#0d111c]'>
        <div className='flex flex-row '>
          {/* <div className='w-60 h-60 flex-none mt-5'>
            <svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="60" height="60"><path d="M640 224c19.2 0 38.4 9.6 51.2 25.6l118.4 156.8c19.2 25.6 16 57.6-3.2 80l-246.4 275.2c-22.4 25.6-64 28.8-89.6 6.4-3.2 0-3.2-3.2-3.2-3.2l-249.6-275.2c-19.2-22.4-22.4-57.6-3.2-83.2l118.4-156.8c12.8-16 32-25.6 51.2-25.6h256z m0 64h-256l-118.4 156.8 246.4 275.2 246.4-275.2L640 288z m-32 96c19.2 0 32 12.8 32 32s-12.8 32-32 32h-192c-19.2 0-32-12.8-32-32s12.8-32 32-32h192z" fill="#5D61FF" data-spm-anchor-id="a313x.search_index.0.i0.72cd3a81Rm0qVB"></path></svg>
          </div> */}
          <div className='text-[16px] font-200 text-gray-500 leading-6 p-10 pre whitespace-pre-line'>
            {`1. The exchange rate between Reward Points and MB is 1:${accountData?.bonus.bonus_to_mb_rate}
2. Minimum redemption of ${accountData?.bonus?.min_redeem_bonus_amount } Reward Points.`}
            <p className='mt-10 text-gray-300'>*The gas fee will be deducted from the exchanged MB, so the actual amount of tokens received would be less than the estimated amount.</p>
          </div>
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
    </div>
  )
}

export default Bonuses