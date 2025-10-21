import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import citymus from "../../assets/citymus.jpg";
import logo from "../../assets/logo.png";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const SignupForm = () => {
  const [formData, setFormData] = useState({
    username: "",
    firstname: "",
    lastname: "",
    password: "",
    repeatPassword: "",
    role: "",
  });

  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeat, setShowRepeat] = useState(false);

  const inputWrapperStyle = {
    position: "relative",
    marginBottom: 20,
  };
  const inputStyle = {
    width: "100%",
    background: "#edeaf7",
    border: "2px solid #b08d36",
    borderRadius: "8px",
    fontSize: "1.2rem",
    padding: "0.75rem 2.5rem 0.75rem 0.75rem",
    color: "#22223b",
    outline: "none",
    boxSizing: "border-box"
  };
  const eyeStyle = {
    position: "absolute",
    right: "1rem",
    top: "50%",
    transform: "translateY(-50%)",
    cursor: "pointer"
  };

  const validatePasswordStrength = (password, username) => {
    const errors = [];
    if (password.length < 8) errors.push("Be at least 8 characters long");
    if (!/[A-Z]/.test(password)) errors.push("Include at least one uppercase letter");
    if (!/[a-z]/.test(password)) errors.push("Include at least one lowercase letter");
    if (!/[0-9]/.test(password)) errors.push("Include at least one number");
    if (!/[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>\/?]/.test(password))
      errors.push("Include at least one special character");
    if (/(.)\1{2,}/.test(password))
      errors.push("Avoid three or more consecutive repeated characters");

    const commonPatterns = ["123456", "qwerty", "abcdef", "password", "admin"];
    if (commonPatterns.some((pattern) => password.toLowerCase().includes(pattern))) {
      errors.push("Avoid common patterns like '123456', 'qwerty', etc.");
    }

    if (username && password.toLowerCase().includes(username.toLowerCase()) && username.length > 2) {
      errors.push("Password should not contain your username");
    }

    return errors;
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    const { username, firstname, lastname, password, repeatPassword, role } = formData;

    if (!username || !firstname || !lastname || !password || !repeatPassword || !role) {
      setErrorMessage("Please fill in all fields.");
      return;
    }

    if (password !== repeatPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    const passwordErrors = validatePasswordStrength(password, username);
    if (passwordErrors.length > 0) {
      setErrorMessage(
        "Password must meet the following requirements:\n" +
          passwordErrors.map((err) => `- ${err}`).join("\n")
      );
      return;
    }

    try {
      const res = await fetch("http://localhost:3000/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          firstname,
          lastname,
          password,
          role: parseInt(role),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setErrorMessage("Account created successfully!");
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        setErrorMessage(data.message || "Sign-up failed.");
      }
    } catch (err) {
      console.error("Signup error:", err);
      setErrorMessage("Something went wrong. Please try again.");
    }
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center flex items-center justify-center px-4"
      style={{
        backgroundImage: `linear-gradient(rgba(4,9,30,0.7),rgba(4,9,30,0.7)), url(${citymus})`,
      }}
    >
      <div className="bg-[#91936e] text-center p-8 rounded-2xl shadow-lg w-full max-w-md text-white">
        <Link to="/">
          <img src={logo} alt="Logo" className="w-24 mx-auto mb-4" />
        </Link>
        <h1 className="text-3xl font-bold text-[#2e2b41] mb-2">Sign Up</h1>
        {errorMessage && (
          <p className="text-sm text-red-300 whitespace-pre-wrap mb-4">{errorMessage}</p>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
          {["username", "firstname", "lastname"].map((field) => (
            <div key={field}>
              <label className="text-[#2e2b41] font-semibold mb-1 block">
                {field.charAt(0).toUpperCase() + field.slice(1)}
              </label>
              <input
                type= "text"
                name={field}
                value={formData[field]}
                onChange={handleChange}
                placeholder={field}
                className="w-full p-3 rounded-md border-2 bg-[#f3f0ff] text-black focus:outline-none focus:border-[#AB8841]"
                required
              />
            </div>
          ))}

        <div style={inputWrapperStyle}>
          <label style={{ display: "block", fontWeight: 500, color: "#2d2d3a" }}>
            Password
          </label>
          <div style={{ position: "relative" }}>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Password"
              style={{ ...inputStyle, paddingRight: "30px" }}
              required
            />
            <span
              onClick={() => {
                if (formData.password) setShowPassword(s => !s);
              }}
              style={{
                position: "absolute",
                right: "8px",
                top: "50%",
                transform: "translateY(-50%)",
                cursor: formData.password ? "pointer" : "not-allowed",
                opacity: formData.password ? 1 : 0.5
              }}
            >
              {showPassword ? (
                <FaEyeSlash color="black" size={22} />
              ) : (
                <FaEye color="black" size={22} />
              )}
            </span>
          </div>
        </div>

        <div style={inputWrapperStyle}>
          <label style={{ display: "block", fontWeight: 500, color: "#2d2d3a" }}>
            Repeat Password
          </label>
          <div style={{ position: "relative" }}>
            <input
              type={showRepeat ? "text" : "password"}
              name="repeatPassword"
              value={formData.repeatPassword}
              onChange={handleChange}
              placeholder="Repeat Password"
              style={{ ...inputStyle, paddingRight: "30px" }}
              required
            />
            <span
              onClick={() => {
                if (formData.repeatPassword) setShowRepeat(s => !s);
              }}
              style={{
                position: "absolute",
                right: "8px",
                top: "50%",
                transform: "translateY(-50%)",
                cursor: formData.repeatPassword ? "pointer" : "not-allowed",
                opacity: formData.repeatPassword ? 1 : 0.5
              }}
            >
              {showRepeat ? (
                <FaEyeSlash color="black" size={22} />
              ) : (
                <FaEye color="black" size={22} />
              )}
            </span>
          </div>
        </div>


          <div>
            <label className="text-[#2e2b41] font-semibold mb-1 block">Role</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full p-3 rounded-md border-2 bg-[#f3f0ff] text-black focus:outline-none focus:border-[#AB8841]"
              required
            >
              <option value="">Select Role</option>
              <option value="1">Admin</option>
              <option value="0">Staff</option>
            </select>
          </div>

          <button
            type="submit"
            className="bg-[#AB8841] hover:bg-[#2e2b41] transition-colors text-white py-3 rounded-md font-semibold"
          >
            Sign Up
          </button>
        </form>

        <p className="mt-4 text-sm">
          Already have an account?{" "}
          <Link to="/login" className="text-[#f3f0ff] hover:text-[#AB8841] font-bold">
            Log in here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignupForm;
