import { fetchAdMiningData } from '@/api';
import { getToken } from '@/utils';
import { useRequest } from 'ahooks';
import { NavBar, List, Button } from 'antd-mobile'
import React, { useEffect } from 'react'

function Mining() {
  const token = getToken()

  const fetchAds = () => {
    
  }

  const { data: adMiningData, run } = useRequest(fetchAdMiningData, {
    retryCount: 3,
    manual: true,
  })

  useEffect(() => {
    if(token) {
      run()
    }
    // eslint-disable-next-line
  }, [token])
  
  
  return (
    <div>
      <NavBar className={`fixed left-0 right-0 top-0 z-10`} backArrow={false}>
        Mining
      </NavBar>
      <div className="pt-55 px-15">
        <div className='border-1 border-solid rounded-[10px] px-15 py-20 border-gray-100 text-14 mt-10 leading-7  text-gray-600 dark:text-white bg-white dark:bg-transparent'>
          Upon successfully finishing the assigned tasks, you will be rewarded with mises bonuses,
          which can later be converted into MB.
        </div>
        <div className='mt-50'>
          <div className='border-1 border-solid rounded-[10px] overflow-hidden border-gray-200 bg-white dark:bg-transparent'>
            <List
              header={<p className='py-8 dark:text-white'>Tasks</p>} style={{ '--font-size': '16px' }}>
              <List.Item
                extra={
                  <Button
                    color='primary'
                    size='small'
                    onClick={() => {
                      window.open('https://swap.mises.site', 'target=_blank');
                    }}>
                    <span className='text-12'>GO</span>
                  </Button>
                }>
                <span className='block text-gray-600 dark:text-white py-10' >
                  Swap with Mises
                </span>
              </List.Item>
              <List.Item extra={
                <Button
                  color='primary'
                  size='small'
                  onClick={fetchAds}>
                  <span className='text-12'>GO</span>
                </Button>
              } description={`${adMiningData?.today_bonus_count || 0}/${adMiningData?.limit_per_day || 10} watched today`}>
                <span className='mb-10 block dark:text-white text-gray-600'>
                  Watch rewarded video ads
                </span>
              </List.Item>
            </List>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Mining