import { CoinInfo } from '@/utils/types';
import { Input } from 'antd-mobile'
import { InputProps } from 'antd-mobile/es/components/input'
import React, { FC, useMemo } from 'react'
interface TokenInputProps extends InputProps {
  balance?: string;
  coinInfo?: CoinInfo;
  showMax?: boolean;
}
const TokenInput:FC<TokenInputProps> = (props) => {
  const { balance, coinInfo, showMax, ...rest } = props
  const setMAX = () => {
    if(balance && balance !== "0") {
      props.onChange?.(balance)
    }
  }

  const showMaxButton = useMemo(() => {
    if(showMax && balance && balance !== "0") {
      return true;
    }
    return false;
  }, [showMax, balance])

  return (
    <div className='rounded-[12px] p-16 dark:bg-[#131a2a] bg-[#f5f6fc]'>
      <div className='flex gap-10 items-center pb-5'>
        <div className='flex-1'>
          <Input {...rest} style={{'--font-size': '30px'}}/>
        </div>
        <div className='flex-none'>
          <div className='dark:bg-[#293249] bg-[#e8ecfb] flex gap-8 text-18 rounded-[24px] py-4 pl-8 pr-12 items-center justify-center'>
            <img src={coinInfo?.image} alt="" className='w-24 h-24'/>
            <span className='text-16 font-bold'>{coinInfo?.symbol}</span>
          </div>
        </div>
      </div>
      {balance && <div className='text-right mb-10 dark:text-[#98a1c0] text-[#7780a0] font-bold'>
        Balance: {balance}
        {showMaxButton && <span className='text-[#5d61ff] ml-5' onClick={setMAX}>MAX</span>}
      </div>}
    </div>
  )
}

export default TokenInput