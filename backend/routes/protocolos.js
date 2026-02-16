const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

// Função para calcular data de vencimento considerando dias úteis
async function calcularDataVencimento(dataEntrada, prazo, tipoPrazo) {
  let data = new Date(dataEntrada);
  data.setHours(0, 0, 0, 0);
  
  let diasAdicionados = 0;

  const feriadosResult = await pool.query('SELECT data FROM feriados');
  const feriados = feriadosResult.rows.map(f => f.data.toISOString().split('T')[0]);

  while (diasAdicionados < prazo) {
    data.setDate(data.getDate() + 1);
    
    if (tipoPrazo === 'uteis') {
      const diaSemana = data.getDay();
      const dataStr = data.toISOString().split('T')[0];
      const ehFeriado = feriados.includes(dataStr);
      
      if (diaSemana !== 0 && diaSemana !== 6 && !ehFeriado) {
        diasAdicionados++;
      }
    } else {
      diasAdicionados++;
    }
  }

  return data.toISOString().split('T')[0];
}

// Listar todos os protocolos (com controle de permissões)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status, responsavel_id } = req.query;
    
    let query = `
      SELECT p.*, s.nome as servico_nome, s.prazo, s.tipo_prazo,
             u.nome as responsavel_nome, u.cargo as responsavel_cargo, u.setor as responsavel_setor
      FROM protocolos p
      JOIN servicos s ON p.servico_id = s.id
      JOIN usuarios u ON p.responsavel_id = u.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 1;

    // Auxiliar só vê seus próprios protocolos
    if (req.user.cargo === 'Auxiliar') {
      query += ` AND p.responsavel_id = $${paramCount}`;
      params.push(req.user.id);
      paramCount++;
    }

    if (status) {
      query += ` AND p.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (responsavel_id && req.user.cargo !== 'Auxiliar') {
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

// Buscar protocolo por ID (com notas e histórico)
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    let query = `
      SELECT p.*, s.nome as servico_nome, s.prazo, s.tipo_prazo,
             u.nome as responsavel_nome, u.email as responsavel_email, 
             u.cargo as responsavel_cargo, u.setor as responsavel_setor
      FROM protocolos p
      JOIN servicos s ON p.servico_id = s.id
      JOIN usuarios u ON p.responsavel_id = u.id
      WHERE p.id = $1
    `;
    
    const params = [id];
    
    // Auxiliar só pode ver seus próprios protocolos
    if (req.user.cargo === 'Auxiliar') {
      query += ' AND p.responsavel_id = $2';
      params.push(req.user.id);
    }

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Protocolo não encontrado' });
    }

    const protocolo = result.rows[0];

    // Buscar notas do protocolo
    const notasResult = await pool.query(`
      SELECT n.*, u.nome as usuario_nome, u.cargo as usuario_cargo, u.setor as usuario_setor
      FROM protocolo_notas n
      LEFT JOIN usuarios u ON n.usuario_id = u.id
      WHERE n.protocolo_id = $1
      ORDER BY n.created_at DESC
    `, [id]);

    // Buscar histórico do protocolo
    const historicoResult = await pool.query(`
      SELECT h.*, u.nome as usuario_nome, u.email as usuario_email, 
             u.cargo as usuario_cargo, u.setor as usuario_setor
      FROM historico h
      LEFT JOIN usuarios u ON h.usuario_id = u.id
      WHERE h.protocolo_id = $1
      ORDER BY h.created_at DESC
    `, [id]);

    protocolo.notas = notasResult.rows;
    protocolo.historico = historicoResult.rows;

    res.json(protocolo);
  } catch (error) {
    console.error('Erro ao buscar protocolo:', error);
    res.status(500).json({ message: 'Erro ao buscar protocolo' });
  }
});

