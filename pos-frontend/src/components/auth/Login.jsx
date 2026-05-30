import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query"
import { login } from "../../https/index"
import { enqueueSnackbar } from "notistack";
import { useDispatch } from "react-redux";
import { setUser } from "../../redux/slices/userSlice";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }


  const handleSubmit = (e) => {
    e.preventDefault();
    loginMutation.mutate(formData);
  }

  const loginMutation = useMutation({
    mutationFn: (reqData) => login(reqData),
    onSuccess: (res) => {
      const { data } = res;
      console.log(data);
      const { _id, name, email, phone, role } = data.data;
      if (data.token) {
        localStorage.setItem("accessToken", data.token);
      }
      dispatch(setUser({ _id, name, email, phone, role }));
      navigate("/");
    },
    onError: (error) => {
      const message = error?.response?.data?.message || "Invalid email or password. Please try again.";
      enqueueSnackbar(message, { variant: "error" });
    }
  })

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div>
          <label className="block text-[#ababab] mb-1.5 mt-2.5 text-sm font-medium">
            Employee Email
          </label>
          <div className="flex items-center rounded-lg py-3.5 px-4 bg-[#1f1f1f]">
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
        </div>
        <div>
          <label className="block text-[#ababab] mb-1.5 mt-2.5 text-sm font-medium">
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

        <button
          type="submit"
          className="w-full rounded-lg mt-6 py-3 text-base bg-yellow-400 text-gray-900 font-bold"
        >
          Sign in
        </button>
      </form>
    </div>
  );
};

export default Login;
