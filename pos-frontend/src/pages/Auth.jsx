import React, { useEffect, useState } from "react";
import restaurant from "../assets/images/restaurant-img.jpg"
import logo from "../assets/images/logo.png"
import Register from "../components/auth/Register";
import Login from "../components/auth/Login";

const Auth = () => {

  useEffect(() => {
    document.title = "Morsel | Auth"
  }, [])

  const [isRegister, setIsRegister] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Left Section */}
      <div className="hidden lg:flex lg:w-1/2 h-full relative items-center justify-center bg-cover">
        {/* BG Image */}
        <img className="w-full h-full object-cover" src={restaurant} alt="Restaurant Image" />

        {/* Black Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-80"></div>

        {/* Quote at bottom */}
        <blockquote className="absolute bottom-10 px-8 mb-10 text-2xl italic text-white">
          "Serve customers the best food with prompt and friendly service in a
          welcoming atmosphere, and they’ll keep coming back."
          <br />
          <span className="block mt-4 text-yellow-400">- Founder of Morsel</span>
        </blockquote>
      </div>

      {/* Right Section */}
      <div className="w-full lg:w-1/2 h-full bg-[#1a1a1a] p-6 sm:p-10 flex flex-col justify-center overflow-y-auto">
        <div className="max-w-xl w-full mx-auto">
          <div className="flex justify-center">
            <img src={logo} alt="Morsel Logo" className="h-16" />
          </div>

          <h2 className="text-2xl sm:text-3xl text-center mt-6 font-semibold text-yellow-400 mb-6">
            {isRegister ? "Employee Registration" : "Employee Login"}
          </h2>

          {/* Components */}
          {isRegister ? <Register setIsRegister={setIsRegister} /> : <Login />}

          <div className="flex justify-center mt-4">
            <p className="text-sm text-[#ababab]">
              {isRegister ? "Already have an account? " : "Don't have an account? "}
              <a onClick={() => setIsRegister(!isRegister)} className="text-yellow-400 font-semibold hover:underline" href="#">
                {isRegister ? "Sign in" : "Sign up"}
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