// Criar novo protocolo
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { numero, servico_id, responsavel_id, data_entrada, observacoes } = req.body;

    if (!numero || !servico_id || !responsavel_id || !data_entrada) {
      return res.status(400).json({ message: 'Campos obrigatórios faltando' });
    }

    // Auxiliar só pode criar protocolos para si mesmo
    if (req.user.cargo === 'Auxiliar' && responsavel_id != req.user.id) {
      return res.status(403).json({ message: 'Você só pode criar protocolos para si mesmo' });
    }

    const existente = await pool.query('SELECT id FROM protocolos WHERE numero = $1', [numero]);
    if (existente.rows.length > 0) {
      return res.status(400).json({ message: 'Número de protocolo já existe' });
    }

    const servicoResult = await pool.query('SELECT prazo, tipo_prazo FROM servicos WHERE id = $1', [servico_id]);
    if (servicoResult.rows.length === 0) {
      return res.status(404).json({ message: 'Serviço não encontrado' });
    }

    const servico = servicoResult.rows[0];
    const data_vencimento = await calcularDataVencimento(data_entrada, servico.prazo, servico.tipo_prazo);

    const result = await pool.query(
      `INSERT INTO protocolos (numero, servico_id, responsavel_id, data_entrada, data_vencimento, observacoes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [numero, servico_id, responsavel_id, data_entrada, data_vencimento, observacoes]
    );

    // Buscar o setor do responsável para incluir no histórico
    const userResult = await pool.query('SELECT nome, setor FROM usuarios WHERE id = $1', [responsavel_id]);
    const userSetor = userResult.rows[0]?.setor;

    await pool.query(
      'INSERT INTO historico (protocolo_id, usuario_id, acao, descricao) VALUES ($1, $2, $3, $4)',
      [result.rows[0].id, req.user.id, 'CRIACAO', `Protocolo criado por ${req.user.email}${userSetor ? ` - Setor: ${userSetor}` : ''}`]
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

    // Verificar permissões para Auxiliar
    if (req.user.cargo === 'Auxiliar') {
      const checkProtocolo = await pool.query('SELECT responsavel_id FROM protocolos WHERE id = $1', [id]);
      
      if (checkProtocolo.rows.length === 0) {
        return res.status(404).json({ message: 'Protocolo não encontrado' });
      }
      
      if (checkProtocolo.rows[0].responsavel_id != req.user.id) {
        return res.status(403).json({ message: 'Você só pode editar seus próprios protocolos' });
      }
      
      if (responsavel_id && responsavel_id != req.user.id) {
        return res.status(403).json({ message: 'Você não pode transferir protocolos para outros usuários' });
      }
    }

    let query = 'UPDATE protocolos SET ';
    const params = [];
    let paramCount = 1;
    const updates = [];

    if (responsavel_id) {
      updates.push(`responsavel_id = $${paramCount}`);
      params.push(responsavel_id);
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

// ADICIONAR NOTA ao protocolo
router.post('/:id/notas', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { nota } = req.body;

    if (!nota || !nota.trim()) {
      return res.status(400).json({ message: 'Nota não pode estar vazia' });
    }

    let checkQuery = 'SELECT id, numero, responsavel_id FROM protocolos WHERE id = $1';
    const checkParams = [id];
    
    if (req.user.cargo === 'Auxiliar') {
      checkQuery += ' AND responsavel_id = $2';
      checkParams.push(req.user.id);
    }

    const protocoloCheck = await pool.query(checkQuery, checkParams);
    
    if (protocoloCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Protocolo não encontrado ou sem permissão' });
    }

    const result = await pool.query(
      `INSERT INTO protocolo_notas (protocolo_id, usuario_id, nota)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [id, req.user.id, nota]
    );

    const notaCompleta = await pool.query(`
      SELECT n.*, u.nome as usuario_nome, u.cargo as usuario_cargo, u.setor as usuario_setor
      FROM protocolo_notas n
      LEFT JOIN usuarios u ON n.usuario_id = u.id
      WHERE n.id = $1
    `, [result.rows[0].id]);

    await pool.query(
      'INSERT INTO historico (protocolo_id, usuario_id, acao, descricao) VALUES ($1, $2, $3, $4)',
      [id, req.user.id, 'NOTA_ADICIONADA', `Nota adicionada por ${req.user.email}: "${nota.substring(0, 50)}${nota.length > 50 ? '...' : ''}"`]
    );

    res.status(201).json(notaCompleta.rows[0]);
  } catch (error) {
    console.error('Erro ao adicionar nota:', error);
    res.status(500).json({ message: 'Erro ao adicionar nota' });
  }
});

// LISTAR NOTAS do protocolo
router.get('/:id/notas', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    let checkQuery = 'SELECT id FROM protocolos WHERE id = $1';
    const checkParams = [id];
    
    if (req.user.cargo === 'Auxiliar') {
      checkQuery += ' AND responsavel_id = $2';
      checkParams.push(req.user.id);
    }

    const protocoloCheck = await pool.query(checkQuery, checkParams);
    
    if (protocoloCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Protocolo não encontrado ou sem permissão' });
    }

    const result = await pool.query(`
      SELECT n.*, u.nome as usuario_nome, u.cargo as usuario_cargo, u.setor as usuario_setor
      FROM protocolo_notas n
      LEFT JOIN usuarios u ON n.usuario_id = u.id
      WHERE n.protocolo_id = $1
      ORDER BY n.created_at DESC
    `, [id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar notas:', error);
    res.status(500).json({ message: 'Erro ao buscar notas' });
  }
});

// BUSCAR HISTÓRICO do protocolo
router.get('/:id/historico', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    let checkQuery = 'SELECT id FROM protocolos WHERE id = $1';
    const checkParams = [id];
    
    if (req.user.cargo === 'Auxiliar') {
      checkQuery += ' AND responsavel_id = $2';
      checkParams.push(req.user.id);
    }

    const protocoloCheck = await pool.query(checkQuery, checkParams);
    
    if (protocoloCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Protocolo não encontrado ou sem permissão' });
    }

    const result = await pool.query(`
      SELECT h.*, u.nome as usuario_nome, u.email as usuario_email, 
             u.cargo as usuario_cargo, u.setor as usuario_setor
      FROM historico h
      LEFT JOIN usuarios u ON h.usuario_id = u.id
      WHERE h.protocolo_id = $1
      ORDER BY h.created_at DESC
    `, [id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    res.status(500).json({ message: 'Erro ao buscar histórico' });
  }
});

