import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import citymus from "../../assets/citymus.jpg";
import logo from "../../assets/logo.png";
import api from "../../config/api";

const LoginForm = () => {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    if (errorMessage) setErrorMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    const { username, password } = formData;
    if (!username || !password) {
      setErrorMessage("Please enter username and password.");
      setIsLoading(false);
      return;
    }

    try {
      const res = await api.post("/api/login", { username, password });

      if (res.data.success) {
        setErrorMessage("Login successful! Redirecting...");
        setTimeout(() => {
          navigate("/admin");
        }, 1000);
      } else {
        setErrorMessage(res.data.message || "Login failed.");
      }
    } catch (err) {
      console.error("Login error:", err);
      if (err.response?.data?.message) {
        setErrorMessage(err.response.data.message);
      } else if (err.code === 'ECONNREFUSED' || err.message.includes('Network Error')) {
        setErrorMessage("Cannot connect to server. Please check if the backend is running.");
      } else {
        setErrorMessage("Connection error. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleHomepageClick = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${citymus})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#2e2b41]/90 via-[#2e2b41]/85 to-[#2e2b41]/90"></div>
      </div>
      
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23AB8841' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-r from-[#AB8841] to-[#8B6B21] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
      <div className="absolute top-40 right-20 w-32 h-32 bg-gradient-to-r from-[#D4AF37] to-[#AB8841] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{animationDelay: '2s'}}></div>
      <div className="absolute bottom-20 left-1/2 w-32 h-32 bg-gradient-to-r from-[#8B6B21] to-[#D4AF37] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{animationDelay: '4s'}}></div>

      {/* Main Login Container */}
      <div className="relative w-full max-w-md z-10">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <img 
            src={logo} 
            alt="Museoo Logo" 
            className="w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-6 drop-shadow-lg"
          />
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-200 text-sm sm:text-base">
            Sign in to your Museoo account
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/20 shadow-2xl">
          {/* Error Message */}
          {errorMessage && (
            <div className={`mb-6 p-4 rounded-2xl text-sm font-medium backdrop-blur-sm ${
              errorMessage.includes("successful") 
                ? "bg-emerald-500/20 text-emerald-200 border border-emerald-500/30" 
                : "bg-red-500/20 text-red-200 border border-red-500/30"
            }`}>
              <div className="flex items-center gap-3">
                <i className={`fa-solid ${
                  errorMessage.includes("successful") ? "fa-check-circle" : "fa-exclamation-triangle"
                }`}></i>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Field */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-200">
                Username
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <i className="fa-solid fa-user text-gray-400 group-focus-within:text-[#AB8841] transition-colors"></i>
                </div>
                <input
                  type="text"
                  name="username"
                  placeholder="Enter your username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#AB8841] focus:border-transparent transition-all duration-300 backdrop-blur-sm"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-200">
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <i className="fa-solid fa-lock text-gray-400 group-focus-within:text-[#AB8841] transition-colors"></i>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-12 pr-12 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#AB8841] focus:border-transparent transition-all duration-300 backdrop-blur-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-[#AB8841] transition-colors"
                >
                  <i className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-[#AB8841] to-[#8B6B21] hover:from-[#8B6B21] hover:to-[#AB8841] text-white py-4 rounded-2xl font-semibold text-base shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Signing In...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-3">
                  <i className="fa-solid fa-sign-in-alt"></i>
                  <span>Sign In</span>
                </div>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <div className="flex items-center justify-between">
              <p className="text-gray-300 text-xs">
                <i className="fa-solid fa-shield-alt mr-2 text-[#AB8841]"></i>
                Secure login
              </p>
              <button
                onClick={handleHomepageClick}
                className="text-gray-300 hover:text-white text-sm font-medium transition-colors duration-200 flex items-center gap-2"
              >
                <i className="fa-solid fa-home"></i>
                <span>Home</span>
              </button>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-8 text-center">
          <div className="flex items-center justify-center space-x-6 text-gray-300">
            <div className="flex items-center gap-2 text-sm">
              <i className="fa-solid fa-shield-alt text-[#AB8841]"></i>
              <span>Secure</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <i className="fa-solid fa-bolt text-[#D4AF37]"></i>
              <span>Fast</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <i className="fa-solid fa-users text-[#8B6B21]"></i>
              <span>Reliable</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
