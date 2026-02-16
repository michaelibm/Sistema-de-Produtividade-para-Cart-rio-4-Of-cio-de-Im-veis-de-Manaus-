const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Token não fornecido' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'seu-secret-aqui-mude-em-producao');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido ou expirado' });
  }
};

const supervisorOnly = (req, res, next) => {
  if (req.user.cargo !== 'Supervisor') {
    return res.status(403).json({ message: 'Acesso negado. Apenas supervisores.' });
  }
  next();
};

module.exports = { authMiddleware, supervisorOnly };
