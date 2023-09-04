import { Input } from 'antd-mobile'
import { InputProps } from 'antd-mobile/es/components/input'
import React, { FC } from 'react'
interface TokenInputProps extends InputProps {

}
const TokenInput:FC<TokenInputProps> = (props) => {
  const { ...rest } = props
  return (
    <div className='rounded-[12px] p-16 dark:bg-[#131a2a] bg-[#f5f6fc]'>
      <div className='flex gap-10 items-center pb-5'>
        <div className='flex-1'>
          <Input {...rest} style={{'--font-size': '30px'}}/>
        </div>
        <div className='flex-none'>
          <div className='dark:bg-[#293249] bg-[#e8ecfb] flex gap-8 text-20 rounded-[24px] py-4 pl-4 pr-12 items-center justify-center'>
            <img src="https://cdn.mises.site/s3://mises-storage/upload/swap/token/1/0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE.png?sign=f-CnMLx0o2F_9FA8Vl0RuF4dBYQcnl_VhFjOsO0oj8Q&version=2.0" alt="" className='w-24 h-24'/>
            <span>ETH</span>
          </div>
        </div>
      </div>
      <p className='text-right mb-10 dark:text-[#98a1c0] text-[#7780a0] font-bold'>Balance: 123.222 ETH</p>
    </div>
  )
}

export default TokenInput