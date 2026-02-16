import React, { useState } from 'react';
import { login } from '../services/api';
import '../styles/Login.css';
import logo from '../styles/img/logo.png';

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);

    try {
      const response = await login(email, senha);
      onLogin(response.token, response.usuario);
    } catch (error) {
      setErro(error.message || 'Erro ao fazer login');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-bg">
        <div className="login-overlay"></div>
      </div>
      
      <div className="login-card">
        <div className="login-header">
          <div className="logo-container">
            <img src={logo} alt="Logo Cartório" className="logo" />
          </div>
          
          <h1>Cartório 1 Ofício - AM</h1>
          <p>Sistema de Produtividade</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {erro && (
            <div className="alert alert-error">
              {erro}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">E-mail</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="senha">Senha</label>
            <input
              type="password"
              id="senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-block"
            disabled={carregando}
          >
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="login-footer">
          <p>
            <strong>Versao 1.0:</strong> Sistema: Cartório 1º Ofício de Imóveis de Manaus,
Desenvolvedor: Michael Oliveira
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
