import React, { useState } from "react";
import { register } from "../../https";
import { useMutation } from "@tanstack/react-query";
import { enqueueSnackbar } from "notistack";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const Register = ({ setIsRegister }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ email: "", phone: "" });

  const validateField = (name, value) => {
    let errMsg = "";
    if (name === "email") {
      if (value.trim() === "") {
        errMsg = "";
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          errMsg = "Invalid email format (e.g., name@domain.com)";
        }
      }
    } else if (name === "phone") {
      if (value.trim() === "") {
        errMsg = "";
      } else {
        const phoneRegex = /^\d{10}$/;
        if (!phoneRegex.test(value)) {
          errMsg = "Phone number must be exactly 10 digits";
        }
      }
    }
    setErrors((prev) => ({ ...prev, [name]: errMsg }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    validateField(name, value);
  };

  const handleRoleSelection = (selectedRole) => {
    setFormData({ ...formData, role: selectedRole });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // 1. Check existing validation errors
    if (errors.email || errors.phone) {
      enqueueSnackbar("Please fix the validation errors in the form first!", { variant: "warning" });
      return;
    }

    // 2. Double check required fields are populated
    if (!formData.name || !formData.email || !formData.phone || !formData.password) {
      enqueueSnackbar("All fields are required!", { variant: "warning" });
      return;
    }

    // 3. Validate Email Format (final check)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      enqueueSnackbar("Please enter a valid email address!", { variant: "warning" });
      return;
    }

    // 4. Validate Phone Number (final check)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(formData.phone)) {
      enqueueSnackbar("Please enter a valid 10-digit phone number!", { variant: "warning" });
      return;
    }

    // 5. Validate Role Selection
    if (!formData.role) {
      enqueueSnackbar("Please select your job role!", { variant: "warning" });
      return;
    }

    registerMutation.mutate(formData);
  };

  const registerMutation = useMutation({
    mutationFn: (reqData) => register(reqData),
    onSuccess: (res) => {
      const { data } = res;
      enqueueSnackbar(data.message, { variant: "success" });
      setFormData({
        name: "",
        email: "",
        phone: "",
        password: "",
        role: "",
      });

      setTimeout(() => {
        setIsRegister(false);
      }, 1500);
    },
    onError: (error) => {
      const message = error?.response?.data?.message || "Failed to connect to server. Please try again.";
      enqueueSnackbar(message, { variant: "error" });
    },
  });

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[#ababab] mb-1.5 text-sm font-medium">
              Employee Name
            </label>
            <div className="flex items-center rounded-lg py-3.5 px-4 bg-[#1f1f1f]">
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter employee name"
                className="bg-transparent flex-1 text-white focus:outline-none"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-[#ababab] mb-1.5 text-sm font-medium">
              Employee Email
            </label>
            <div className={`flex items-center rounded-lg py-3.5 px-4 bg-[#1f1f1f] border transition-colors duration-200 ${errors.email ? "border-red-500" : "border-transparent"}`}>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter employee email"
                className="bg-transparent flex-1 text-white focus:outline-none"
                required
              />
            </div>
            {errors.email && (
              <p className="text-red-500 text-xs mt-1 ml-1 font-medium">
                ⚠️ {errors.email}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[#ababab] mb-1.5 text-sm font-medium">
              Employee Phone
            </label>
            <div className={`flex items-center rounded-lg py-3.5 px-4 bg-[#1f1f1f] border transition-colors duration-200 ${errors.phone ? "border-red-500" : "border-transparent"}`}>
              <input
                type="number"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter employee phone"
                className="bg-transparent flex-1 text-white focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                required
              />
            </div>
            {errors.phone && (
              <p className="text-red-500 text-xs mt-1 ml-1 font-medium">
                ⚠️ {errors.phone}
              </p>
            )}
          </div>
          <div>
            <label className="block text-[#ababab] mb-1.5 text-sm font-medium">
              Password
            </label>
            <div className="flex items-center rounded-lg py-3.5 px-4 bg-[#1f1f1f]">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter password"
                className="bg-transparent flex-1 text-white focus:outline-none"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[#ababab] hover:text-white focus:outline-none ml-2"
              >
                {showPassword ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
              </button>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-[#ababab] mb-1.5 mt-1 text-sm font-medium">
            Choose your role
          </label>
          <div className="flex items-center gap-3 mt-2">
            {["Waiter", "Cashier", "Admin"].map((role) => {
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleRoleSelection(role)}
                  className={`bg-[#1f1f1f] px-4 py-3 w-full rounded-lg text-base text-[#ababab] transition-colors duration-150 ${formData.role === role ? "bg-indigo-700 text-white font-medium" : ""
                    }`}
                >
                  {role}
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="submit"
          className="w-full rounded-lg mt-5 py-3 text-base bg-yellow-400 text-gray-900 font-bold hover:bg-yellow-500 transition-colors"
        >
          Sign up
        </button>
      </form>
    </div>
  );
};

export default Register;
