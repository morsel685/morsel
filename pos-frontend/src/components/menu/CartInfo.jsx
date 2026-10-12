import React, { useEffect, useRef } from "react";
import { RiDeleteBin2Fill } from "react-icons/ri";
import { FaNotesMedical } from "react-icons/fa6";
import { useDispatch, useSelector } from "react-redux";
import { removeItem } from "../../redux/slices/cartSlice";

const CartInfo = () => {
  const cartData = useSelector((state) => state.cart);
  const scrolLRef = useRef();
  const dispatch = useDispatch();

  useEffect(() => {
    if (scrolLRef.current) {
      scrolLRef.current.scrollTo({
        top: scrolLRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [cartData]);

  const handleRemove = (itemId) => {
    dispatch(removeItem(itemId));
  };

  return (
    <div className="px-4 py-2 flex flex-col h-full min-h-0">
      <h1 className="text-base sm:text-lg text-[#e4e4e4] font-semibold tracking-wide flex-shrink-0">
        Order Details
      </h1>
      <div className="mt-2 overflow-y-auto flex-1 min-h-0 pr-1" ref={scrolLRef}>
        {cartData.length === 0 ? (
          <p className="text-[#ababab] text-sm flex justify-center items-center h-full min-h-[120px]">
            Your cart is empty. Start adding items!
          </p>
        ) : (
          cartData.map((item) => (
            <div
              key={item.id || item._id}
              className="bg-[#1f1f1f] rounded-lg px-3.5 py-3 mb-2 border border-[#2a2a2a]"
            >
              <div className="flex items-center justify-between">
                <h1 className="text-[#e4e4e4] font-semibold tracking-wide text-sm truncate mr-2">
                  {item.name}
                </h1>
                <p className="text-yellow-500 font-semibold text-sm">x{item.quantity}</p>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-3">
                  <RiDeleteBin2Fill
                    onClick={() => handleRemove(item.id || item._id)}
                    className="text-[#ababab] hover:text-red-500 cursor-pointer transition"
                    size={18}
                  />
                  <FaNotesMedical
                    className="text-[#ababab] hover:text-yellow-500 cursor-pointer transition"
                    size={18}
                  />
                </div>
                <p className="text-[#f5f5f5] text-sm font-bold">₹{item.price}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CartInfo;
