import React from "react";
import { FaSearch } from "react-icons/fa";
import { FaUserCircle } from "react-icons/fa";
import { FaBell } from "react-icons/fa";
import logo from "../../assets/images/logo.png";
import { useDispatch, useSelector } from "react-redux";
import { IoLogOut } from "react-icons/io5";
import { useMutation } from "@tanstack/react-query";
import { logout } from "../../https";
import { removeUser } from "../../redux/slices/userSlice";
import { useNavigate } from "react-router-dom";
import { MdDashboard } from "react-icons/md";

const Header = () => {
  const userData = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const logoutMutation = useMutation({
    mutationFn: () => logout(),
    onSuccess: (data) => {
      console.log(data);
      localStorage.removeItem("accessToken");
      dispatch(removeUser());
      navigate("/auth");
    },
    onError: (error) => {
      console.log("Logout error:", error);
      // Fallback: Clear user state and redirect anyway so user is not stuck
      localStorage.removeItem("accessToken");
      dispatch(removeUser());
      navigate("/auth");
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header className="flex justify-between items-center py-3 px-4 md:px-8 bg-[#1a1a1a] border-b border-[#262626] z-50 relative">
      {/* LOGO */}
      <div onClick={() => navigate("/")} className="flex items-center cursor-pointer">
        <img src={logo} className="h-8 md:h-10" alt="Morsel logo" />
      </div>

      {/* SEARCH */}
      <div className="hidden md:flex items-center gap-4 bg-[#1f1f1f] rounded-[15px] px-5 py-2 w-[300px] lg:w-[500px]">
        <FaSearch className="text-[#f5f5f5]" />
        <input
          type="text"
          placeholder="Search"
          className="bg-[#1f1f1f] outline-none text-[#f5f5f5] w-full"
        />
      </div>

      {/* LOGGED USER DETAILS */}
      <div className="flex items-center gap-2 md:gap-4">
        {userData.role === "Admin" && (
          <div onClick={() => navigate("/dashboard")} className="bg-[#1f1f1f] rounded-[15px] p-2 md:p-3 cursor-pointer">
            <MdDashboard className="text-[#f5f5f5] text-xl md:text-2xl" />
          </div>
        )}
        <div className="bg-[#1f1f1f] rounded-[15px] p-2 md:p-3 cursor-pointer">
          <FaBell className="text-[#f5f5f5] text-xl md:text-2xl" />
        </div>
        <div className="flex items-center gap-2 md:gap-3 cursor-pointer">
          <FaUserCircle className="text-[#f5f5f5] text-3xl md:text-4xl" />
          <div className="hidden sm:flex flex-col items-start">
            <h1 className="text-sm md:text-md text-[#f5f5f5] font-semibold tracking-wide">
              {userData.name || "TEST USER"}
            </h1>
            <p className="text-[10px] md:text-xs text-[#ababab] font-medium">
              {userData.role || "Role"}
            </p>
          </div>
          <IoLogOut
            onClick={handleLogout}
            className="text-[#f5f5f5] ml-1 md:ml-2"
            size={30}
          />
        </div>
      </div>
    </header>
  );
};

export default Header;
