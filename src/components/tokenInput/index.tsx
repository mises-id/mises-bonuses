import { shortenAddress } from '@/utils';
import { CoinInfo } from '@/utils/types';
import { Input } from 'antd-mobile'
import { InputProps } from 'antd-mobile/es/components/input'
import BigNumber from 'bignumber.js';
// import BigNumber from 'bignumber.js';
import React, { FC, useMemo } from 'react'
interface TokenInputProps extends InputProps {
  balance?: string;
  coinInfo?: CoinInfo;
  showMax?: boolean;
  account?: string;
  extra?: string | React.ReactElement
  symbol?: string,
  setMisMax?: () => void;
  toFixed?: number
}
const TokenInput:FC<TokenInputProps> = (props) => {
  const { balance, coinInfo, showMax, account, extra, symbol, toFixed ,setMisMax, ...rest } = props
  const setMAX = () => {
    if(balance && balance !== "0") {
      if(coinInfo?.symbol === "MIS") {
        setMisMax?.()
        // const max = BigNumber(balance).minus(0.003)
        // props.onChange?.(max.toString())
      }else {
        props.onChange?.(balance)
      }
    }
  }

  const showMaxButton = useMemo(() => {
    if(showMax && balance && balance !== "0") {
      return true;
    }
    return false;
  }, [showMax, balance])

  const balanceValue = useMemo(() => {
    console.log(balance)
    if(balance && Number(balance)> 0) {
      if(toFixed) {
        return BigNumber(balance).decimalPlaces(2, BigNumber.ROUND_DOWN).toString()
      } 
      return balance
    }
  }, [balance, toFixed])

  return (
    <div className='rounded-[12px] p-16 dark:bg-[#131a2a] bg-[#f5f6fc]'>
      <div className='flex gap-10 items-center pb-5'>
        <div className='flex-1'>
          <Input {...rest} placeholder='0' style={{'--font-size': '30px'}}/>
        </div>
        <div className='flex-none'>
          <div className='dark:bg-[#293249] bg-[#e8ecfb] flex gap-8 text-18 rounded-[24px] py-4 pl-8 pr-12 items-center justify-center'>
            <img src={coinInfo?.image} alt="" className='w-24 h-24'/>
            <span className='text-16 font-bold'>{coinInfo?.symbol}</span>
          </div>
        </div>
      </div>
      <div className='flex justify-between mb-6'>
        { account && <p className='flex-1 text-gray-500'>Address: {shortenAddress(account)}</p>}
        <div className='flex-1 text-right dark:text-[#98a1c0] text-[#7780a0]'>
          {balance!=='' && balance!==undefined ? <span>Balance: {balanceValue || '0'}{symbol || coinInfo?.symbol}</span> : null }
          {showMaxButton && <span className='text-[#5d61ff] ml-5 cursor-pointer' onClick={setMAX}>MAX</span>}
        </div>
      </div>
      {extra}
    </div>
  )
}

export default TokenInput