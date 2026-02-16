const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authMiddleware, supervisorOnly } = require('../middleware/auth');

// Listar todos os status ativos
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, nome, cor, ordem FROM status_protocolos WHERE ativo = true ORDER BY ordem, nome'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar status:', error);
    res.status(500).json({ message: 'Erro ao listar status' });
  }
});

// Criar novo status (apenas supervisor)
router.post('/', authMiddleware, supervisorOnly, async (req, res) => {
  try {
    const { nome, cor, ordem } = req.body;

    if (!nome) {
      return res.status(400).json({ message: 'Nome é obrigatório' });
    }

    // Verificar se já existe
    const existente = await pool.query(
      'SELECT id FROM status_protocolos WHERE LOWER(nome) = LOWER($1)',
      [nome]
    );

    if (existente.rows.length > 0) {
      return res.status(400).json({ message: 'Status já existe' });
    }

    const result = await pool.query(
      'INSERT INTO status_protocolos (nome, cor, ordem) VALUES ($1, $2, $3) RETURNING *',
      [nome, cor || 'info', ordem || 0]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar status:', error);
    res.status(500).json({ message: 'Erro ao criar status' });
  }
});

// Atualizar status (apenas supervisor)
router.put('/:id', authMiddleware, supervisorOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, cor, ordem } = req.body;

    const result = await pool.query(
      'UPDATE status_protocolos SET nome = $1, cor = $2, ordem = $3 WHERE id = $4 RETURNING *',
      [nome, cor, ordem || 0, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Status não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    res.status(500).json({ message: 'Erro ao atualizar status' });
  }
});

// Desativar status (apenas supervisor)
router.delete('/:id', authMiddleware, supervisorOnly, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se há protocolos usando este status
    const emUso = await pool.query(
      'SELECT COUNT(*) as total FROM protocolos WHERE status = (SELECT nome FROM status_protocolos WHERE id = $1)',
      [id]
    );

    if (parseInt(emUso.rows[0].total) > 0) {
      return res.status(400).json({ 
        message: `Não é possível remover. Existem ${emUso.rows[0].total} protocolo(s) com este status.` 
      });
    }

    const result = await pool.query(
      'UPDATE status_protocolos SET ativo = false WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Status não encontrado' });
    }

    res.json({ message: 'Status desativado com sucesso' });
  } catch (error) {
    console.error('Erro ao desativar status:', error);
    res.status(500).json({ message: 'Erro ao desativar status' });
  }
});

module.exports = router;
