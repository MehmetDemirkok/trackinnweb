"use client";
import { useState, useEffect } from "react";
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
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const router = useRouter();

  // Floating particles effect
  useEffect(() => {
    const createParticle = () => {
      const particle = document.createElement('div');
      particle.className = 'floating-particle';
      particle.style.left = Math.random() * 100 + '%';
      particle.style.animationDuration = (Math.random() * 3 + 2) + 's';
      particle.style.animationDelay = Math.random() * 2 + 's';
      document.querySelector('.particles-container')?.appendChild(particle);
      
      setTimeout(() => {
        particle.remove();
      }, 5000);
    };

    const interval = setInterval(createParticle, 300);
    return () => clearInterval(interval);
  }, []);

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
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 animate-gradient">
      {/* Animated background shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>
      {/* Floating particles */}
      <div className="particles-container absolute inset-0 pointer-events-none">
        <style jsx>{`
          .floating-particle {
            position: absolute;
            width: 4px;
            height: 4px;
            background: rgba(255, 255, 255, 0.6);
            border-radius: 50%;
            animation: float-up 5s linear infinite;
            pointer-events: none;
          }
          
          @keyframes float-up {
            0% {
              transform: translateY(100vh) scale(0);
              opacity: 0;
            }
            10% {
              opacity: 1;
            }
            90% {
              opacity: 1;
            }
            100% {
              transform: translateY(-100px) scale(1);
              opacity: 0;
            }
          }
          
          .animate-gradient {
            background-size: 400% 400%;
            animation: gradient-shift 8s ease infinite;
          }
          
          @keyframes gradient-shift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          
          .glass-card {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            box-shadow: 0 25px 45px rgba(0, 0, 0, 0.1);
          }
          
          .input-field {
            background: rgba(255, 255, 255, 0.1);
            border: 2px solid rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(10px);
            transition: all 0.3s ease;
          }
          
          .input-field:focus {
            border-color: rgba(255, 255, 255, 0.8);
            box-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
            transform: translateY(-2px);
            background: rgba(255, 255, 255, 0.15);
          }
          
          .input-field.focused {
            border-color: rgba(255, 255, 255, 0.8);
            box-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
            background: rgba(255, 255, 255, 0.15);
          }
          
          .input-field::placeholder {
            color: rgba(255, 255, 255, 0.6);
            transition: color 0.3s ease;
          }
          
          .input-field:focus::placeholder {
            color: rgba(255, 255, 255, 0.8);
          }
          
          .register-button {
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1));
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.3);
            transition: all 0.3s ease;
          }
          
          .register-button:hover {
            transform: translateY(-3px);
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.2));
          }
          
          .register-button:active {
            transform: translateY(-1px);
          }
          
          .icon-container {
            animation: icon-float 3s ease-in-out infinite;
          }
          
          @keyframes icon-float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }
          
          .title-glow {
            text-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
          }
          
          .password-toggle {
            transition: all 0.3s ease;
          }
          
          .password-toggle:hover {
            transform: scale(1.1);
          }
          
          .password-toggle:active {
            transform: scale(0.95);
          }
        `}</style>
      </div>

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 py-8">
        <div className="glass-card p-8 w-full max-w-md rounded-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
          <div className="flex flex-col items-center mb-6">
            <div className="icon-container w-20 h-20 bg-gradient-to-r from-white/30 to-white/20 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm border border-white/20">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h1 className="text-3xl font-medium text-white mb-2 title-glow">TrackINN APP</h1>
            <p className="text-white text-sm">Yeni hesap oluşturun</p>
          </div>
          
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-white mb-2">
                    Şirket Adı <span className="text-red-300">*</span>
                  </label>
                  <input
                    id="companyName"
                    name="companyName"
                    type="text"
                    className={`input-field w-full px-4 py-3 rounded-xl text-white placeholder-white/60 focus:outline-none transition-all duration-300 ${
                      focusedField === 'companyName' ? 'focused' : ''
                    }`}
                    value={formData.companyName}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('companyName')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Şirket adınızı girin"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-white mb-2">
                    Ad Soyad <span className="text-red-300">*</span>
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    className={`input-field w-full px-4 py-3 rounded-xl text-white placeholder-white/60 focus:outline-none transition-all duration-300 ${
                      focusedField === 'name' ? 'focused' : ''
                    }`}
                    value={formData.name}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Adınızı ve soyadınızı girin"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                    Email <span className="text-red-300">*</span>
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    className={`input-field w-full px-4 py-3 rounded-xl text-white placeholder-white/60 focus:outline-none transition-all duration-300 ${
                      focusedField === 'email' ? 'focused' : ''
                    }`}
                    value={formData.email}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="ornek@example.com"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
                    Şifre <span className="text-red-300">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      className={`input-field w-full px-4 py-3 pr-12 rounded-xl text-white placeholder-white/60 focus:outline-none transition-all duration-300 ${
                        focusedField === 'password' ? 'focused' : ''
                      }`}
                      value={formData.password}
                      onChange={handleChange}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="En az 6 karakter"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="password-toggle absolute right-3 top-1/2 transform -translate-y-1/2 p-2 text-white/60 hover:text-white/90 hover:bg-white/10 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/20"
                      aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-white mb-2">
                    Şifre Tekrar <span className="text-red-300">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      className={`input-field w-full px-4 py-3 pr-12 rounded-xl text-white placeholder-white/60 focus:outline-none transition-all duration-300 ${
                        focusedField === 'confirmPassword' ? 'focused' : ''
                      }`}
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      onFocus={() => setFocusedField('confirmPassword')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Şifrenizi tekrar girin"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="password-toggle absolute right-3 top-1/2 transform -translate-y-1/2 p-2 text-white/60 hover:text-white/90 hover:bg-white/10 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/20"
                      aria-label={showConfirmPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                    >
                      {showConfirmPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {error && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-3 text-red-200 text-sm font-medium animate-fade-in backdrop-blur-sm">
                {error}
              </div>
            )}
            
            <button 
              type="submit" 
              disabled={isLoading}
              className={`register-button w-full py-3 rounded-xl text-white font-medium text-lg transition-all duration-300 relative overflow-hidden ${
                isLoading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
              onClick={(e) => {
                if (!isLoading) {
                  const button = e.currentTarget;
                  const ripple = document.createElement('span');
                  const rect = button.getBoundingClientRect();
                  const size = Math.max(rect.width, rect.height);
                  const x = e.clientX - rect.left - size / 2;
                  const y = e.clientY - rect.top - size / 2;
                  
                  ripple.style.width = ripple.style.height = size + 'px';
                  ripple.style.left = x + 'px';
                  ripple.style.top = y + 'px';
                  ripple.className = 'absolute bg-white/20 rounded-full animate-ripple';
                  
                  button.appendChild(ripple);
                  
                  setTimeout(() => {
                    ripple.remove();
                  }, 600);
                }
              }}
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Kayıt oluşturuluyor...</span>
                </div>
              ) : (
                'Hesap Oluştur'
              )}
            </button>

            <div className="text-center mt-4">
              <p className="text-white text-sm">
                Zaten hesabınız var mı?{" "}
                <Link href="/login" className="text-white font-medium hover:text-white/80 underline transition-colors">
                  Giriş yapın
                </Link>
              </p>
            </div>
          </form>
          
          {/* Decorative elements */}
          <div className="mt-6 flex justify-center space-x-4">
            <div className="w-2 h-2 bg-white/40 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-white/40 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
            <div className="w-2 h-2 bg-white/40 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
          </div>
        </div>
      </div>
    </div>
  );
}

