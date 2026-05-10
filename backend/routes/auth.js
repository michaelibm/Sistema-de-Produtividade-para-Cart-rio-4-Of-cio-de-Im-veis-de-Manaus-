const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ message: 'Email e senha são obrigatórios' });
    }

    const result = await pool.query(
      'SELECT * FROM usuarios WHERE email = $1 AND ativo = true',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    const usuario = result.rows[0];

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: 'JWT_SECRET não configurado no servidor' });
    }
    const senhaValida = await bcrypt.compare(senha, usuario.senha);

    if (!senhaValida) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    const token = jwt.sign(
      { id: usuario.id, nome: usuario.nome, email: usuario.email, cargo: usuario.cargo },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        cargo: usuario.cargo
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ message: 'Erro ao fazer login' });
  }
});

// Registro (apenas para desenvolvimento - em produção, só supervisor cria usuários)
router.post('/register', async (req, res) => {
  try {
    const { nome, email, senha, cargo } = req.body;

    if (!nome || !email || !senha || !cargo) {
      return res.status(400).json({ message: 'Todos os campos são obrigatórios' });
    }

    // Verificar se email já existe
    const existente = await pool.query(
      'SELECT id FROM usuarios WHERE email = $1',
      [email]
    );

    if (existente.rows.length > 0) {
      return res.status(400).json({ message: 'Email já cadastrado' });
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    const result = await pool.query(
      'INSERT INTO usuarios (nome, email, senha, cargo) VALUES ($1, $2, $3, $4) RETURNING id, nome, email, cargo',
      [nome, email, senhaHash, cargo]
    );

    res.status(201).json({
      message: 'Usuário criado com sucesso',
      usuario: result.rows[0]
    });
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ message: 'Erro ao criar usuário' });
  }
});

module.exports = router;
