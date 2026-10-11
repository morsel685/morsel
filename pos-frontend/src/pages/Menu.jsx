import React, { useEffect } from "react";
import BottomNav from "../components/shared/BottomNav";
import BackButton from "../components/shared/BackButton";
import { MdRestaurantMenu } from "react-icons/md";
import MenuContainer from "../components/menu/MenuContainer";
import CustomerInfo from "../components/menu/CustomerInfo";
import CartInfo from "../components/menu/CartInfo";
import Bill from "../components/menu/Bill";
import { useSelector } from "react-redux";

import { useLocation } from "react-router-dom";

const Menu = () => {
  const location = useLocation();
  const isAdminMode = location.state?.isAdminMode;

  useEffect(() => {
    document.title = isAdminMode ? "Morsel | Menu Management" : "Morsel | Menu";
  }, [isAdminMode]);

  const customerData = useSelector((state) => state.customer);

  return (
    <section className="bg-[#1f1f1f] h-[calc(100vh-5rem)] min-h-[calc(100vh-5rem)] flex flex-col overflow-hidden">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:flex-row gap-3 min-h-0 overflow-y-auto lg:overflow-hidden px-2 sm:px-4">
        {/* Left Div - Menu */}
        <div className={`${isAdminMode ? "w-full" : "w-full lg:flex-[3]"} flex flex-col min-h-0 h-full`}>
          <div className="flex items-center justify-between px-2 sm:px-6 py-3 flex-shrink-0">
            <div className="flex items-center gap-3 sm:gap-4">
              <BackButton />
              <h1 className="text-[#f5f5f5] text-xl sm:text-2xl font-bold tracking-wider">
                {isAdminMode ? "Menu Management" : "Menu"}
              </h1>
            </div>

            {!isAdminMode && (
              <div className="flex items-center justify-around gap-4">
                <div className="flex items-center gap-2 sm:gap-3 cursor-pointer">
                  <MdRestaurantMenu className="text-[#f5f5f5] text-3xl sm:text-4xl" />
                  <div className="flex flex-col items-start">
                    <h1 className="text-sm sm:text-md text-[#f5f5f5] font-semibold tracking-wide">
                      {customerData.customerName || "Customer Name"}
                    </h1>
                    <p className="text-[10px] sm:text-xs text-[#ababab] font-medium">
                      Table : {customerData.table?.tableNo || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto pb-28 sm:pb-32">
            <MenuContainer isAdminMode={isAdminMode} />
          </div>
        </div>

        {/* Right Div - Cart & Bill */}
        {!isAdminMode && (
          <div className="w-full lg:flex-[1] bg-[#1a1a1a] mt-2 lg:mt-0 lg:mr-2 rounded-xl pt-2 flex flex-col min-h-0 lg:h-full border border-[#2a2a2a] pb-28 lg:pb-4 px-2 sm:px-0">
            {/* Customer Info */}
            <CustomerInfo />
            <hr className="border-[#2a2a2a] border-t-2" />
            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto min-h-[150px] lg:min-h-0">
              <CartInfo />
            </div>
            <hr className="border-[#2a2a2a] border-t-2" />
            {/* Bills */}
            <div className="pb-4">
              <Bill />
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </section>
  );
};

export default Menu;
