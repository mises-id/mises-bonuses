/*
 * @Author: lmk
 * @Date: 2022-05-26 12:28:24
 * @LastEditTime: 2022-06-06 21:44:23
 * @LastEditors: lmk
 * @Description: 
 */
import React from 'react'
import { Navigate, useRoutes } from 'react-router-dom'
import { Bonuses, MISToMB, Mining, NotFund } from '@/pages'
import Loading from '@/components/pageLoading'
// import { withCache } from './withCache'
type CutonFallBackT =
  | boolean
  | React.ReactChild
  | React.ReactFragment
  | React.ReactPortal
  | null
type ChildT = React.FC

// 加载异步组件的loading
const SuspenseWrapper = (Child: ChildT, cutonFallBack?: CutonFallBackT):any => {
  return (
    <React.Suspense fallback={cutonFallBack || <Loading />}>
      <Child />
    </React.Suspense>
  )
}
// 首页产品列表
// const IndexCacheList = withCache(SeedlingList)
const Routes = () => {
  const RouterList =  useRoutes([
    {
      path: '/mining',
      element: SuspenseWrapper(Mining)
    },
    {
      path: '/bonuses',
      element: SuspenseWrapper(Bonuses)
    },
    {
      path: '/mistomb',
      element: SuspenseWrapper(MISToMB)
    },
    {
      path: '/404',
      element: SuspenseWrapper(NotFund)
    },
    { path: '/', element: <Navigate to="/mining" replace /> },
    { path: '*', element: <Navigate to="/404" replace /> }
  ])
  return RouterList
}
export default Routes