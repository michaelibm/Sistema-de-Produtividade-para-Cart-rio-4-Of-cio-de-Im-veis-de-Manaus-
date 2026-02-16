const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

// Função para calcular data de vencimento considerando dias úteis
async function calcularDataVencimento(dataEntrada, prazo, tipoPrazo) {
  let data = new Date(dataEntrada);
  data.setHours(0, 0, 0, 0);
  
  let diasAdicionados = 0;

  // Buscar feriados
  const feriadosResult = await pool.query('SELECT data FROM feriados');
  const feriados = feriadosResult.rows.map(f => f.data.toISOString().split('T')[0]);

  while (diasAdicionados < prazo) {
    data.setDate(data.getDate() + 1);
    
    if (tipoPrazo === 'uteis') {
      const diaSemana = data.getDay();
      const dataStr = data.toISOString().split('T')[0];
      const ehFeriado = feriados.includes(dataStr);
      
      // 0 = domingo, 6 = sábado
      if (diaSemana !== 0 && diaSemana !== 6 && !ehFeriado) {
        diasAdicionados++;
      }
    } else {
      diasAdicionados++;
    }
  }

  return data.toISOString().split('T')[0];
}

// Listar todos os protocolos
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status, responsavel_id } = req.query;
    
    let query = `
      SELECT p.*, s.nome as servico_nome, s.prazo, s.tipo_prazo,
             u.nome as responsavel_nome, u.cargo as responsavel_cargo
      FROM protocolos p
      JOIN servicos s ON p.servico_id = s.id
      JOIN usuarios u ON p.responsavel_id = u.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 1;

    if (status) {
      query += ` AND p.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (responsavel_id !== undefined && responsavel_id !== null && responsavel_id !== '') {

      query += ` AND p.responsavel_id = $${paramCount}`;
      params.push(responsavel_id);
      paramCount++;
    }

    query += ' ORDER BY p.data_entrada DESC, p.data_vencimento ASC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar protocolos:', error);
    res.status(500).json({ message: 'Erro ao listar protocolos' });
  }
});

// Dashboard - estatísticas
// IMPORTANTE: esta rota precisa vir ANTES de '/:id' para não ser capturada pelo parâmetro.
router.get('/dashboard/stats', authMiddleware, async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'andamento') as ativos,
        COUNT(*) FILTER (WHERE status = 'concluido' AND 
          EXTRACT(MONTH FROM data_conclusao) = EXTRACT(MONTH FROM CURRENT_DATE) AND
          EXTRACT(YEAR FROM data_conclusao) = EXTRACT(YEAR FROM CURRENT_DATE)
        ) as concluidos_mes,
        COUNT(*) FILTER (WHERE status = 'andamento' AND data_vencimento < CURRENT_DATE) as atrasados,
        COUNT(*) FILTER (WHERE status = 'andamento' AND data_vencimento BETWEEN CURRENT_DATE AND CURRENT_DATE + 3) as vencendo
      FROM protocolos
    `);

    res.json(stats.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ message: 'Erro ao buscar estatísticas' });
  }
});

// Buscar protocolo por ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT p.*, s.nome as servico_nome, s.prazo, s.tipo_prazo,
             u.nome as responsavel_nome, u.email as responsavel_email, u.cargo as responsavel_cargo
      FROM protocolos p
      JOIN servicos s ON p.servico_id = s.id
      JOIN usuarios u ON p.responsavel_id = u.id
      WHERE p.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Protocolo não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar protocolo:', error);
    res.status(500).json({ message: 'Erro ao buscar protocolo' });
  }
});

// Excluir protocolo (mantém histórico)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM protocolos WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Protocolo não encontrado' });
    }

    // Registrar no histórico
    await pool.query(
      'INSERT INTO historico (protocolo_id, usuario_id, acao, descricao) VALUES ($1, $2, $3, $4)',
      [id, req.user.id, 'EXCLUSAO', `Protocolo excluído por ${req.user.email}`]
    );

    res.json({ ok: true });
  } catch (error) {
    console.error('Erro ao excluir protocolo:', error);
    res.status(500).json({ message: 'Erro ao excluir protocolo' });
  }
});

// Criar novo protocolo
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { numero, servico_id, responsavel_id, data_entrada, observacoes } = req.body;

    if (!numero || !servico_id || !responsavel_id || !data_entrada) {
      return res.status(400).json({ message: 'Campos obrigatórios faltando' });
    }

    // Verificar se número já existe
    const existente = await pool.query(
      'SELECT id FROM protocolos WHERE numero = $1',
      [numero]
    );

    if (existente.rows.length > 0) {
      return res.status(400).json({ message: 'Número de protocolo já existe' });
    }

    // Buscar informações do serviço
    const servicoResult = await pool.query(
      'SELECT prazo, tipo_prazo FROM servicos WHERE id = $1',
      [servico_id]
    );

    if (servicoResult.rows.length === 0) {
      return res.status(404).json({ message: 'Serviço não encontrado' });
    }

    const servico = servicoResult.rows[0];
    const data_vencimento = await calcularDataVencimento(
      data_entrada,
      servico.prazo,
      servico.tipo_prazo
    );

    const result = await pool.query(
      `INSERT INTO protocolos (numero, servico_id, responsavel_id, data_entrada, data_vencimento, observacoes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [numero, servico_id, responsavel_id, data_entrada, data_vencimento, observacoes]
    );

    // Registrar no histórico
    await pool.query(
      'INSERT INTO historico (protocolo_id, usuario_id, acao, descricao) VALUES ($1, $2, $3, $4)',
      [result.rows[0].id, req.user.id, 'CRIACAO', `Protocolo criado por ${req.user.email}`]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar protocolo:', error);
    res.status(500).json({ message: 'Erro ao criar protocolo' });
  }
});