// Excluir protocolo
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const pRes = await pool.query('SELECT id, status, numero, responsavel_id FROM protocolos WHERE id = $1', [id]);
    if (pRes.rows.length === 0) {
      return res.status(404).json({ message: 'Protocolo não encontrado' });
    }

    const p = pRes.rows[0];
    
    if (req.user.cargo === 'Auxiliar' && p.responsavel_id != req.user.id) {
      return res.status(403).json({ message: 'Você só pode cancelar seus próprios protocolos' });
    }
    
    if (p.status === 'cancelado') {
      return res.json({ ok: true, message: 'Protocolo já está cancelado' });
    }

    await pool.query(`UPDATE protocolos SET status = 'cancelado' WHERE id = $1`, [id]);

    await pool.query(
      'INSERT INTO historico (protocolo_id, usuario_id, acao, descricao) VALUES ($1, $2, $3, $4)',
      [id, req.user.id, 'CANCELAMENTO', `Protocolo ${p.numero} cancelado por ${req.user.email}`]
    );

    res.json({ ok: true });
  } catch (error) {
    console.error('Erro ao cancelar protocolo:', error);
    res.status(500).json({ message: 'Erro ao excluir protocolo' });
  }
});

// Adicionar serviço
router.post('/:id/adicionar-servico', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { servico_id, renovarPrazo } = req.body;

  const client = await pool.connect();
  try {
    if (!servico_id) {
      return res.status(400).json({ message: 'servico_id é obrigatório' });
    }

    await client.query('BEGIN');

    const protocoloRes = await client.query(
      'SELECT id, numero, status, data_entrada, data_vencimento, responsavel_id FROM protocolos WHERE id = $1',
      [id]
    );
    
    if (protocoloRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Protocolo não encontrado' });
    }

    const protocolo = protocoloRes.rows[0];
    
    if (req.user.cargo === 'Auxiliar' && protocolo.responsavel_id != req.user.id) {
      await client.query('ROLLBACK');
      return res.status(403).json({ message: 'Você só pode adicionar serviços aos seus próprios protocolos' });
    }
    
    if (protocolo.status !== 'andamento') {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Só é possível adicionar serviço em protocolo "andamento".' });
    }

    const servicoRes = await client.query('SELECT id, nome, prazo, tipo_prazo FROM servicos WHERE id = $1', [servico_id]);
    if (servicoRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Serviço não encontrado' });
    }
    const servico = servicoRes.rows[0];

    await client.query(
      `INSERT INTO protocolo_servicos (protocolo_id, servico_id, adicionado_por)
       VALUES ($1, $2, $3)`,
      [id, servico_id, req.user.id]
    );

    const dataVencimentoAtual = new Date(protocolo.data_vencimento);
    let novaData = dataVencimentoAtual.toISOString().split('T')[0];

    if (renovarPrazo) {
      const recalculada = await calcularDataVencimento(protocolo.data_entrada, servico.prazo, servico.tipo_prazo);
      const dataAtual = new Date(novaData);
      const dataRecalculada = new Date(recalculada);
      
      novaData = (dataRecalculada > dataAtual) ? recalculada : novaData;
      await client.query('UPDATE protocolos SET data_vencimento = $1 WHERE id = $2', [novaData, id]);
    }

    await client.query(
      'INSERT INTO historico (protocolo_id, usuario_id, acao, descricao) VALUES ($1, $2, $3, $4)',
      [
        id,
        req.user.id,
        'ADICIONAR_SERVICO',
        renovarPrazo
          ? `Serviço "${servico.nome}" adicionado com renovação de prazo. Novo vencimento: ${novaData}`
          : `Serviço "${servico.nome}" adicionado mantendo prazo (${novaData})`,
      ]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Serviço adicionado com sucesso!',
      data_vencimento: novaData,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erro ao adicionar serviço:', err);
    res.status(500).json({ message: 'Erro ao adicionar serviço' });
  } finally {
    client.release();
  }
});

// Concluir protocolo
router.patch('/:id/concluir', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.cargo === 'Auxiliar') {
      const checkProtocolo = await pool.query('SELECT responsavel_id FROM protocolos WHERE id = $1', [id]);
      
      if (checkProtocolo.rows.length === 0) {
        return res.status(404).json({ message: 'Protocolo não encontrado' });
      }
      
      if (checkProtocolo.rows[0].responsavel_id != req.user.id) {
        return res.status(403).json({ message: 'Você só pode concluir seus próprios protocolos' });
      }
    }

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

// Dashboard
router.get('/dashboard/stats', authMiddleware, async (req, res) => {
  try {
    let whereClause = '';
    const params = [];
    
    if (req.user.cargo === 'Auxiliar') {
      whereClause = 'WHERE responsavel_id = $1';
      params.push(req.user.id);
    }
    
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
      ${whereClause}
    `, params);

    res.json(stats.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ message: 'Erro ao buscar estatísticas' });
  }
});

module.exports = router;
