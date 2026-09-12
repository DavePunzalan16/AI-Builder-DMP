import React, { useState } from 'react'
import LoginLeft from '../components/LoginLeft'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2Icon, Mail, Lock, User, ArrowRight } from 'lucide-react'
import { useAppContext } from '../context/AppContext'

const AuthPage = ({ mode }) => {

  const { login, register } = useAppContext()
  const navigate = useNavigate()

  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false);

  const isLogin = mode === "login";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "login") {
        await login(email, password)
      } else {
        await register(name, email, password)
      }
      navigate("/")
    } catch (err) {
      setError(err.message || (mode === "login" ? "Invalid email or password." : "An error occurred. Please try again."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex text-zinc-900 font-sans">
      {/* Left Side */}
      <LoginLeft />

      {/* Right Side */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">

          <div className="mb-9">
            <h1 className="text-[32px] font-semibold tracking-tight text-zinc-950 mb-2">
              {isLogin ? "Welcome back" : "Create your account"}
            </h1>
            <p className="text-zinc-500 text-[15px] leading-relaxed">
              {isLogin
                ? "Sign in to continue building your website."
                : "Start building your website in minutes."}
            </p>
          </div>

          {error && (
            <div className="mb-5 px-3.5 py-3 border border-red-200 bg-red-50 text-red-700 text-sm rounded-xl flex items-start gap-2">
              <span className="mt-0.5 size-1.5 rounded-full bg-red-500 shrink-0" />
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {!isLogin && (
              <div>
                <label className="block text-[13px] font-medium text-zinc-700 mb-1.5">
                  Full name
                </label>
                <div className="relative">
                  <User size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 border border-zinc-200 rounded-xl bg-white shadow-xs focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 text-sm text-zinc-900 placeholder-zinc-500 transition-all"
                    placeholder="Mark Doe"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[13px] font-medium text-zinc-700 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 border border-zinc-200 rounded-xl bg-white shadow-xs focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 text-sm text-zinc-900 placeholder-zinc-500 transition-all"
                  placeholder="mark.doe@example.com"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[13px] font-medium text-zinc-700">
                  Password
                </label>
                {isLogin && (
                  <a href="#" className="text-[13px] font-medium text-zinc-500 hover:text-zinc-900 transition-colors">
                    Forgot password?
                  </a>
                )}
              </div>
              <div className="relative">
                <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-10 py-2.5 border border-zinc-200 rounded-xl bg-white shadow-xs focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400 text-sm text-zinc-900 placeholder-zinc-500 transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 flex items-center justify-center cursor-pointer transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-zinc-950 hover:bg-zinc-800 text-white font-medium rounded-xl shadow-sm disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer mt-1 transition-all group"
            >
              {loading ? (
                <Loader2Icon className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {isLogin ? "Sign in" : "Create account"}
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 pt-6 border-t border-zinc-200 text-sm text-zinc-500 text-center">
            {isLogin ? (
              <>
                New to Ai Builder?{" "}
                <Link to="/register" className="text-zinc-950 font-semibold hover:underline">
                  Create an account
                </Link>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <Link to="/login" className="text-zinc-950 font-semibold hover:underline">
                  Sign in
                </Link>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}

export default AuthPage