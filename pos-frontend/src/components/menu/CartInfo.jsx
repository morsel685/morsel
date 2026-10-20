import React, { useEffect, useRef } from "react";
import { RiDeleteBin2Fill } from "react-icons/ri";
import { FaNotesMedical } from "react-icons/fa6";
import { useDispatch, useSelector } from "react-redux";
import { removeItem, incrementQuantity, decrementQuantity } from "../../redux/slices/cartSlice";

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

  const handleIncrement = (itemId) => {
    dispatch(incrementQuantity(itemId));
  };

  const handleDecrement = (itemId) => {
    dispatch(decrementQuantity(itemId));
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
              className="bg-[#1f1f1f] rounded-lg px-3.5 py-2.5 mb-2 border border-[#2a2a2a] hover:border-[#333] transition"
            >
              {/* Item Name & Total Price */}
              <div className="flex items-center justify-between gap-2">
                <h1 className="text-[#e4e4e4] font-semibold tracking-wide text-sm truncate flex-1" title={item.name}>
                  {item.name}
                </h1>
                <p className="text-[#f5f5f5] text-sm font-bold flex-shrink-0">
                  ₹{item.price}
                </p>
              </div>

              {/* Bottom Row: Actions on Left, Plus/Minus on Right */}
              <div className="flex items-center justify-between mt-2.5">
                <div className="flex items-center gap-3">
                  <RiDeleteBin2Fill
                    onClick={() => handleRemove(item.id || item._id)}
                    className="text-[#ababab] hover:text-red-500 cursor-pointer transition active:scale-90"
                    size={17}
                    title="Remove item"
                  />
                  <FaNotesMedical
                    className="text-[#ababab] hover:text-yellow-500 cursor-pointer transition active:scale-90"
                    size={16}
                    title="Add notes"
                  />
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center bg-[#141414] rounded-lg border border-[#333] overflow-hidden">
                  <button
                    type="button"
                    onClick={() => handleDecrement(item.id || item._id)}
                    className="text-yellow-500 hover:bg-[#252525] px-2.5 py-0.5 font-bold text-sm transition active:scale-90 select-none"
                    title={item.quantity === 1 ? "Remove item" : "Decrease quantity"}
                  >
                    −
                  </button>
                  <span className="text-white px-1.5 py-0.5 min-w-[24px] text-center font-bold text-xs select-none">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleIncrement(item.id || item._id)}
                    className="text-yellow-500 hover:bg-[#252525] px-2.5 py-0.5 font-bold text-sm transition active:scale-90 select-none"
                    title="Increase quantity"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CartInfo;
