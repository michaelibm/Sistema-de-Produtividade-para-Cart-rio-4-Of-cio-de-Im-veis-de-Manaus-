const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authMiddleware, supervisorOnly } = require('../middleware/auth');

// Listar todos os serviços
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, nome, prazo, tipo_prazo, dias_alerta, ativo FROM servicos WHERE ativo = true ORDER BY nome'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar serviços:', error);
    res.status(500).json({ message: 'Erro ao listar serviços' });
  }
});

// Buscar serviço por ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM servicos WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Serviço não encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar serviço:', error);
    res.status(500).json({ message: 'Erro ao buscar serviço' });
  }
});

// Criar novo serviço (apenas supervisor)
router.post('/', authMiddleware, supervisorOnly, async (req, res) => {
  try {
    const { nome, prazo, tipo_prazo, dias_alerta } = req.body;

    if (!nome || !tipo_prazo) {
      return res.status(400).json({ message: 'Campos obrigatórios: nome e tipo_prazo' });
    }

    const semPrazo = tipo_prazo === 'sem_prazo';
    if (!semPrazo && !prazo) {
      return res.status(400).json({ message: 'Campo obrigatório: prazo' });
    }

    // Validar dias_alerta
    const diasAlertaValue = semPrazo ? null : (dias_alerta || 3); // Padrão: 3 dias
    if (!semPrazo && (diasAlertaValue < 1 || diasAlertaValue > 30)) {
      return res.status(400).json({ message: 'Dias de alerta deve estar entre 1 e 30' });
    }

    const result = await pool.query(
      'INSERT INTO servicos (nome, prazo, tipo_prazo, dias_alerta) VALUES ($1, $2, $3, $4) RETURNING *',
      [nome, semPrazo ? null : prazo, tipo_prazo, diasAlertaValue]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar serviço:', error);
    res.status(500).json({ message: 'Erro ao criar serviço' });
  }
});

// Atualizar serviço (apenas supervisor)
router.put('/:id', authMiddleware, supervisorOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, prazo, tipo_prazo, dias_alerta } = req.body;

    const semPrazo = tipo_prazo === 'sem_prazo';

    // Validar dias_alerta se fornecido
    if (!semPrazo && dias_alerta !== undefined && (dias_alerta < 1 || dias_alerta > 30)) {
      return res.status(400).json({ message: 'Dias de alerta deve estar entre 1 e 30' });
    }

    const result = await pool.query(
      'UPDATE servicos SET nome = $1, prazo = $2, tipo_prazo = $3, dias_alerta = $4 WHERE id = $5 RETURNING *',
      [nome, semPrazo ? null : prazo, tipo_prazo, semPrazo ? null : (dias_alerta || 3), id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Serviço não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar serviço:', error);
    res.status(500).json({ message: 'Erro ao atualizar serviço' });
  }
});

// Desativar serviço (apenas supervisor)
router.delete('/:id', authMiddleware, supervisorOnly, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'UPDATE servicos SET ativo = false WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Serviço não encontrado' });
    }

    res.json({ message: 'Serviço desativado com sucesso' });
  } catch (error) {
    console.error('Erro ao desativar serviço:', error);
    res.status(500).json({ message: 'Erro ao desativar serviço' });
  }
});

module.exports = router;
