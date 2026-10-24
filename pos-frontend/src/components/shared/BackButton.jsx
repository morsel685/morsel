import React from 'react'
import { IoArrowBackOutline } from 'react-icons/io5'
import { useNavigate } from 'react-router-dom'

const BackButton = ({ onClick }) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(-1);
    }
  };

  return (
    <button onClick={handleBack} className='bg-[#025cca] p-2 text-xl font-bold rounded-full text-white cursor-pointer active:scale-95 transition'> 
        <IoArrowBackOutline />
    </button>
  )
}

export default BackButton