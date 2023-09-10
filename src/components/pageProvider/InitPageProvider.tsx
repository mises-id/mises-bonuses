import React, { PropsWithChildren } from 'react'
import { PageValueProvider } from '.'
import { useRequest } from 'ahooks'
import { fetchAccountData } from '@/api'

const InitPageProvider = ({ children }: PropsWithChildren<{}>) => {
  const { data: accountData } = useRequest(fetchAccountData, {
    retryCount: 3
  })
  return (
    <PageValueProvider value={{
      accountData
    }}>{children}</PageValueProvider>
  )
}

export default InitPageProvider