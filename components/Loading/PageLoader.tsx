import React from 'react'
import ProgressLoader from './ProgressLoader'

const PageLoader = () => {
  return (
    <div className='flex h-screen w-full items-center justify-center flex-col text-center'>
      <h1 className='lg:text-[100px] font-black uppercase leading-none'>Wrapping <span className='text-[50px] leading-none bg-linear-to-r from-[#cfcfd0] to-[#B0ADBF] font-black block mt-4 bg-clip-text px-3 text-transparent'>your year</span></h1>
  <div
  className="
    relative my-8 rounded-lg px-8 text-center
    border border-[#b408b4]
    shadow-[0_2px_5px_rgba(180,8,180,0.9)]
  "
>
  <p className="
    uppercase text-[60px] font-black inline-flex
    bg-linear-to-r from-[#F5F4F7] to-purple-500
    bg-clip-text text-transparent
  ">
    stellar
  </p>
</div>
<ProgressLoader />
    </div>
  )
}

export default PageLoader