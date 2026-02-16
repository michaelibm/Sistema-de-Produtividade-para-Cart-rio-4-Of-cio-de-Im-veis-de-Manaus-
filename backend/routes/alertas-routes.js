const express = require('express');
const router = express.Router();
const { authMiddleware, supervisorOnly } = require('../middleware/auth');
const { verificarProtocolosVencendo, verificarProtocolosAtrasados } = require('../services/alertas-service');

// 🔔 Executar verificação manual de alertas (apenas supervisor)
router.post('/verificar-vencimentos', authMiddleware, supervisorOnly, async (req, res) => {
  try {
    console.log(`[API] Verificação manual solicitada por ${req.user.email}`);
    const resultado = await verificarProtocolosVencendo();
    res.json({
      success: true,
      message: 'Verificação concluída',
      ...resultado,
    });
  } catch (error) {
    console.error('[API] Erro na verificação:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao verificar vencimentos',
      error: error.message 
    });
  }
});

// 🔔 Verificar protocolos atrasados manualmente
router.post('/verificar-atrasados', authMiddleware, supervisorOnly, async (req, res) => {
  try {
    const resultado = await verificarProtocolosAtrasados();
    res.json({
      success: true,
      message: 'Verificação de atrasados concluída',
      ...resultado,
    });
  } catch (error) {
    console.error('[API] Erro ao verificar atrasados:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao verificar atrasados',
      error: error.message 
    });
  }
});

// 📊 Obter status do sistema de alertas
router.get('/status', authMiddleware, async (req, res) => {
  try {
    const pool = require('../config/database');
    
    // Buscar estatísticas rápidas
    const stats = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'andamento' AND data_vencimento = CURRENT_DATE) as vence_hoje,
        COUNT(*) FILTER (WHERE status = 'andamento' AND data_vencimento = CURRENT_DATE + 1) as vence_amanha,
        COUNT(*) FILTER (WHERE status = 'andamento' AND data_vencimento BETWEEN CURRENT_DATE + 2 AND CURRENT_DATE + 3) as vence_2_3_dias,
        COUNT(*) FILTER (WHERE status = 'andamento' AND data_vencimento < CURRENT_DATE) as atrasados
      FROM protocolos
    `);

    res.json({
      success: true,
      webhook_url: process.env.N8N_WEBHOOK_URL ? '✓ Configurado' : '✗ Não configurado',
      estatisticas: stats.rows[0],
      ultima_verificacao: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API] Erro ao obter status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao obter status' 
    });
  }
});

module.exports = router;
