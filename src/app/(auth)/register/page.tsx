"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    companyName: "",
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const validateForm = () => {
    if (!formData.companyName.trim()) {
      setError("Şirket adı zorunludur.");
      return false;
    }
    if (!formData.email.trim()) {
      setError("Email adresi zorunludur.");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("Geçerli bir email adresi giriniz.");
      return false;
    }
    if (!formData.name.trim()) {
      setError("Ad Soyad zorunludur.");
      return false;
    }
    if (!formData.password) {
      setError("Şifre zorunludur.");
      return false;
    }
    if (formData.password.length < 6) {
      setError("Şifre en az 6 karakter olmalıdır.");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Şifreler eşleşmiyor.");
      return false;
    }
    return true;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: {
            name: formData.companyName,
            email: formData.email,
          },
          user: {
            name: formData.name,
            email: formData.email,
            password: formData.password,
          },
        }),
        credentials: "include",
      });

      const data = await res.json();
      
      if (res.ok && data.message) {
        // Başarılı kayıt sonrası login sayfasına yönlendir
        router.push("/login?registered=true");
      } else {
        setError(data.error || "Kayıt başarısız! Lütfen bilgilerinizi kontrol edin.");
        if (process.env.NODE_ENV === "development") {
          console.error("Register error:", data.error);
        }
      }
    } catch (err) {
      setError("Bir hata oluştu. Lütfen tekrar deneyin.");
      if (process.env.NODE_ENV === "development") {
        console.error("Register exception:", err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

        .register-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          font-family: 'Inter', sans-serif;
          background: #0a0e1a;
          position: relative;
          overflow: hidden;
        }

        /* Subtle mesh gradient background */
        .register-page::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: 
            radial-gradient(ellipse at 20% 50%, rgba(59, 130, 246, 0.08) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 20%, rgba(139, 92, 246, 0.06) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 80%, rgba(6, 182, 212, 0.05) 0%, transparent 50%);
          animation: meshMove 20s ease-in-out infinite alternate;
        }

        @keyframes meshMove {
          0% { transform: translate(0, 0) rotate(0deg); }
          100% { transform: translate(-2%, -1%) rotate(2deg); }
        }

        /* Floating orbs */
        .reg-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0;
          animation: orbFade 1.5s ease-out forwards;
        }

        .reg-orb-1 {
          width: 300px;
          height: 300px;
          background: rgba(59, 130, 246, 0.12);
          top: 10%;
          right: 15%;
          animation-delay: 0.2s;
        }

        .reg-orb-2 {
          width: 250px;
          height: 250px;
          background: rgba(139, 92, 246, 0.1);
          bottom: 15%;
          left: 10%;
          animation-delay: 0.5s;
        }

        .reg-orb-3 {
          width: 200px;
          height: 200px;
          background: rgba(6, 182, 212, 0.08);
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation-delay: 0.8s;
        }

        @keyframes orbFade {
          to { opacity: 1; }
        }

        /* Grid pattern */
        .reg-grid {
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
          background-size: 60px 60px;
          pointer-events: none;
        }

        /* Main card */
        .reg-card {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 440px;
          max-height: 92vh;
          overflow-y: auto;
          background: rgba(255, 255, 255, 0.04);
          backdrop-filter: blur(40px);
          -webkit-backdrop-filter: blur(40px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          padding: 2.25rem;
          opacity: 0;
          transform: translateY(20px);
          animation: cardEnter 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.3s forwards;
        }

        /* Custom scrollbar for card */
        .reg-card::-webkit-scrollbar {
          width: 4px;
        }
        .reg-card::-webkit-scrollbar-track {
          background: transparent;
        }
        .reg-card::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 4px;
        }

        @keyframes cardEnter {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Logo area */
        .reg-logo-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 1.75rem;
        }

        .reg-logo-icon {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.2));
          border: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.25rem;
          position: relative;
          overflow: hidden;
        }

        .reg-logo-icon::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(59,130,246,0.3), rgba(139,92,246,0.3));
          opacity: 0;
          transition: opacity 0.4s ease;
          border-radius: inherit;
        }

        .reg-logo-icon:hover::after {
          opacity: 1;
        }

        .reg-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #f1f5f9;
          letter-spacing: -0.02em;
          margin: 0 0 0.25rem 0;
        }

        .reg-subtitle {
          font-size: 0.875rem;
          color: rgba(148, 163, 184, 0.8);
          margin: 0;
          font-weight: 400;
        }

        /* Form */
        .reg-form {
          display: flex;
          flex-direction: column;
          gap: 1.1rem;
        }

        /* Input group */
        .reg-input-group {
          position: relative;
        }

        .reg-label {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.8125rem;
          font-weight: 500;
          color: rgba(203, 213, 225, 0.7);
          margin-bottom: 0.5rem;
          transition: color 0.3s ease;
        }

        .reg-label-req {
          color: rgba(251, 113, 133, 0.7);
          font-size: 0.75rem;
        }

        .reg-input-wrap {
          position: relative;
        }

        .reg-input-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: rgba(148, 163, 184, 0.5);
          transition: color 0.3s ease;
          pointer-events: none;
          display: flex;
          align-items: center;
        }

        .reg-input {
          width: 100%;
          padding: 0.75rem 1rem 0.75rem 2.75rem;
          background: rgba(255, 255, 255, 0.04);
          border: 1.5px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          color: #f1f5f9;
          font-size: 0.875rem;
          font-family: 'Inter', sans-serif;
          outline: none;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .reg-input::placeholder {
          color: rgba(148, 163, 184, 0.4);
        }

        .reg-input:focus {
          border-color: rgba(59, 130, 246, 0.5);
          background: rgba(255, 255, 255, 0.06);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .reg-input-group:focus-within .reg-label {
          color: rgba(59, 130, 246, 0.8);
        }

        .reg-input-group:focus-within .reg-input-icon {
          color: rgba(59, 130, 246, 0.8);
        }

        /* Password toggle */
        .reg-pw-toggle {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: rgba(148, 163, 184, 0.5);
          cursor: pointer;
          padding: 4px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .reg-pw-toggle:hover {
          color: rgba(203, 213, 225, 0.9);
          background: rgba(255, 255, 255, 0.06);
        }

        /* Submit button */
        .reg-btn {
          width: 100%;
          padding: 0.8rem 1.5rem;
          border: none;
          border-radius: 12px;
          font-size: 0.9rem;
          font-weight: 600;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          color: white;
          background: linear-gradient(135deg, #3b82f6, #6366f1);
          position: relative;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          margin-top: 0.25rem;
        }

        .reg-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, #2563eb, #4f46e5);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .reg-btn:hover::before {
          opacity: 1;
        }

        .reg-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3);
        }

        .reg-btn:active {
          transform: translateY(0);
        }

        .reg-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .reg-btn:disabled:hover {
          box-shadow: none;
          transform: none;
        }

        .reg-btn:disabled::before {
          display: none;
        }

        .reg-btn-content {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        /* Spinner */
        .reg-spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Error message */
        .reg-msg-error {
          padding: 0.75rem 1rem;
          border-radius: 10px;
          font-size: 0.8125rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #fca5a5;
          animation: msgSlide 0.3s ease-out;
        }

        @keyframes msgSlide {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Footer */
        .reg-footer {
          text-align: center;
          margin-top: 1.25rem;
          padding-top: 1.25rem;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }

        .reg-footer p {
          font-size: 0.8125rem;
          color: rgba(148, 163, 184, 0.6);
          margin: 0;
        }

        .reg-footer a {
          color: #60a5fa;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s ease;
        }

        .reg-footer a:hover {
          color: #93bbfc;
        }

        /* Responsive */
        @media (max-width: 480px) {
          .reg-card {
            padding: 1.75rem 1.5rem;
            border-radius: 20px;
            margin: 0.5rem;
          }
          .reg-title {
            font-size: 1.3rem;
          }
        }

        /* Stagger animation */
        .reg-stagger-1 { opacity: 0; animation: staggerIn 0.5s ease-out 0.5s forwards; }
        .reg-stagger-2 { opacity: 0; animation: staggerIn 0.5s ease-out 0.55s forwards; }
        .reg-stagger-3 { opacity: 0; animation: staggerIn 0.5s ease-out 0.6s forwards; }
        .reg-stagger-4 { opacity: 0; animation: staggerIn 0.5s ease-out 0.65s forwards; }
        .reg-stagger-5 { opacity: 0; animation: staggerIn 0.5s ease-out 0.7s forwards; }
        .reg-stagger-6 { opacity: 0; animation: staggerIn 0.5s ease-out 0.75s forwards; }
        .reg-stagger-7 { opacity: 0; animation: staggerIn 0.5s ease-out 0.8s forwards; }
        .reg-stagger-8 { opacity: 0; animation: staggerIn 0.5s ease-out 0.85s forwards; }

        @keyframes staggerIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="register-page">
        {/* Background */}
        <div className="reg-grid" />
        <div className="reg-orb reg-orb-1" />
        <div className="reg-orb reg-orb-2" />
        <div className="reg-orb reg-orb-3" />

        {/* Card */}
        <div className="reg-card">
          {/* Logo & Title */}
          <div className="reg-logo-wrap reg-stagger-1">
            <div className="reg-logo-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="url(#regGrad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <defs>
                  <linearGradient id="regGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#60a5fa" />
                    <stop offset="100%" stopColor="#a78bfa" />
                  </linearGradient>
                </defs>
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <line x1="20" y1="8" x2="20" y2="14" />
                <line x1="23" y1="11" x2="17" y2="11" />
              </svg>
            </div>
            <h1 className="reg-title">TrackINN</h1>
            <p className="reg-subtitle">Yeni hesap oluşturun</p>
          </div>

          {/* Form */}
          <form onSubmit={handleRegister} className="reg-form">
            {/* Company Name */}
            <div className="reg-input-group reg-stagger-2">
              <label htmlFor="companyName" className="reg-label">
                Şirket Adı <span className="reg-label-req">*</span>
              </label>
              <div className="reg-input-wrap">
                <input
                  id="companyName"
                  name="companyName"
                  type="text"
                  className="reg-input"
                  value={formData.companyName}
                  onChange={handleChange}
                  placeholder="Şirket adınızı girin"
                  required
                />
                <span className="reg-input-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                </span>
              </div>
            </div>

            {/* Full Name */}
            <div className="reg-input-group reg-stagger-3">
              <label htmlFor="name" className="reg-label">
                Ad Soyad <span className="reg-label-req">*</span>
              </label>
              <div className="reg-input-wrap">
                <input
                  id="name"
                  name="name"
                  type="text"
                  className="reg-input"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Adınızı ve soyadınızı girin"
                  required
                />
                <span className="reg-input-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
              </div>
            </div>

            {/* Email */}
            <div className="reg-input-group reg-stagger-4">
              <label htmlFor="email" className="reg-label">
                Email <span className="reg-label-req">*</span>
              </label>
              <div className="reg-input-wrap">
                <input
                  id="email"
                  name="email"
                  type="email"
                  className="reg-input"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="ornek@example.com"
                  required
                />
                <span className="reg-input-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </span>
              </div>
            </div>

            {/* Password */}
            <div className="reg-input-group reg-stagger-5">
              <label htmlFor="password" className="reg-label">
                Şifre <span className="reg-label-req">*</span>
              </label>
              <div className="reg-input-wrap">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  className="reg-input"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="En az 6 karakter"
                  required
                  minLength={6}
                  style={{ paddingRight: '2.75rem' }}
                />
                <span className="reg-input-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="reg-pw-toggle"
                  aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="reg-input-group reg-stagger-6">
              <label htmlFor="confirmPassword" className="reg-label">
                Şifre Tekrar <span className="reg-label-req">*</span>
              </label>
              <div className="reg-input-wrap">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  className="reg-input"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Şifrenizi tekrar girin"
                  required
                  minLength={6}
                  style={{ paddingRight: '2.75rem' }}
                />
                <span className="reg-input-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </span>
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="reg-pw-toggle"
                  aria-label={showConfirmPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                >
                  {showConfirmPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="reg-msg-error">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                {error}
              </div>
            )}

            {/* Submit */}
            <div className="reg-stagger-7">
              <button
                type="submit"
                disabled={isLoading}
                className="reg-btn"
              >
                <span className="reg-btn-content">
                  {isLoading ? (
                    <>
                      <div className="reg-spinner" />
                      <span>Kayıt oluşturuluyor...</span>
                    </>
                  ) : (
                    <>
                      <span>Hesap Oluştur</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </>
                  )}
                </span>
              </button>
            </div>

            {/* Footer */}
            <div className="reg-footer reg-stagger-8">
              <p>
                Zaten hesabınız var mı?{" "}
                <Link href="/login">
                  Giriş yapın
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