// Atualizar protocolo
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { responsavel_id, observacoes, status } = req.body;

    let query = 'UPDATE protocolos SET ';
    const params = [];
    let paramCount = 1;
    const updates = [];

    if (responsavel_id !== undefined && responsavel_id !== null && responsavel_id !== '') {
  const rid = Number(responsavel_id);
  if (Number.isNaN(rid)) return res.status(400).json({ message: 'responsavel_id inválido' });

  query += ` AND p.responsavel_id = $${paramCount}`;
  params.push(rid);
  paramCount++;
}


    if (observacoes !== undefined) {
      updates.push(`observacoes = $${paramCount}`);
      params.push(observacoes);
      paramCount++;
    }

    if (status) {
      updates.push(`status = $${paramCount}`);
      params.push(status);
      paramCount++;
      
      if (status === 'concluido') {
        updates.push(`data_conclusao = CURRENT_DATE`);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'Nenhum campo para atualizar' });
    }

    query += updates.join(', ') + ` WHERE id = $${paramCount} RETURNING *`;
    params.push(id);

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Protocolo não encontrado' });
    }

    // Registrar no histórico
    await pool.query(
      'INSERT INTO historico (protocolo_id, usuario_id, acao, descricao) VALUES ($1, $2, $3, $4)',
      [id, req.user.id, 'ATUALIZACAO', `Protocolo atualizado por ${req.user.email}`]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar protocolo:', error);
    res.status(500).json({ message: 'Erro ao atualizar protocolo' });
  }
});

//adicionar-servico

router.post("/:id/adicionar-servico", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { servico_id, renovarPrazo } = req.body;

  try {
    // 1. Inserir novo serviço na tabela vínculo
    await db.query(
      `INSERT INTO protocolo_servicos (protocolo_id, servico_id)
       VALUES ($1, $2)`,
      [id, servico_id]
    );

    // 2. Buscar protocolo atual
    const protocolo = await db.query(
      `SELECT data_vencimento FROM protocolos WHERE id = $1`,
      [id]
    );

    let novaData = protocolo.rows[0].data_vencimento;

    // 3. Se renovar prazo
    if (renovarPrazo) {
      const servico = await db.query(
        `SELECT prazo_dias FROM servicos WHERE id = $1`,
        [servico_id]
      );

      const prazo = servico.rows[0].prazo_dias;

      novaData = new Date();
      novaData.setDate(novaData.getDate() + prazo);

      await db.query(
        `UPDATE protocolos SET data_vencimento = $1 WHERE id = $2`,
        [novaData, id]
      );
    }

    // 4. Registrar histórico
    await db.query(
      `INSERT INTO protocolo_historico (protocolo_id, acao)
       VALUES ($1, $2)`,
      [id, renovarPrazo
        ? "Serviço adicionado com renovação de prazo"
        : "Serviço adicionado mantendo prazo"]
    );

    res.json({
      success: true,
      message: "Serviço adicionado com sucesso!",
      data_vencimento: novaData
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao adicionar serviço" });
  }
});



// Concluir protocolo
router.patch('/:id/concluir', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE protocolos 
       SET status = 'concluido', data_conclusao = CURRENT_DATE 
       WHERE id = $1 AND status = 'andamento'
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Protocolo não encontrado ou já concluído' });
    }

    // Registrar no histórico
    await pool.query(
      'INSERT INTO historico (protocolo_id, usuario_id, acao, descricao) VALUES ($1, $2, $3, $4)',
      [id, req.user.id, 'CONCLUSAO', `Protocolo concluído por ${req.user.email}`]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao concluir protocolo:', error);
    res.status(500).json({ message: 'Erro ao concluir protocolo' });
  }
});

module.exports = router;
