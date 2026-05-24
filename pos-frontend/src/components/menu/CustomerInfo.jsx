import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { formatDate, getAvatarName } from "../../utils";
import { setOrderType } from "../../redux/slices/customerSlice";

const CustomerInfo = () => {
  const [dateTime, setDateTime] = useState(new Date());
  const dispatch = useDispatch();
  const customerData = useSelector((state) => state.customer);

  const handleOrderTypeChange = (type) => {
    dispatch(setOrderType(type));
  };

  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex flex-col items-start">
          <h1 className="text-md text-[#f5f5f5] font-semibold tracking-wide">
            {customerData.customerName || "Customer Name"}
          </h1>
          <p className="text-xs text-[#ababab] font-medium mt-1">
            #{customerData.orderId || "N/A"}
          </p>
          <p className="text-xs text-[#ababab] font-medium mt-1">
            {formatDate(dateTime)}
          </p>
        </div>
        <button className="bg-[#f6b100] p-3 text-xl font-bold rounded-lg">
          {getAvatarName(customerData.customerName) || "CN"}
        </button>
      </div>

      {/* Order Type Selection */}
      <div className="flex gap-2 mt-3">
        <button
          onClick={() => handleOrderTypeChange("Dine In")}
          className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-all ${customerData.orderType === "Dine In"
            ? "bg-green-600 text-white"
            : "bg-[#333] text-[#ababab] hover:bg-[#444]"
            }`}
        >
          Dine In
        </button>
        <button
          onClick={() => handleOrderTypeChange("Take Away")}
          className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-all ${customerData.orderType === "Take Away"
            ? "bg-orange-600 text-white"
            : "bg-[#333] text-[#ababab] hover:bg-[#444]"
            }`}
        >
          Take Away
        </button>
      </div>
    </div>
  );
};

export default CustomerInfo;
