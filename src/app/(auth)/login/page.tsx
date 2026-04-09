"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Check for registration success message
  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      setSuccessMessage('Kayıt başarıyla oluşturuldu! Lütfen giriş yapın.');
      setTimeout(() => {
        setSuccessMessage("");
      }, 5000);
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: username, password }),
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok && data.message) {
        // Başarılı giriş sonrası session expired alert flag'ini temizle
        localStorage.removeItem('sessionExpiredAlertShown');
        
        if (process.env.NODE_ENV === "development") {
          setTimeout(() => {
            const cookies = document.cookie;
            if (!cookies.includes("token")) {
              console.warn("Dikkat! Token cookie'si set edilmedi. JWT_SECRET, domain veya secure flag ayarlarını kontrol edin.");
            } else {
              console.log("Token cookie başarıyla set edildi.");
            }
          }, 1000);
        }
        router.push("/dashboard");
      } else {
        setError("Giriş başarısız! Lütfen bilgilerinizi kontrol edin.");
        if (process.env.NODE_ENV === "development") {
          console.error("Login error:", data.error);
        }
      }
    } catch (err) {
      setError("Bir hata oluştu. Lütfen tekrar deneyin.");
      if (process.env.NODE_ENV === "development") {
        console.error("Login exception:", err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

        .login-page {
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
        .login-page::before {
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

        /* Floating orbs – very subtle */
        .login-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0;
          animation: orbFade 1.5s ease-out forwards;
        }

        .login-orb-1 {
          width: 300px;
          height: 300px;
          background: rgba(59, 130, 246, 0.12);
          top: 10%;
          right: 15%;
          animation-delay: 0.2s;
        }

        .login-orb-2 {
          width: 250px;
          height: 250px;
          background: rgba(139, 92, 246, 0.1);
          bottom: 15%;
          left: 10%;
          animation-delay: 0.5s;
        }

        .login-orb-3 {
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

        /* Grid pattern overlay */
        .login-grid {
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
          background-size: 60px 60px;
          pointer-events: none;
        }

        /* Main card */
        .login-card {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 420px;
          background: rgba(255, 255, 255, 0.04);
          backdrop-filter: blur(40px);
          -webkit-backdrop-filter: blur(40px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          padding: 2.5rem;
          opacity: 0;
          transform: translateY(20px);
          animation: cardEnter 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.3s forwards;
        }

        @keyframes cardEnter {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Logo area */
        .login-logo-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 2rem;
        }

        .login-logo-icon {
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

        .login-logo-icon::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(59,130,246,0.3), rgba(139,92,246,0.3));
          opacity: 0;
          transition: opacity 0.4s ease;
          border-radius: inherit;
        }

        .login-logo-icon:hover::after {
          opacity: 1;
        }

        .login-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #f1f5f9;
          letter-spacing: -0.02em;
          margin: 0 0 0.25rem 0;
        }

        .login-subtitle {
          font-size: 0.875rem;
          color: rgba(148, 163, 184, 0.8);
          margin: 0;
          font-weight: 400;
        }

        /* Form */
        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        /* Input group with floating label */
        .login-input-group {
          position: relative;
        }

        .login-label {
          display: block;
          font-size: 0.8125rem;
          font-weight: 500;
          color: rgba(203, 213, 225, 0.7);
          margin-bottom: 0.5rem;
          transition: color 0.3s ease;
        }

        .login-input-wrap {
          position: relative;
        }

        .login-input-icon {
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

        .login-input {
          width: 100%;
          padding: 0.8rem 1rem 0.8rem 2.75rem;
          background: rgba(255, 255, 255, 0.04);
          border: 1.5px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          color: #f1f5f9;
          font-size: 0.9rem;
          font-family: 'Inter', sans-serif;
          outline: none;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .login-input::placeholder {
          color: rgba(148, 163, 184, 0.4);
        }

        .login-input:focus {
          border-color: rgba(59, 130, 246, 0.5);
          background: rgba(255, 255, 255, 0.06);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .login-input:focus + .login-input-focus-line,
        .login-input:focus ~ .login-input-icon {
          color: rgba(59, 130, 246, 0.8);
        }

        .login-input-group:focus-within .login-label {
          color: rgba(59, 130, 246, 0.8);
        }

        .login-input-group:focus-within .login-input-icon {
          color: rgba(59, 130, 246, 0.8);
        }

        /* Password toggle */
        .login-pw-toggle {
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

        .login-pw-toggle:hover {
          color: rgba(203, 213, 225, 0.9);
          background: rgba(255, 255, 255, 0.06);
        }

        /* Submit button */
        .login-btn {
          width: 100%;
          padding: 0.85rem 1.5rem;
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
          margin-top: 0.5rem;
        }

        .login-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, #2563eb, #4f46e5);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .login-btn:hover::before {
          opacity: 1;
        }

        .login-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3);
        }

        .login-btn:active {
          transform: translateY(0);
        }

        .login-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .login-btn:disabled:hover {
          box-shadow: none;
          transform: none;
        }

        .login-btn:disabled::before {
          display: none;
        }

        .login-btn-content {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        /* Spinner */
        .login-spinner {
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

        /* Messages */
        .login-msg {
          padding: 0.75rem 1rem;
          border-radius: 10px;
          font-size: 0.8125rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          animation: msgSlide 0.3s ease-out;
        }

        @keyframes msgSlide {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .login-msg-success {
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.2);
          color: #6ee7b7;
        }

        .login-msg-error {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #fca5a5;
        }

        /* Footer link */
        .login-footer {
          text-align: center;
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }

        .login-footer p {
          font-size: 0.8125rem;
          color: rgba(148, 163, 184, 0.6);
          margin: 0;
        }

        .login-footer a {
          color: #60a5fa;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s ease;
        }

        .login-footer a:hover {
          color: #93bbfc;
        }

        /* Divider with text */
        .login-divider {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin: 0.25rem 0;
        }

        .login-divider::before,
        .login-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: rgba(255, 255, 255, 0.06);
        }

        .login-divider span {
          font-size: 0.75rem;
          color: rgba(148, 163, 184, 0.4);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        /* Responsive */
        @media (max-width: 480px) {
          .login-card {
            padding: 2rem 1.5rem;
            border-radius: 20px;
            margin: 0.5rem;
          }

          .login-title {
            font-size: 1.3rem;
          }
        }

        /* Stagger animation for form fields */
        .login-stagger-1 { opacity: 0; animation: staggerIn 0.5s ease-out 0.5s forwards; }
        .login-stagger-2 { opacity: 0; animation: staggerIn 0.5s ease-out 0.6s forwards; }
        .login-stagger-3 { opacity: 0; animation: staggerIn 0.5s ease-out 0.7s forwards; }
        .login-stagger-4 { opacity: 0; animation: staggerIn 0.5s ease-out 0.8s forwards; }
        .login-stagger-5 { opacity: 0; animation: staggerIn 0.5s ease-out 0.9s forwards; }

        @keyframes staggerIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="login-page">
        {/* Background elements */}
        <div className="login-grid" />
        <div className="login-orb login-orb-1" />
        <div className="login-orb login-orb-2" />
        <div className="login-orb login-orb-3" />

        {/* Card */}
        <div className="login-card">
          {/* Logo & Title */}
          <div className="login-logo-wrap login-stagger-1">
            <div className="login-logo-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="url(#loginGrad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <defs>
                  <linearGradient id="loginGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#60a5fa" />
                    <stop offset="100%" stopColor="#a78bfa" />
                  </linearGradient>
                </defs>
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <h1 className="login-title">TrackINN</h1>
            <p className="login-subtitle">Konaklama Yönetim Sistemi</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="login-form">
            {/* Username */}
            <div className="login-input-group login-stagger-2">
              <label htmlFor="username" className="login-label">
                Kullanıcı Adı
              </label>
              <div className="login-input-wrap">
                <input
                  id="username"
                  type="text"
                  className="login-input"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="E-posta adresinizi girin"
                  autoFocus
                  autoComplete="username"
                />
                <span className="login-input-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
              </div>
            </div>

            {/* Password */}
            <div className="login-input-group login-stagger-3">
              <label htmlFor="password" className="login-label">
                Şifre
              </label>
              <div className="login-input-wrap">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="login-input"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Şifrenizi girin"
                  autoComplete="current-password"
                  style={{ paddingRight: '2.75rem' }}
                />
                <span className="login-input-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="login-pw-toggle"
                  aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                  title={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
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

            {/* Messages */}
            {successMessage && (
              <div className="login-msg login-msg-success">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                {successMessage}
              </div>
            )}

            {error && (
              <div className="login-msg login-msg-error">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                {error}
              </div>
            )}

            {/* Submit */}
            <div className="login-stagger-4">
              <button
                type="submit"
                disabled={isLoading}
                className="login-btn"
              >
                <span className="login-btn-content">
                  {isLoading ? (
                    <>
                      <div className="login-spinner" />
                      <span>Giriş yapılıyor...</span>
                    </>
                  ) : (
                    <>
                      <span>Giriş Yap</span>
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
            <div className="login-footer login-stagger-5">
              <p>
                Hesabınız yok mu?{" "}
                <Link href="/register">
                  Kayıt olun
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0e1a',
        color: 'rgba(241,245,249,0.6)',
        fontFamily: 'Inter, sans-serif',
        fontSize: '0.9rem',
      }}>
        Yükleniyor...
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}