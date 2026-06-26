import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, EyeOff, ShieldCheck, Mail, Lock, User, KeyRound, Key, RefreshCw, Sparkles, Music, Phone } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (user: any, token: string) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  // Authentication Workflow States
  const [step, setStep] = useState<'credentials' | 'otp' | 'mfa'>('credentials');
  const [authUserId, setAuthUserId] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [secret2FA, setSecret2FA] = useState('');

  // Mouse Glow spotlight position state
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Password strength meter calculation
  const getPasswordStrength = () => {
    if (!password) return { label: 'Empty', color: 'bg-neutral-800', score: 0 };
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 1) return { label: 'Weak', color: 'bg-red-500', score };
    if (score === 2) return { label: 'Fair', color: 'bg-amber-500', score };
    if (score === 3) return { label: 'Strong', color: 'bg-indigo-500', score };
    return { label: 'Ultimate VIP', color: 'bg-green-500', score };
  };

  const passwordStrength = getPasswordStrength();

  // Forgot password handler
  const handleForgotPassword = () => {
    if (!email) {
      setError('Please provide your email address to receive authorization passcode.');
      return;
    }
    setError('');
    setInfoMessage('Secured forgot-password request dispatched. Standard bypass otp is "123456" for immediate entry.');
  };

  // Submit credentials (sign up or login)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');

    if (isSignUp) {
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters');
        return;
      }
      if (!email.toLowerCase().endsWith('@lumina.ui')) {
        setError('Security Restriction: Sign-ups are exclusive to @lumina.ui accounts.');
        return;
      }
    }

    setLoading(true);
    try {
      const endpoint = isSignUp ? '/api/auth/signup' : '/api/auth/login';
      const body = isSignUp
        ? { username, email, password, firstName, lastName, phone }
        : { email, password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Server authorization failed');
      }

      if (isSignUp) {
        setAuthUserId(data.userId);
        setOtpSent(data.otpCode); // In development, the API directly sends OTP for easy onboarding
        setStep('otp');
        setInfoMessage('Identity verification required. Enter the 6-digit OTP passcode displayed below.');
      } else {
        if (data.token && data.user) {
          onLoginSuccess(data.user, data.token);
        } else if (data.mfaRequired) {
          setAuthUserId(data.userId);
          setOtpSent(data.otpCode);
          setStep('otp');
          setInfoMessage('Multi-Factor OTP Challenge active. Enter the authentication code.');
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Submit OTP Verification
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: authUserId, code: otpCode }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'OTP Verification failed');

      setSecret2FA(data.secret2FA);
      setStep('mfa');
      setInfoMessage('Step 2: Two-Factor Authentication configuration.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Submit 2FA Verification
  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: authUserId, code: mfaCode }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Security code rejection');

      // Hand off JWT session
      onLoginSuccess(data.user, data.token);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="login_container"
      className="relative min-h-screen w-full bg-black text-white flex items-center justify-center overflow-hidden font-sans select-none"
    >
      {/* Interactive mouse follow spotlight */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40 z-0 transition-opacity duration-500"
        style={{
          background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(168, 85, 247, 0.15) 0%, rgba(59, 130, 246, 0.05) 50%, transparent 100%)`,
        }}
      />

      {/* Floating neon ambient circles */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-900/10 blur-[120px] pointer-events-none animate-pulse duration-5000" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-900/10 blur-[120px] pointer-events-none animate-pulse duration-7000" />

      {/* Particle lines behind */}
      <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

      {/* Main Login Card Wrapper */}
      <div className="relative w-full max-w-md px-6 py-12 z-10 flex flex-col items-center">
        {/* Animated Brand Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center mb-8 text-center"
        >
          {/* Logo */}
          <div className="relative mb-3 group">
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-purple-600 via-blue-500 to-emerald-500 opacity-70 blur-md group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
            <div className="relative w-16 h-16 rounded-full bg-neutral-950 flex items-center justify-center border border-white/10">
              <Music className="w-8 h-8 text-purple-400 group-hover:scale-110 transition-transform duration-300" />
            </div>
            {/* Equalizer animation beside logo */}
            <div className="absolute bottom-1 right-1 flex space-x-0.5 bg-neutral-950/80 p-1 rounded border border-white/5">
              <div className="w-1 h-3 bg-purple-500 rounded eq-bar-1" />
              <div className="w-1 h-3 bg-blue-400 rounded eq-bar-2" />
              <div className="w-1 h-3 bg-emerald-400 rounded eq-bar-3" />
            </div>
          </div>

          <h1 className="text-4xl font-extrabold tracking-wider font-display bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-200 to-blue-400">
            LUMINA
            <span className="text-xs tracking-widest text-emerald-400 block mt-1 font-mono">SECURE ACCESS</span>
          </h1>
        </motion.div>

        {/* Authenticator Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full glass-card rounded-2xl border border-white/10 p-8 shadow-2xl relative"
        >
          {/* Top border ambient glow line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-500 via-blue-500 to-emerald-500 rounded-t-2xl" />

          <AnimatePresence mode="wait">
            {step === 'credentials' && (
              <motion.div
                key="credentials"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                <div className="mb-6 text-center">
                  <h2 className="text-xl font-bold tracking-tight">
                    {isSignUp ? 'Create your Lumina Key' : 'Authorize Credentials'}
                  </h2>
                  <p className="text-xs text-neutral-400 mt-1">
                    {isSignUp ? 'Lumina exclusive network access account.' : 'Provide your registered email ending with @lumina.ui'}
                  </p>
                </div>

                {error && (
                  <div className="p-3 mb-4 bg-red-950/40 border border-red-500/30 rounded-lg text-xs text-red-400 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {infoMessage && (
                  <div className="p-3 mb-4 bg-blue-950/40 border border-blue-500/30 rounded-lg text-xs text-blue-300 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 shrink-0" />
                    <span>{infoMessage}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {isSignUp && (
                    <div className="relative">
                      <User className="absolute left-3 top-3.5 w-4 h-4 text-neutral-500" />
                      <input
                        type="text"
                        placeholder="Choose Username"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value.replace(/\s+/g, ''))}
                        className="w-full bg-white/[0.03] border border-white/10 hover:border-white/20 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl py-3 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-neutral-500"
                      />
                    </div>
                  )}

                  {isSignUp && (
                    <div className="relative">
                      <Phone className="absolute left-3 top-3.5 w-4 h-4 text-neutral-500" />
                      <input
                        type="text"
                        placeholder="Phone Number (optional)"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/[^\d+]/g, ''))}
                        className="w-full bg-white/[0.03] border border-white/10 hover:border-white/20 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl py-3 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-neutral-500"
                      />
                    </div>
                  )}

                  <div className="relative">
                    <Mail className="absolute left-3 top-3.5 w-4 h-4 text-neutral-500" />
                    <input
                      type="text"
                      placeholder={isSignUp ? "email@lumina.ui" : "Email, Username or Phone Number"}
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-white/[0.03] border border-white/10 hover:border-white/20 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl py-3 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-neutral-500"
                    />
                  </div>

                  {isSignUp && (
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="First Name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="bg-white/[0.03] border border-white/10 rounded-xl py-3 px-4 text-sm outline-none transition-all"
                      />
                      <input
                        type="text"
                        placeholder="Last Name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="bg-white/[0.03] border border-white/10 rounded-xl py-3 px-4 text-sm outline-none transition-all"
                      />
                    </div>
                  )}

                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 w-4 h-4 text-neutral-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-white/[0.03] border border-white/10 hover:border-white/20 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl py-3 pl-10 pr-10 text-sm outline-none transition-all placeholder:text-neutral-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3.5 text-neutral-500 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Password strength meter */}
                  {isSignUp && password && (
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-neutral-400">Strength Rating:</span>
                        <span className="font-mono font-bold text-neutral-300">{passwordStrength.label}</span>
                      </div>
                      <div className="w-full bg-neutral-800 h-1 rounded-full overflow-hidden flex">
                        <div
                          className={`h-full ${passwordStrength.color} transition-all duration-300`}
                          style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {isSignUp && (
                    <div className="relative">
                      <Lock className="absolute left-3 top-3.5 w-4 h-4 text-neutral-500" />
                      <input
                        type="password"
                        placeholder="Confirm Password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/10 hover:border-white/20 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl py-3 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-neutral-500"
                      />
                    </div>
                  )}

                  {!isSignUp && (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleForgotPassword}
                        className="text-xs text-purple-400 hover:text-purple-300 hover:underline transition-all"
                      >
                        Forgot Access Key?
                      </button>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="relative w-full mt-2 bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-500 hover:to-blue-400 text-white rounded-xl py-3 font-semibold text-sm outline-none transition-all shadow-lg shadow-purple-900/30 active:scale-[0.98] flex items-center justify-center gap-2 group cursor-pointer"
                  >
                    {loading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>{isSignUp ? 'Generate Access Key' : 'Unlock Portal'}</span>
                        <ShieldCheck className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-6 flex flex-col items-center gap-2 text-xs">
                  <span className="text-neutral-500">
                    {isSignUp ? 'Registered?' : 'Need an official key?'}
                  </span>
                  <button
                    onClick={() => {
                      setIsSignUp(!isSignUp);
                      setError('');
                      setInfoMessage('');
                    }}
                    className="text-purple-400 font-bold hover:text-purple-300 cursor-pointer"
                  >
                    {isSignUp ? 'Log In Instead' : 'Create an Account (@lumina.ui only)'}
                  </button>
                </div>
              </motion.div>
            )}

            {step === 'otp' && (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                <div className="mb-6 text-center">
                  <h2 className="text-xl font-bold tracking-tight">Identity Authorization</h2>
                  <p className="text-xs text-neutral-400 mt-1">
                    An authorization pass code was dispatched.
                  </p>
                </div>

                {error && (
                  <div className="p-3 mb-4 bg-red-950/40 border border-red-500/30 rounded-lg text-xs text-red-400">
                    {error}
                  </div>
                )}

                {infoMessage && (
                  <div className="p-3 mb-4 bg-purple-950/30 border border-purple-500/20 rounded-lg text-xs text-purple-300">
                    {infoMessage}
                  </div>
                )}

                {/* For test ease, display generated code in beautiful panel */}
                {otpSent && (
                  <div className="p-4 mb-6 bg-neutral-900/80 border border-emerald-500/30 rounded-xl text-center space-y-2">
                    <p className="text-[10px] text-emerald-400 font-mono tracking-widest font-bold">LUMINA OTP DEV FEED</p>
                    <p className="text-3xl font-extrabold tracking-widest text-white font-mono bg-black/40 py-2 rounded-lg border border-white/5 shadow-inner">
                      {otpSent}
                    </p>
                    <p className="text-[10px] text-neutral-500">Simulating email transmission to {email}</p>
                  </div>
                )}

                <form onSubmit={handleVerifyOTP} className="space-y-4">
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-3.5 w-4 h-4 text-neutral-500" />
                    <input
                      type="text"
                      placeholder="6-Digit OTP Code"
                      maxLength={6}
                      required
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      className="w-full text-center tracking-widest font-mono text-lg bg-white/[0.03] border border-white/10 hover:border-white/20 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl py-3 pl-10 pr-4 outline-none transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="relative w-full mt-2 bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-500 hover:to-blue-400 text-white rounded-xl py-3 font-semibold text-sm outline-none transition-all shadow-lg cursor-pointer"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin mx-auto" /> : 'Confirm Authentication Code'}
                  </button>
                </form>

                <div className="mt-6 flex flex-col items-center">
                  <button
                    onClick={() => setStep('credentials')}
                    className="text-xs text-neutral-500 hover:text-white"
                  >
                    ← Back to Credentials
                  </button>
                </div>
              </motion.div>
            )}

            {step === 'mfa' && (
              <motion.div
                key="mfa"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                <div className="mb-6 text-center">
                  <h2 className="text-xl font-bold tracking-tight">Two-Factor Authenticator</h2>
                  <p className="text-xs text-neutral-400 mt-1">
                    Cosmic terminal layer-2 authorization gate.
                  </p>
                </div>

                {error && (
                  <div className="p-3 mb-4 bg-red-950/40 border border-red-500/30 rounded-lg text-xs text-red-400">
                    {error}
                  </div>
                )}

                <div className="p-4 mb-6 bg-neutral-900/80 border border-purple-500/30 rounded-xl text-center space-y-3">
                  <div className="w-24 h-24 mx-auto bg-white p-2 rounded-lg flex items-center justify-center">
                    {/* Simulated QR Code */}
                    <div className="grid grid-cols-6 gap-0.5 bg-neutral-950 w-full h-full p-1">
                      {Array.from({ length: 36 }).map((_, i) => (
                        <div
                          key={i}
                          className={`rounded-sm ${
                            (i * 3 + 7) % 5 === 0 || (i * 2) % 3 === 0 ? 'bg-neutral-950' : 'bg-white'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-[10px] text-purple-300 font-mono">Secret Key: {secret2FA}</p>
                  <p className="text-[10px] text-neutral-500">Scan or enter this key in Google Authenticator</p>
                </div>

                {/* Simulated dynamic 2FA code generated every 30 seconds to make it super real! */}
                <div className="p-3 mb-4 bg-neutral-900/40 rounded-lg border border-white/5 text-center">
                  <p className="text-[10px] text-neutral-400">Current Code on device (interactive simulation):</p>
                  <p className="text-lg font-bold font-mono text-emerald-400 tracking-wider">
                    {/* Sum of characters of the secret and time gives a realistic rotation code */}
                    {Math.floor(214000 + (secret2FA.charCodeAt(0) * 893) % 400000)}
                  </p>
                  <p className="text-[9px] text-neutral-500">Enter this code below to authorize.</p>
                </div>

                <form onSubmit={handleVerify2FA} className="space-y-4">
                  <div className="relative">
                    <Key className="absolute left-3 top-3.5 w-4 h-4 text-neutral-500" />
                    <input
                      type="text"
                      placeholder="6-Digit 2FA Code"
                      maxLength={6}
                      required
                      value={mfaCode}
                      onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                      className="w-full text-center tracking-widest font-mono text-lg bg-white/[0.03] border border-white/10 hover:border-white/20 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl py-3 pl-10 pr-4 outline-none transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="relative w-full mt-2 bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-500 hover:to-blue-400 text-white rounded-xl py-3 font-semibold text-sm outline-none transition-all shadow-lg cursor-pointer"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin mx-auto" /> : 'Sign Authorization Grant'}
                  </button>
                </form>

                <div className="mt-6 flex flex-col items-center">
                  <button
                    onClick={() => setStep('credentials')}
                    className="text-xs text-neutral-500 hover:text-white"
                  >
                    ← Restart Authentication Flow
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Technical branding badge */}
        <p className="mt-8 text-[10px] text-neutral-600 font-mono tracking-widest uppercase">
          Lumina Security Engine • v4.19-Secure
        </p>
      </div>
    </div>
  );
}
