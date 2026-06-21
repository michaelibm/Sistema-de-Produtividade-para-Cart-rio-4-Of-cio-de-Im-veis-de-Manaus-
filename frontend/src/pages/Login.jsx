import { useState } from 'react';
import { login } from '../services/api';
import '../styles/Login.css';


const BALLS = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  left:     `${Math.random() * 100}%`,
  delay:    `${Math.random() * 14}s`,
  duration: `${12 + Math.random() * 10}s`,
  size:     `${18 + Math.random() * 20}px`,
  opacity:  0.4 + Math.random() * 0.45,
  swing:    `${15 + Math.random() * 35}px`,
}));

function Ball({ left, delay, duration, size, opacity, swing }) {
  return (
    <div style={{
      position: 'fixed', left, top: '-50px',
      fontSize: size, opacity,
      animation: `ballFloat ${duration} ${delay} infinite ease-in-out`,
      pointerEvents: 'none', zIndex: 0, userSelect: 'none',
      '--swing': swing,
    }}>
      ⚽
    </div>
  );
}

function Login({ onLogin }) {
  const [email, setEmail]       = useState('');
  const [senha, setSenha]       = useState('');
  const [erro, setErro]         = useState('');
  const [carregando, setCarregando] = useState(false);
  const [fechou, setFechou]     = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro(''); setCarregando(true);
    try {
      const r = await login(email, senha);
      onLogin(r.token, r.usuario);
    } catch (err) {
      setErro(err.message || 'Erro ao fazer login');
    } finally { setCarregando(false); }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=DM+Sans:wght@300;400;500;600&display=swap');

        * { box-sizing: border-box; }

        @keyframes ballFloat {
          0%   { transform: translateY(-50px) translateX(0) rotate(0deg);   opacity: 0; }
          8%   { opacity: 1; }
          50%  { transform: translateY(48vh)  translateX(var(--swing, 25px)) rotate(200deg); }
          92%  { opacity: 0.6; }
          100% { transform: translateY(108vh) translateX(0) rotate(400deg); opacity: 0; }
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(32px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes shimmerCopa {
          0%   { background-position: -300% center; }
          100% { background-position: 300% center; }
        }

        @keyframes glowGreen {
          0%, 100% { box-shadow: 0 0 0 0 rgba(45,158,0,0.2), 0 0 30px rgba(10,80,0,0.2); }
          50%       { box-shadow: 0 0 0 14px rgba(45,158,0,0), 0 0 50px rgba(10,80,0,0.3); }
        }

        @keyframes trophyPulse {
          0%, 100% { transform: scale(1); }
          15%       { transform: scale(1.18); }
          30%       { transform: scale(1); }
          45%       { transform: scale(1.1); }
        }

        @keyframes ribbonIn {
          from { transform: translateY(-20px); opacity: 0; }
          to   { transform: translateY(0);     opacity: 1; }
        }

        @keyframes orbFloat {
          0%, 100% { transform: translateY(0) scale(1); }
          50%       { transform: translateY(-30px) scale(1.05); }
        }

        .dm-login-wrap {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          font-family: 'DM Sans', sans-serif;
          background:
            radial-gradient(ellipse at 20% 20%, rgba(20,100,0,0.45) 0%, transparent 55%),
            radial-gradient(ellipse at 80% 80%, rgba(30,120,0,0.35) 0%, transparent 55%),
            radial-gradient(ellipse at 50% 50%, rgba(10,60,0,0.5) 0%, transparent 70%),
            linear-gradient(160deg, #0a2800 0%, #1a4a00 35%, #0d3300 65%, #061800 100%);
        }

        /* Orbs decorativos verde/amarelo */
        .dm-orb {
          position: fixed;
          border-radius: 50%;
          pointer-events: none;
          z-index: 0;
          filter: blur(90px);
        }
        .dm-orb-1 {
          width: 560px; height: 560px;
          background: radial-gradient(circle, rgba(45,158,0,0.25) 0%, transparent 70%);
          top: -150px; left: -150px;
          animation: orbFloat 8s ease-in-out infinite;
        }
        .dm-orb-2 {
          width: 420px; height: 420px;
          background: radial-gradient(circle, rgba(245,197,24,0.15) 0%, transparent 70%);
          bottom: -100px; right: -100px;
          animation: orbFloat 10s ease-in-out infinite reverse;
        }
        .dm-orb-3 {
          width: 280px; height: 280px;
          background: radial-gradient(circle, rgba(0,48,135,0.18) 0%, transparent 70%);
          top: 45%; left: 65%;
          animation: orbFloat 7s ease-in-out infinite 2s;
        }

        /* Linha decorativa */
        .dm-gold-line {
          position: fixed;
          top: 0; bottom: 0;
          left: 50%;
          width: 1px;
          background: linear-gradient(180deg, transparent, rgba(245,197,24,0.07) 30%, rgba(245,197,24,0.11) 50%, rgba(245,197,24,0.07) 70%, transparent);
          pointer-events: none;
          z-index: 0;
        }

        .dm-card {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 430px;
          margin: 1.5rem;
          animation: fadeUp 0.75s cubic-bezier(0.22,1,0.36,1) both;
        }

        /* Banner Copa do Mundo */
        .dm-banner {
          border-radius: 20px 20px 0 0;
          padding: 1.5rem 1.75rem 1.25rem;
          text-align: center;
          position: relative;
          overflow: hidden;
          background: linear-gradient(
            135deg,
            #c8860a 0%, #e8a820 20%, #f5c518 40%,
            #ffe066 50%, #f5c518 60%, #e8a820 80%, #c8860a 100%
          );
          background-size: 300% auto;
          animation: ribbonIn 0.6s 0.3s ease both, shimmerCopa 5s linear infinite;
          border-bottom: 1px solid rgba(200,134,10,0.4);
        }
        .dm-banner::before {
          content: '';
          position: absolute; inset: 0;
          background:
            repeating-linear-gradient(
              45deg,
              transparent, transparent 12px,
              rgba(255,255,255,0.04) 12px,
              rgba(255,255,255,0.04) 24px
            );
        }
        .dm-banner::after {
          content: '';
          position: absolute;
          bottom: 0; left: 10%; right: 10%; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent);
        }

        .dm-trophy {
          font-size: 2rem;
          display: block;
          margin-bottom: 0.4rem;
          animation: trophyPulse 2.2s ease-in-out infinite;
          filter: drop-shadow(0 2px 12px rgba(200,134,10,0.6));
        }
        .dm-banner-title {
          font-family: 'Playfair Display', serif;
          font-size: 1.45rem;
          font-weight: 700;
          font-style: italic;
          color: #1a0e00;
          margin: 0 0 0.3rem;
          text-shadow: 0 1px 4px rgba(255,255,255,0.3);
          letter-spacing: 0.5px;
        }
        .dm-banner-quote {
          font-size: 0.8rem;
          color: rgba(40,20,0,0.85);
          margin: 0;
          font-weight: 600;
          line-height: 1.5;
          letter-spacing: 0.2px;
        }
        .dm-banner-flowers {
          font-size: 1.1rem;
          margin-top: 0.6rem;
          display: block;
          letter-spacing: 0.3rem;
          filter: drop-shadow(0 2px 6px rgba(200,134,10,0.5));
        }
        .dm-banner-close {
          position: absolute;
          top: 0.6rem; right: 0.75rem;
          background: rgba(0,0,0,0.12);
          border: 1px solid rgba(0,0,0,0.15);
          color: rgba(30,15,0,0.7);
          border-radius: 50%;
          width: 24px; height: 24px;
          font-size: 0.65rem;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s;
        }
        .dm-banner-close:hover {
          background: rgba(0,0,0,0.22);
          color: #1a0e00;
        }

        /* Card formulário */
        .dm-form-card {
          background: rgba(255,255,255,0.04);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255,255,255,0.07);
          border-top: none;
          border-radius: 0 0 22px 22px;
          padding: 2rem 2rem 1.5rem;
        }
        .dm-form-card.solo {
          border-radius: 22px;
          border-top: 1px solid rgba(255,255,255,0.07);
        }

        .dm-logo-area {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.875rem;
          margin-bottom: 1.5rem;
        }
        .dm-logo {
          width: 68px; height: 68px;
          object-fit: contain;
          border-radius: 16px;
          padding: 6px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(45,158,0,0.3);
          animation: glowGreen 4s ease-in-out infinite;
        }
        .dm-logo-title {
          font-family: 'Playfair Display', serif;
          font-size: 1.2rem;
          font-weight: 600;
          color: #e8f5d0;
          text-align: center;
          margin: 0;
          line-height: 1.3;
        }
        .dm-logo-sub {
          font-size: 0.72rem;
          color: rgba(255,255,255,0.35);
          text-align: center;
          margin: 0.15rem 0 0;
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        .dm-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(45,158,0,0.45), transparent);
          margin: 0 0 1.5rem;
        }

        .dm-label {
          display: block;
          font-size: 0.72rem;
          font-weight: 600;
          color: rgba(200,240,180,0.45);
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 0.4rem;
        }
        .dm-input {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          padding: 0.8rem 1rem;
          color: #e8f5d0;
          font-size: 0.9rem;
          font-family: 'DM Sans', sans-serif;
          outline: none;
          transition: border-color 0.25s, background 0.25s, box-shadow 0.25s;
          margin-bottom: 1rem;
        }
        .dm-input::placeholder { color: rgba(255,255,255,0.18); }
        .dm-input:focus {
          border-color: rgba(100,200,50,0.5);
          background: rgba(255,255,255,0.07);
          box-shadow: 0 0 0 3px rgba(100,200,50,0.08);
        }

        .dm-alert {
          background: rgba(220,38,38,0.12);
          border: 1px solid rgba(220,38,38,0.25);
          border-radius: 8px;
          padding: 0.625rem 0.875rem;
          color: #fca5a5;
          font-size: 0.85rem;
          margin-bottom: 1rem;
        }

        .dm-btn {
          width: 100%;
          padding: 0.9rem;
          border: none;
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          margin-top: 0.25rem;
          letter-spacing: 0.5px;
          transition: all 0.25s;
          position: relative;
          overflow: hidden;
          background: linear-gradient(
            135deg,
            #1a6b00 0%, #2d9e00 30%, #3ab800 50%, #f5c518 70%, #2d9e00 85%, #1a6b00 100%
          );
          background-size: 250% auto;
          color: #fff;
          text-shadow: 0 1px 3px rgba(0,0,0,0.4);
          box-shadow: 0 4px 20px rgba(45,158,0,0.35), 0 1px 0 rgba(255,255,255,0.1) inset;
          animation: shimmerCopa 4s linear infinite;
        }
        .dm-btn:hover:not(:disabled) {
          background-size: 180% auto;
          box-shadow: 0 6px 28px rgba(45,158,0,0.5), 0 1px 0 rgba(255,255,255,0.15) inset;
          transform: translateY(-2px);
        }
        .dm-btn:active:not(:disabled) { transform: translateY(0); }
        .dm-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .dm-footer {
          text-align: center;
          margin-top: 1.5rem;
          font-size: 0.7rem;
          color: rgba(255,255,255,0.2);
          line-height: 1.6;
        }
        .dm-footer strong { color: rgba(245,197,24,0.55); }
      `}</style>

      <div className="dm-login-wrap">
        <div className="dm-orb dm-orb-1"/>
        <div className="dm-orb dm-orb-2"/>
        <div className="dm-orb dm-orb-3"/>
        <div className="dm-gold-line"/>

        {/* Bolas flutuantes */}
        {BALLS.map(b => <Ball key={b.id} {...b}/>)}

        <div className="dm-card">

          {/* Banner Copa do Mundo 2026 */}
          {!fechou && (
            <div className="dm-banner">
              <button className="dm-banner-close" onClick={() => setFechou(true)} title="Fechar">✕</button>
              <span className="dm-trophy">🏆</span>
              <p className="dm-banner-title">Copa do Mundo 2026</p>
              <p className="dm-banner-quote">Brasil • Junho / Julho 2026</p>
              <span className="dm-banner-flowers">⚽ 🇧🇷 🏆</span>
            </div>
          )}

          {/* Card do formulário */}
          <div className={`dm-form-card${fechou ? ' solo' : ''}`}>
            <div className="dm-logo-area">
              <div style={{ width:'52px', height:'52px', borderRadius:'14px', background:'linear-gradient(135deg,#6366f1,#4f46e5)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.6rem', flexShrink:0 }}>📋</div>
              <div>
                <h1 className="dm-logo-title">Sistema de Gestão Cartorial</h1>
                <p className="dm-logo-sub">Controle de Produtividade</p>
              </div>
            </div>

            <div className="dm-divider"/>

            {erro && <div className="dm-alert">⚠️ {erro}</div>}

            <form onSubmit={handleSubmit}>
              <label className="dm-label" htmlFor="email">E-mail</label>
              <input
                className="dm-input" type="email" id="email"
                value={email} onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com" required autoFocus
              />
              <label className="dm-label" htmlFor="senha">Senha</label>
              <input
                className="dm-input" type="password" id="senha"
                value={senha} onChange={e => setSenha(e.target.value)}
                placeholder="••••••••" required
              />
              <button className="dm-btn" type="submit" disabled={carregando}>
                {carregando ? 'Entrando...' : 'Entrar'}
              </button>
            </form>

            <div className="dm-footer">
              <strong>Versão 1.0</strong> · Sistema de Gestão Cartorial<br/>
              Desenvolvedor: Michael Oliveira
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Login;
