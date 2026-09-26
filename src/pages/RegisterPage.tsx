import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/use-auth";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

export const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    if (errorMessage) setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Client-side validations matching backend Zod schema
    if (formData.first_name.trim().length < 2) {
      setErrorMessage("First name must be at least 2 characters long.");
      return;
    }
    if (formData.last_name.trim().length < 1) {
      setErrorMessage("Last name is required.");
      return;
    }
    if (!formData.email.trim() || !formData.email.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }
    const cleanPhone = formData.phone_number.trim();
    if (cleanPhone.length < 7) {
      setErrorMessage("Phone number must be at least 7 digits.");
      return;
    }
    if (formData.password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    console.log("[RegisterPage] Sending user registration API request to backend:", {
      ...formData,
      password: "••••••••",
    });

    try {
      const { error, user } = await register({
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim(),
        phone_number: cleanPhone,
        password: formData.password,
      });

      if (error) {
        console.error("[RegisterPage] Registration API returned error:", error.message);
        setErrorMessage(error.message);
        setLoading(false);
      } else {
        console.log("[RegisterPage] User registered and authenticated successfully:", user);
        setSuccessMessage("Account created successfully! Redirecting to workspace...");
        setTimeout(() => {
          navigate("/");
        }, 800);
      }
    } catch (err: any) {
      console.error("[RegisterPage] Unexpected error during registration:", err);
      setErrorMessage(err?.message || "An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#F4F5F7] px-4 py-8">
      <div className="w-full max-w-[480px] bg-white rounded-3xl shadow-sm border border-slate-100 p-8 sm:p-10 transition-all">
        {/* Logo Badge */}
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-full bg-[#65D000] flex items-center justify-center shadow-sm">
            <span className="text-white font-extrabold text-xl tracking-tight">OL</span>
          </div>
        </div>

        {/* Header Text */}
        <div className="text-center mt-5 space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Super Admin Sign Up
          </h1>
        </div>

        {/* Error Notification Banner */}
        {errorMessage && (
          <div className="mt-5 rounded-xl bg-[#FFF5F5] border border-[#FEB2B2] p-3 flex items-start gap-2.5 text-xs text-[#E53E3E] transition-all">
            <AlertTriangle className="h-4 w-4 shrink-0 text-[#E53E3E] mt-0.5" />
            <span className="leading-tight font-medium">{errorMessage}</span>
          </div>
        )}

        {/* Success Notification Banner */}
        {successMessage && (
          <div className="mt-5 rounded-xl bg-emerald-50 border border-emerald-200 p-3 flex items-start gap-2.5 text-xs text-emerald-800 transition-all">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
            <span className="leading-tight font-medium">{successMessage}</span>
          </div>
        )}

        {/* Sign Up Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-3.5">
          {/* Name Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">First Name</label>
              <input
                name="first_name"
                type="text"
                value={formData.first_name}
                onChange={handleChange}
                placeholder="John"
                required
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-[#65D000] focus:ring-2 focus:ring-[#65D000]/20 transition-colors outline-none placeholder:text-slate-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name</label>
              <input
                name="last_name"
                type="text"
                value={formData.last_name}
                onChange={handleChange}
                placeholder="Doe"
                required
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-[#65D000] focus:ring-2 focus:ring-[#65D000]/20 transition-colors outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="shop.admin@onelatur.com"
              required
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-[#65D000] focus:ring-2 focus:ring-[#65D000]/20 transition-colors outline-none placeholder:text-slate-400"
            />
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
            <input
              name="phone_number"
              type="tel"
              value={formData.phone_number}
              onChange={handleChange}
              placeholder="+91 98765 43210"
              required
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-[#65D000] focus:ring-2 focus:ring-[#65D000]/20 transition-colors outline-none placeholder:text-slate-400"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <input
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              minLength={6}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-[#65D000] focus:ring-2 focus:ring-[#65D000]/20 transition-colors outline-none placeholder:text-slate-400"
            />
            <p className="text-[11px] text-slate-400 mt-1">Must be at least 6 characters long.</p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-3 bg-[#65D000] hover:bg-[#58b800] active:scale-[0.99] text-white font-semibold py-2.5 rounded-xl text-sm transition-all shadow-sm flex items-center justify-center disabled:opacity-70 cursor-pointer"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Creating Account...</span>
              </div>
            ) : (
              "Create Account"
            )}
          </button>

          {/* Login Redirect */}
          <div className="text-center pt-2">
            <span className="text-xs text-slate-500">Already have an account? </span>
            <Link
              to="/login"
              className="text-xs font-semibold text-[#65D000] hover:underline hover:text-[#55b300]"
            >
              Sign In
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};
