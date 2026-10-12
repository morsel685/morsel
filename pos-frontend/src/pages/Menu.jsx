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
    <section className="bg-[#1f1f1f] h-[calc(100vh-8.75rem)] min-h-[calc(100vh-8.75rem)] flex flex-col overflow-hidden">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col sm:flex-row gap-3 min-h-0 overflow-y-auto sm:overflow-hidden px-2 sm:px-4 pb-20 sm:pb-0">
        {/* Left Div - Menu */}
        <div className={`${isAdminMode ? "w-full" : "flex-1 min-w-0"} flex flex-col min-h-0 h-full`}>
          <div className="flex items-center justify-between px-2 sm:px-6 py-2.5 flex-shrink-0">
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

          <div className="flex-1 min-h-0 overflow-y-auto pb-20 sm:pb-24">
            <MenuContainer isAdminMode={isAdminMode} />
          </div>
        </div>

        {/* Right Div - Cart & Bill */}
        {!isAdminMode && (
          <div className="w-full sm:w-[300px] md:w-[340px] lg:w-[380px] xl:w-[420px] flex-shrink-0 bg-[#1a1a1a] rounded-xl pt-2 flex flex-col min-h-0 h-full border border-[#2a2a2a] pb-2 px-2 sm:px-0">
            {/* Customer Info */}
            <div className="flex-shrink-0">
              <CustomerInfo />
            </div>
            <hr className="border-[#2a2a2a] border-t-2" />
            {/* Cart Items */}
            <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
              <CartInfo />
            </div>
            <hr className="border-[#2a2a2a] border-t-2" />
            {/* Bills */}
            <div className="flex-shrink-0 pb-1">
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
