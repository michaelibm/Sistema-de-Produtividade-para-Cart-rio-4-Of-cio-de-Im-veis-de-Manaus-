const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authMiddleware, supervisorOnly } = require('../middleware/auth');

// Listar todos os feriados
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM feriados ORDER BY data'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar feriados:', error);
    res.status(500).json({ message: 'Erro ao listar feriados' });
  }
});

// Criar novo feriado (apenas supervisor)
router.post('/', authMiddleware, supervisorOnly, async (req, res) => {
  try {
    const { data, descricao } = req.body;

    if (!data || !descricao) {
      return res.status(400).json({ message: 'Data e descrição são obrigatórias' });
    }

    const result = await pool.query(
      'INSERT INTO feriados (data, descricao) VALUES ($1, $2) RETURNING *',
      [data, descricao]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ message: 'Já existe um feriado nesta data' });
    }
    console.error('Erro ao criar feriado:', error);
    res.status(500).json({ message: 'Erro ao criar feriado' });
  }
});

// Excluir feriado (apenas supervisor)
router.delete('/:id', authMiddleware, supervisorOnly, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM feriados WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Feriado não encontrado' });
    }

    res.json({ message: 'Feriado excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir feriado:', error);
    res.status(500).json({ message: 'Erro ao excluir feriado' });
  }
});

module.exports = router;
