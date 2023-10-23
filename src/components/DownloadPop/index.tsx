import { Button, CenterPopup, CenterPopupProps, Image } from 'antd-mobile'
import React, { FC } from 'react'
import { isAndroid } from 'react-device-detect';

interface IProps extends CenterPopupProps {
  setDownloadPop: (status: boolean) => void;
  downloadPop: boolean

}
const DownloadPop:FC<IProps> = ({
  setDownloadPop,
  downloadPop
})=> {
  if (isAndroid) {
    return (
      <CenterPopup
        showCloseButton
        onClose={() => setDownloadPop(false)}
        style={{ '--min-width': '90vw' }}
        visible={downloadPop}>
        <div className='py-30 px-10'>
          <div className='flex justify-center'>
            <div className='relative'>
              <Image width={120} src='./images/download.svg' fallback="" />
              <Image width={30} src='./logo.png' fallback="" className='absolute top-53 left-25 rounded-full'/>
            </div>
          </div>
          <p className='text-16 text-gray-600 text-center mt-20 leading-8'>
            Please upgrade to the latest version of Mises Browser Android.
          </p>
          <div className='flex justify-center mt-20 gap-10'>
            <Button color='primary' shape='rounded' fill='outline' className='flex-1' onClick={()=>setDownloadPop(false)}>Cancel</Button>
            <Button color='primary' shape='rounded' className='flex-1' onClick={() => {
              setDownloadPop(false)
              window.open('https://play.google.com/store/apps/details?id=site.mises.browser', 'target=_blank')
            }}>Upgrade</Button>
          </div>
        </div>
      </CenterPopup>
    )
  } else {
    return (
      <CenterPopup
        showCloseButton
        onClose={() => setDownloadPop(false)}
        style={{ '--min-width': '90vw' }}
        visible={downloadPop}>
        <div className='py-30 px-10'>
          <div className='flex justify-center'>
            <div className='relative'>
              <Image width={120} src='./images/download.svg' fallback="" />
              <Image width={30} src='./logo.png' fallback="" className='absolute top-53 left-25 rounded-full'/>
            </div>
          </div>
          <p className='text-16 text-gray-600 text-center mt-20 leading-8'>
            This feature is only available in Mises Browser for Android.
          </p>
          <div className='flex justify-center mt-20 gap-10'>
            <Button color='primary' shape='rounded' fill='outline' className='flex-1' onClick={()=>setDownloadPop(false)}>Got it</Button>
          </div>
        </div>
      </CenterPopup>
    )

  }
}

export default DownloadPop