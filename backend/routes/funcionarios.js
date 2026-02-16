const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const { authMiddleware, supervisorOnly } = require('../middleware/auth');

// Listar todos os funcionários
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, nome, email, cargo, setor, ativo, created_at FROM usuarios WHERE ativo = true ORDER BY nome'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar funcionários:', error);
    res.status(500).json({ message: 'Erro ao listar funcionários' });
  }
});

// Criar novo funcionário (apenas supervisor)
router.post('/', authMiddleware, supervisorOnly, async (req, res) => {
  try {
    const { nome, email, cargo, setor, senha } = req.body;

    if (!nome || !email || !cargo || !senha) {
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
      'INSERT INTO usuarios (nome, email, senha, cargo, setor) VALUES ($1, $2, $3, $4, $5) RETURNING id, nome, email, cargo, setor',
      [nome, email, senhaHash, cargo, setor || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar funcionário:', error);
    res.status(500).json({ message: 'Erro ao criar funcionário' });
  }
});

// Atualizar funcionário (apenas supervisor)
router.put('/:id', authMiddleware, supervisorOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, email, cargo, setor } = req.body;

    const result = await pool.query(
      'UPDATE usuarios SET nome = $1, email = $2, cargo = $3, setor = $4 WHERE id = $5 RETURNING id, nome, email, cargo, setor',
      [nome, email, cargo, setor || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Funcionário não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar funcionário:', error);
    res.status(500).json({ message: 'Erro ao atualizar funcionário' });
  }
});

// Desativar funcionário (apenas supervisor)
router.delete('/:id', authMiddleware, supervisorOnly, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'UPDATE usuarios SET ativo = false WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Funcionário não encontrado' });
    }

    res.json({ message: 'Funcionário desativado com sucesso' });
  } catch (error) {
    console.error('Erro ao desativar funcionário:', error);
    res.status(500).json({ message: 'Erro ao desativar funcionário' });
  }
});

module.exports = router;
