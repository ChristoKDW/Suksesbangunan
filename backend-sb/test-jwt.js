import jwt from 'jsonwebtoken';
const token = jwt.sign({ id: 1, role: 'Admin' }, 'super-secret-key-123', { expiresIn: '1h' });
console.log(token);
