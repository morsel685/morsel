import React from 'react'
import { BiTrendingUp } from 'react-icons/bi'

const MiniCard = ({ title, icon, number, footerNum }) => {
  const isEarnings = title === "Pending Payments";
  const gradientFrom = isEarnings ? "from-green-600/20" : "from-yellow-600/20";
  const gradientTo = isEarnings ? "to-green-800/10" : "to-yellow-800/10";
  const borderColor = isEarnings ? "border-green-600/30" : "border-yellow-600/30";
  const iconBg = isEarnings ? "bg-green-600/20" : "bg-yellow-600/20";
  const iconColor = isEarnings ? "text-green-500" : "text-yellow-500";
  const trendColor = isEarnings ? "text-green-500" : "text-yellow-500";

  return (
    <div className={`bg-gradient-to-br ${gradientFrom} ${gradientTo} border ${borderColor} py-6 px-6 rounded-2xl w-full hover:shadow-xl transition-all duration-300`}>
      <div className='flex items-start justify-between mb-4'>
        <h1 className='text-gray-300 text-sm font-semibold tracking-wide'>{title}</h1>
        <div className={`${iconBg} p-3 rounded-xl ${iconColor} text-2xl`}>
          {icon}
        </div>
      </div>
      <div>
        <h1 className='text-white text-4xl font-bold mb-2'>
          {isEarnings ? `₹${number}` : number}
        </h1>
        <div className='flex items-center gap-1'>
          <BiTrendingUp className={`${trendColor} text-sm`} />
          <span className={`${trendColor} text-sm font-semibold`}>{footerNum}%</span>
          <span className='text-gray-400 text-sm'>than yesterday</span>
        </div>
      </div>
    </div>
  )
}

export default MiniCard