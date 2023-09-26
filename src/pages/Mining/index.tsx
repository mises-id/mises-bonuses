import { fetchAdMiningData, reportAds, signin } from '@/api';
import { usePageValue } from '@/components/pageProvider';
import { getToken, removeToken, setToken, shortenAddress } from '@/utils';
import { useBoolean, useDebounceFn, useDocumentVisibility, useRequest } from 'ahooks';
import { Button, CenterPopup, Image, Popup, Toast } from 'antd-mobile'
import React, { useEffect, useMemo, useState } from 'react'

import { hooks, metaMask } from '@/components/Web3Provider/metamask'
import { useWeb3React } from '@web3-react/core';
import './index.less';

const { useAccounts, useIsActivating } = hooks

function Mining() {
  const [showDialog, setshowDialog] = useState(false)
  const accounts = useAccounts()
  const isActivating = useIsActivating()
  const { connector } = useWeb3React();


  // const provider = useProvider()
  const [adsLoading, { setTrue: setAdsLoadingTrue, setFalse: setAdsLoadingFalse }] = useBoolean(false)
  const [showCenterPop, setshowCenterPop] = useState(false)
  const [continuePop, setcontinuePop] = useState(false)
  const currentAccount = useMemo(() => {
    if (accounts?.length) {
      return accounts[0]
    }
    const connectAddress = localStorage.getItem('ethAccount')
    return connectAddress || ''
  }, [accounts])


  // const [signLoading, { setTrue: setsignLoadingTrue, setFalse: setsignLoadingFalse }] = useBoolean(true)

  const signMsg = async () => {
    try {
      const timestamp = new Date().getTime();
      console.log(accounts, 'accounts')
      if (accounts && accounts.length) {
        const address = accounts[0]
        const nonce = `${timestamp}`;
        const sigMsg = `address=${address}&nonce=${timestamp}`
        // setsignLoadingTrue()
        // const personalSignMsg = await provider?.send('personal_sign', [address, sigMsg])
        const data = await window.misesEthereum?.signMessageForAuth(address, nonce)
        if (data?.sig) {
          const auth = `${sigMsg}&sig=${data?.sig}`
          // setsignLoadingFalse()
          return auth
        }
        // setsignLoadingFalse()
        return Promise.reject({
          code: 9998,
          message: 'Not found personal sign message'
        })
      }
      // setsignLoadingFalse()
      return Promise.reject({
        code: 9998,
        message: 'Invalid address'
      })
    } catch (error) {
      // setsignLoadingFalse()
      return Promise.reject(error)
    }
  }

  const loginMises = () => {
    const oldConnectAddress = localStorage.getItem('ethAccount')
    if (accounts && accounts.length && oldConnectAddress !== accounts[0]) {
      removeToken('token')
      localStorage.removeItem('ethAccount')
      signMsg().then(auth => {
        signin(auth).then(res => {
          setToken('token', res.token)
          localStorage.setItem('ethAccount', accounts[0])
          refresh()
          setshowDialog(false)
        })
      }).catch(error => {
        console.log(error, 'error')
        Toast.show(error.message)
      })
    }
  }

  // attempt to connect eagerly on mount
  useEffect(() => {
    metaMask.connectEagerly().catch(() => {
      console.debug('Failed to connect eagerly to metamask')
    })
  }, [])

  const documentVisibility = useDocumentVisibility();

  useEffect(() => {
    // if(!currentAccount) {
    //   localStorage.removeItem('ethAccount')
    //   removeToken()
    //   console.log(accounts, 'accounts')
    // }
    console.log(`Current document visibility state: ${documentVisibility}`);
    if (documentVisibility === 'visible') {
      loginMises()
    }
    console.log(accounts)
    // eslint-disable-next-line
  }, [documentVisibility, accounts]);


  const connectWallet = async () => {
    try {
      await connector.activate()
      loginMises()
    } catch (error: any) {
      console.log(error)
      if(error && error.code !== 1) {
        Toast.show(error.message)
      }
    }
  }

  const adsCallback = () => {
    setAdsLoadingFalse()
    refresh()
    cancelCenterLoadingPop()
    setshowCenterPop(false)
    setcontinuePop(true)
    reportAds({
      ad_type: 'admob'
    })
  }

  const { run: showCenterLoadingPop, cancel: cancelCenterLoadingPop } = useDebounceFn(
    () => {
      setshowCenterPop(true)
    },
    {
      wait: 2000,
    },
  );

  // const showAds = () => {
  //   return new Promise<void>((resolve) => {
  //     setTimeout(() => {
  //       resolve()
  //     }, 5000);
  //   })
  // }

  const fetchAds = async () => {
    const token = getToken()
    if (!token) {
      setshowDialog(true)
      return
    }
    try {
      setAdsLoadingTrue()
      showCenterLoadingPop()
      // await showAds()
      await window.misesEthereum?.showAds?.()
      adsCallback()
    } catch (error: any) {
      if (error.code !== 0) {
        Toast.show(error.message)
      }
      setAdsLoadingFalse()
      cancelCenterLoadingPop()
      setshowCenterPop(false)
    }
  }

  const { accountData } = usePageValue()

  const { data: adMiningData, run, refresh, error } = useRequest(fetchAdMiningData, {
    retryCount: 3,
    manual: true,
  })

  useEffect(() => {
    const token = getToken()
    if (token) {
      run()
    }
    // eslint-disable-next-line
  }, [])

  useEffect(() => {
    const errorResponse = (error as any)?.response
    if (error && errorResponse && errorResponse.status === 403 && errorResponse.data.code === 403002) {
      localStorage.removeItem('ethAccount');
      removeToken('token')

    }
    // eslint-disable-next-line
  }, [error])

  const buttonText = useMemo(() => {
    if (isActivating) {
      return 'Connect Wallet...'
    }

    return 'Connect Mises ID'
    //
  }, [isActivating])


  const RenderView = () => {
    const token = getToken();
    if (token) {
      // 
      return <>
        <div className='px-15'>
          <p className='pt-30 leading-10 text-26 bg-gradient-to-b from-[red] to-[#5d61ff] text-transparent bg-clip-text'>
            Mises Mining
          </p>
          {currentAccount && <p className='mt-20 text-20 font-bold'>{shortenAddress(currentAccount)}</p>}
          <div className='mt-20'>
            <p className='text-20 leading-8 text-[#5d61ff] font-bold tracking-wider bg-gradient-to-b from-[#CE9FFC] to-[#5d61ff] text-transparent bg-clip-text'>
              Upon successfully finishing the assigned tasks, you will be rewarded with mises reward points,
              which can later be converted into MB.
            </p>
          </div>
        </div>
        <div className='px-15'>
          <div className='bg-white flex justify-between rounded-lg py-10 px-15 mt-55'>
            <span className='text-gray-600 py-15 text-16' >
              Swap with Mises
            </span>
            <div className='flex items-center'>
              <Button
                color='primary'
                size='mini'
                fill='outline'
                shape='rounded'
                onClick={() => {
                  window.open('https://swap.test.mises.site', 'target=_blank');
                }}>
                <span className='text-12 px-10'>GO</span>
              </Button>
            </div>
          </div>
          <div className='bg-white flex justify-between rounded-lg px-15 py-14 mt-20'>
            <div>
              <span className='mb-10 block text-gray-600 text-16'>
                Watch rewarded video ads
              </span>
              <p className='mt-5 text-gray-500'>
                {`${adMiningData?.today_bonus_count || 0}/${adMiningData?.limit_per_day || accountData?.ad_mining.limit_per_day || 10} watched today`}
              </p>
            </div>
            <div className='flex items-center'>
              <Button
                color='primary'
                size='mini'
                fill='outline'
                shape='rounded'
                loading={adsLoading}
                onClick={fetchAds}>
                <span className='text-12 px-10'>GO</span>
              </Button>
            </div>
          </div>
        </div>
        <a href="https://mining.test.mises.site/bonuses" target='_blank' rel="noreferrer"
          className='text-16 fixed bottom-20 left-1/2 -translate-x-1/2' style={{ textDecoration: 'none' }}>
          Link to redeem
        </a>
      </>
    }
    return null;
  };

  const token = getToken();

  return (
    <div className={`h-screen bg-white ${token ? 'bg-gradient-to-b' : ''}  from-[#ebe0f0] to-[#d0defb] flex flex-col`}>
      <RenderView />
      {!token && <>
        <p className='p-20 text-16 m-0 font-bold text-[#5d61ff] fixed inset-x-0 top-0'>Mises Mining</p>
        <div style={{ minHeight: 160 }}>
          <img src="./images/me-bg.png" alt="bg" width="100%" className="block" />
        </div>
        <div className='bg-white px-15 pb-30'>
          <p className='text-25 text-[#333333]'>About Mining</p>
          <p className='text-14 leading-6 text-[#333333] py-20 mb-20'>Mises ID is a decentralized personal account.You need your own Mises ID to use Mises Mining.</p>
          <Button block shape='rounded' onClick={connectWallet} style={{ "--background-color": "#5d61ff", "--border-color": "#5d61ff", 'padding': '12px 0' }}>
            <span className='text-white block text-18'>{buttonText}</span>
          </Button>
        </div>
      </>}
      <Popup
        position='bottom'
        showCloseButton
        bodyClassName="rounded-t-10"
        onMaskClick={() => {
          setshowDialog(false)
        }}
        visible={showDialog}
        onClose={() => {
          setshowDialog(false)
        }}>
        <div className='py-30 px-20'>
          <p className='text-16 leading-[24px] text-gray-500'>
            Mises ID is a decentralized personal account.You need your own Mises ID to use Mises Mining.
          </p>
          <div className='flex justify-center items-center mt-40'>
            <Button className='w-[200px]' onClick={connectWallet} style={{ "--background-color": "#5d61ff", "--border-color": "#5d61ff", borderRadius: 12 }}>
              <span className='text-white'>{buttonText}</span>
            </Button>
          </div>
        </div>
      </Popup>
      <CenterPopup
        style={{ '--min-width': '90vw' }}
        visible={showCenterPop}>
        <div className='py-30 px-10'>
          <div className='loading-icon'>
            <svg width="94" height="94" viewBox="0 0 94 94" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M92 47C92 22.1472 71.8528 2 47 2C22.1472 2 2 22.1472 2 47C2 71.8528 22.1472 92 47 92" stroke="#2172E5" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className='text-20 text-gray-800 text-center mt-40'>
            Please wait for request ads
          </p>
        </div>
      </CenterPopup>
      <CenterPopup
        showCloseButton
        onClose={() => setcontinuePop(false)}
        style={{ '--min-width': '90vw' }}
        visible={continuePop}>
        <div className='py-30 px-10'>
          <div className='flex justify-center'>
            <Image width={80} src='./images/successful.png' fallback="" />
          </div>
          <p className='text-16 text-gray-600 text-center mt-20 leading-6'>
            {adMiningData?.today_bonus_count !== adMiningData?.limit_per_day ? 'Watch another for more rewards points.' : 'View limit reached; further viewing won\'t earn points.'}
          </p>
          <div className='flex justify-center mt-20 gap-10'>
            <Button color='primary' shape='rounded' fill='outline' className='w-[100px]' onClick={()=>setcontinuePop(false)}>Cancel</Button>
            <Button color='primary' shape='rounded' className='w-[100px]' onClick={fetchAds} loading={adsLoading}>Continue</Button>
          </div>
        </div>
      </CenterPopup>
    </div>
  )
}

export default Mining