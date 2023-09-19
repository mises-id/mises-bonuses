import { fetchAdMiningData, signin } from '@/api';
import { usePageValue } from '@/components/pageProvider';
import { getToken, removeToken, setToken, shortenAddress } from '@/utils';
import { useBoolean, useRequest } from 'ahooks';
import { NavBar, List, Button, Popup, Toast } from 'antd-mobile'
import React, { useEffect, useMemo, useState } from 'react'

import { hooks } from '@/components/Web3Provider/metamask'
import { useWeb3React } from '@web3-react/core';
import Cookies from 'js-cookie';

const { useAccounts, useProvider, useIsActive } = hooks

function Mining() {
  const [showDialog, setshowDialog] = useState(false)
  const accounts = useAccounts()
  // const isActivating = useIsActivating()
  const { connector } = useWeb3React();

  const isActive = useIsActive()

  const provider = useProvider()
  const [adsLoading, { setTrue: setAdsLoadingTrue, setFalse: setAdsLoadingFalse }] = useBoolean(false)
  const currentAccount = useMemo(() => {
    if (accounts?.length) {
      return accounts[0]
    }
    const ethAccount = localStorage.getItem('ethAccount');
    const token = getToken()
    if(ethAccount && token) {
      return ethAccount
    }
    return ''
  }, [accounts])


  const signMsg = async () => {
    try {
      const timestamp = new Date().getTime();
      if (accounts && accounts.length) {
        const address = accounts[0]
        const sigMsg = `address=${address}&nonce=${timestamp}`
        const personalSignMsg = await provider?.send('personal_sign', [address, sigMsg])
        if (personalSignMsg) {
          const auth = `${sigMsg}&sig=${personalSignMsg}`
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

  const loginMises = () => {
    const oldConnectAddress = localStorage.getItem('ethAccount')
    const token = getToken()
    if ((oldConnectAddress !== currentAccount || !token) && provider) {
      removeToken('token')
      signMsg().then(auth => {
        signin(auth).then(res => {
          setToken('token', res.token)
          Cookies.set('token', res.token, { domain: 'mises.site' });
          localStorage.setItem('ethAccount', currentAccount)
          refresh()
          setshowDialog(false)
        })
      })
    }
  }
  useEffect(() => {
    loginMises()
    // eslint-disable-next-line
  }, [currentAccount, provider])


  const connectWallet = async () => {
    await connector.activate()
    loginMises()
  }

  const adsCallback = () => {
    setAdsLoadingFalse()
    refresh()
  }

  const fetchAds = async () => {
    const token = getToken()
    if (!token) {
      setshowDialog(true)
      return
    }
   try {
    setAdsLoadingTrue()
    await window.misesEthereum?.showAds?.()
    adsCallback()
   } catch (error: any) {
    if(error.code === 1) {
      Toast.show(error.message)
    }
    setAdsLoadingFalse()
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
      localStorage.removeItem('token');
      Cookies.remove('token');
    }
    // eslint-disable-next-line
  }, [error])

  const buttonText = useMemo(() => {
    if(!isActive || !accounts) {
      return 'Connect wallet'
    }
    const token = getToken();
    if(accounts && !token) {
      return 'Sign Message'
    }
    //
  }, [accounts, isActive])


  const RenderView = () => {
    const token = getToken();
    if(token) {
      return <div className="pt-55 px-15">
        {currentAccount && <div className='flex justify-end'>
          <div className='rounded-2xl p-10 bg-white dark:bg-[#EEEFFF]'>
            {shortenAddress(currentAccount)}
          </div>
        </div>}
        <div className='border-1 border-solid rounded-[10px] px-15 py-20 border-gray-200 dark:border-gray-600 text-14 mt-10 leading-7  text-gray-600 dark:text-gray-300 bg-white dark:bg-transparent'>
          Upon successfully finishing the assigned tasks, you will be rewarded with mises reward points,
          which can later be converted into MB.
        </div>
        <div className='mt-50'>
          <div className='border-1 border-solid rounded-[10px] overflow-hidden border-gray-200 dark:border-gray-600 bg-white dark:bg-transparent'>
            <List
              header={<p className='py-8 dark:text-gray-300'>Tasks</p>} style={{ '--font-size': '16px' }}>
              <List.Item
                extra={
                  <Button
                    color='primary'
                    size='small'
                    onClick={() => {
                      window.open('https://swap.test.mises.site', 'target=_blank');
                    }}>
                    <span className='text-12'>GO</span>
                  </Button>
                }>
                <span className='block text-gray-600 dark:text-gray-300 py-10' >
                  Swap with Mises
                </span>
              </List.Item>
              <List.Item extra={
                <Button
                  color='primary'
                  size='small'
                  loading={adsLoading}
                  onClick={fetchAds}>
                  <span className='text-12'>GO</span>
                </Button>
              } description={`${adMiningData?.today_bonus_count || 0}/${adMiningData?.limit_per_day || accountData?.ad_mining.limit_per_day || 10} watched today`}>
                <span className='mb-10 block dark:text-gray-300 text-gray-600'>
                  Watch rewarded video ads
                </span>
              </List.Item>
            </List>
          </div>
        </div>
      </div>
    }
    return <div className="pt-45">
      <img src="./images/me-bg.png" alt="bg" width="100%" className="block"/>
      <div className='bg-white px-15 pb-30'>
        <p className='text-25 text-[#333333]'>About Mining</p>
        <p className='text-14 leading-6 text-[#333333] py-20 mb-20'>Mises ID is a decentralized personal account.You need your own Mises ID to use Mises Mining.</p>
        <Button block shape='rounded' onClick={connectWallet} style={{ "--background-color": "#5d61ff", "--border-color": "#5d61ff", borderRadius: 12 }}>
          <span className='text-white block py-8 text-18'>{buttonText}</span>
        </Button>
      </div>
    </div>
  }

  return (
    <div>
      <NavBar className="fixed left-0 right-0 top-0 z-10 bg-white" backArrow={false}>
        Mining
      </NavBar>
      <RenderView />
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
            <Button className='w-[150px]' onClick={connectWallet} style={{ "--background-color": "#5d61ff", "--border-color": "#5d61ff", borderRadius: 12 }}>
              <span className='text-white'>{buttonText}</span>
            </Button>
          </div>
        </div>
      </Popup>
    </div>
  )
}

export default Mining