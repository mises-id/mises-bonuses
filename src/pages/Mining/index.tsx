import { NavBar, List } from 'antd-mobile'
import React from 'react'

function Mining() {
  return (
    <div>
      <NavBar className={`fixed left-0 right-0 top-0 z-10`} backArrow={false}>
        Mining
      </NavBar>
      <div className="pt-55 px-20">
        <div className='border-[1px] border-solid rounded-[5px] p-10'>
          Upon successfully finishing the assigned tasks, you will be rewarded with mises bonuses,
          which can later be converted into MB.
        </div>
        <div className='mt-10'>
          <List header="Tasks">
            <List.Item extra='GO' onClick={() => {
              window.open('https://swap.mises.site', 'target=_blank');
            }}>
              Swap with Mises
            </List.Item>
            <List.Item extra='GO' description='0/10 watched today'>
              13213
            </List.Item>
          </List>
        </div>
      </div>
    </div>
  )
}

export default Mining