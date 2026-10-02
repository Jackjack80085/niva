import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { DOCTOR_INFO } from '../../data/initialData';
import { 
  ShieldCheck, 
  ArrowLeft, 
  Lock, 
  CheckCircle2, 
  AlertCircle,
  Delete
} from 'lucide-react';
import { motion } from 'framer-motion';
import { fadeInUp, fadeInScale } from '../../utils/motionVariants';

export const AdminPortalPage: React.FC = () => {
  const { setActiveView, addToast, verifyAdminPasscode, isAdminAuthenticated } = useApp();
  const [pinCode, setPinCode] = useState('');
  const [pinError, setPinError] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!isSuccess || !isAdminAuthenticated) return;
    const timer = window.setTimeout(() => setActiveView('admin'), 500);
    return () => window.clearTimeout(timer);
  }, [isSuccess, isAdminAuthenticated, setActiveView]);

  const handleDigitPress = (digit: string) => {
    if (pinCode.length < 4) {
      const nextPin = pinCode + digit;
      setPinCode(nextPin);
      if (nextPin.length === 4) {
        verifyPin(nextPin);
      }
    }
  };

  const handleBackspace = () => {
    setPinCode((prev) => prev.slice(0, -1));
    setPinError(false);
  };

  const handleClear = () => {
    setPinCode('');
    setPinError(false);
  };

  const verifyPin = (codeToVerify: string) => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      const ok = verifyAdminPasscode(codeToVerify);
      if (ok) {
        setIsSuccess(true);
        addToast({
          title: 'Passcode Verified',
          message: `Identity confirmed. Welcome to Dr. Niva Jacob's clinical dashboard.`,
          type: 'success',
        });
      } else {
        setPinError(true);
        setPinCode('');
      }
    }, 400);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinCode.length > 0) {
      verifyPin(pinCode);
    }
  };

  const handleAutofillDemo = () => {
    setPinCode('2026');
    verifyPin('2026');
  };

  return (
    <div className="min-h-screen bg-[#FAF7F0] text-[#332B27] flex flex-col justify-between texture-paper relative overflow-hidden font-sans-clean">
      
      {/* Background ambient accents in warm butter & ivory */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#F1E3A6]/20 rounded-full blur-3xl pointer-events-none -mt-20" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-[#B89552]/10 rounded-full blur-3xl pointer-events-none -mb-20" />

      {/* Top Header */}
      <header className="border-b border-[#332B27]/10 bg-white/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => setActiveView('patient-home')}
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#332B27]/70 hover:text-[#332B27] transition-colors py-2 px-3 rounded-lg hover:bg-[#FAF7F0] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Patient Website</span>
          </button>

          <span className="text-xs text-[#332B27]/50 font-mono-tabular">
            Authorized Personnel
          </span>
        </div>
      </header>

      {/* Center Passcode Authentication Box */}
      <main className="flex-1 max-w-md mx-auto px-6 py-12 flex flex-col justify-center relative z-10 w-full">
        
        <motion.div 
          className="text-center mb-6"
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
        >
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#F1E3A6] text-[#332B27] mb-3 shadow-xs border border-[#B89552]/30">
            <Lock className="w-5 h-5 text-[#332B27]" />
          </div>
          <h1 className="font-editorial text-3xl text-[#332B27] font-medium tracking-tight">
            Clinical Portal Access
          </h1>
          <p className="mt-1 text-xs text-[#332B27]/60 font-sans-clean">
            Enter PIN to unlock patient records and schedule.
          </p>
        </motion.div>

        {/* Passcode Card */}
        <motion.div 
          className={`bg-white rounded-3xl border shadow-lg shadow-[#332B27]/5 p-6 sm:p-8 transition-all ${
            pinError ? 'border-red-400 animate-shake' : 'border-[#332B27]/10'
          }`}
          initial="hidden"
          animate="visible"
          variants={fadeInScale}
        >
          {/* Doctor Badge */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#FAF7F0] border border-[#332B27]/10 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#F1E3A6] overflow-hidden shrink-0 border border-[#332B27]/10">
              <img
                src={DOCTOR_INFO.portraitImage}
                alt={DOCTOR_INFO.name}
                className="w-full h-full object-cover object-top"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-xs text-[#332B27] truncate font-sans-clean">
                {DOCTOR_INFO.name}
              </p>
              <p className="text-[11px] text-[#332B27]/50 truncate">
                Clinical Psychiatrist & Psychotherapist
              </p>
            </div>
          </div>

          {/* PIN Dots Indicator */}
          <div className="flex items-center justify-center gap-4 py-4 mb-4">
            {[0, 1, 2, 3].map((idx) => {
              const isFilled = pinCode.length > idx;
              return (
                <div
                  key={idx}
                  className={`w-4 h-4 rounded-full transition-all duration-200 ${
                    isSuccess
                      ? 'bg-emerald-600 scale-110'
                      : isFilled
                      ? 'bg-[#332B27] scale-110 shadow-xs'
                      : 'border-2 border-[#332B27]/20 bg-[#FAF7F0]'
                  }`}
                />
              );
            })}
          </div>

          {/* Direct Input Field */}
          <form onSubmit={handleFormSubmit} className="mb-6">
            <div className="relative">
              <input
                type="password"
                maxLength={4}
                value={pinCode}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                  setPinCode(val);
                  setPinError(false);
                  if (val.length === 4) {
                    verifyPin(val);
                  }
                }}
                placeholder="••••"
                className="w-full text-center py-2.5 px-4 bg-[#FAF7F0] border border-[#332B27]/15 rounded-xl text-lg font-mono-tabular tracking-widest text-[#332B27] focus:outline-none focus:border-[#B89552] focus:bg-white transition-colors"
                autoFocus
              />
            </div>

            {/* Error Message */}
            {pinError && (
              <motion.div 
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2.5 p-2 rounded-xl bg-red-50 border border-red-200 text-[11px] text-red-700 flex items-center gap-1.5"
              >
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Incorrect passcode. Please enter 2026.</span>
              </motion.div>
            )}
          </form>

          {/* Interactive Numerical Keypad */}
          <div className="grid grid-cols-3 gap-2.5 mb-6">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handleDigitPress(digit)}
                className="h-12 rounded-xl bg-[#FAF7F0] hover:bg-[#F1E3A6]/40 border border-[#332B27]/10 hover:border-[#B89552]/40 text-base font-semibold text-[#332B27] transition-all active:scale-95 flex items-center justify-center font-mono-tabular cursor-pointer"
              >
                {digit}
              </button>
            ))}

            <button
              type="button"
              onClick={handleClear}
              className="h-12 rounded-xl bg-[#F5EFEB] hover:bg-[#FAF7F0] border border-[#332B27]/10 text-xs font-semibold text-[#332B27]/70 transition-all active:scale-95 flex items-center justify-center uppercase tracking-wider cursor-pointer"
            >
              Clear
            </button>

            <button
              type="button"
              onClick={() => handleDigitPress('0')}
              className="h-12 rounded-xl bg-[#FAF7F0] hover:bg-[#F1E3A6]/40 border border-[#332B27]/10 hover:border-[#B89552]/40 text-base font-semibold text-[#332B27] transition-all active:scale-95 flex items-center justify-center font-mono-tabular cursor-pointer"
            >
              0
            </button>

            <button
              type="button"
              onClick={handleBackspace}
              className="h-12 rounded-xl bg-[#F5EFEB] hover:bg-[#FAF7F0] border border-[#332B27]/10 text-[#332B27]/70 transition-all active:scale-95 flex items-center justify-center cursor-pointer"
              title="Delete digit"
            >
              <Delete className="w-4 h-4" />
            </button>
          </div>

          {/* Verify Button */}
          <button
            type="button"
            disabled={isVerifying || pinCode.length === 0}
            onClick={() => verifyPin(pinCode)}
            className="w-full py-3 rounded-full bg-[#332B27] text-[#FAF7F0] text-xs font-semibold hover:bg-[#27201D] disabled:opacity-50 transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            {isVerifying ? (
              <span>Authenticating...</span>
            ) : isSuccess ? (
              <span className="flex items-center gap-1.5 text-[#F1E3A6]">
                <CheckCircle2 className="w-4 h-4" />
                <span>Verified · Entering Dashboard</span>
              </span>
            ) : (
              <span>Unlock Clinical Dashboard</span>
            )}
          </button>

          {/* Quick Demo Helper */}
          <div className="mt-5 pt-4 border-t border-[#332B27]/10 flex items-center justify-between text-[11px] text-[#332B27]/60 font-sans-clean">
            <span>Clinical Passcode: <strong className="font-mono-tabular text-[#332B27]">2026</strong></span>
            <button
              type="button"
              onClick={handleAutofillDemo}
              className="text-[#B89552] hover:text-[#332B27] font-semibold underline underline-offset-2 cursor-pointer"
            >
              Auto-fill PIN
            </button>
          </div>

        </motion.div>

        {/* Security Notice */}
        <div className="mt-6 text-center text-[11px] text-[#332B27]/50 font-sans-clean flex items-center justify-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-[#B89552]" />
          <span>Passcode-verified HIPAA & Telehealth compliance</span>
        </div>

      </main>

      {/* Footer */}
      <footer className="py-4 border-t border-[#332B27]/10 text-center text-xs text-[#332B27]/50 font-sans-clean">
        <p>© {new Date().getFullYear()} {DOCTOR_INFO.name} Practice Management System. Confidential.</p>
      </footer>

    </div>
  );
};
