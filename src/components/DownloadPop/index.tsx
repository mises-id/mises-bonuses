import { Button, CenterPopup, CenterPopupProps, Image } from 'antd-mobile'
import React, { FC } from 'react'

interface IProps extends CenterPopupProps {
  setDownloadPop: (status: boolean) => void;
  downloadPop: boolean

}
const DownloadPop:FC<IProps> = ({
  setDownloadPop,
  downloadPop
})=> {
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
          Please download the latest version of Mises Browser.
        </p>
        <div className='flex justify-center mt-20 gap-10'>
          <Button color='primary' shape='rounded' fill='outline' className='flex-1' onClick={()=>setDownloadPop(false)}>Cancel</Button>
          <Button color='primary' shape='rounded' className='flex-1' onClick={() => {
            setDownloadPop(false)
            window.open('https://www.mises.site/download', 'target=_blank')
          }}>Download</Button>
        </div>
      </div>
    </CenterPopup>
  )
}

export default DownloadPop