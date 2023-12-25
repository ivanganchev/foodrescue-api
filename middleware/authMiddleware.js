const jwt = require('jsonwebtoken');
const jwtSecret = process.env.JWT_SECRET;

function verifyToken(req, res, next) {
    let token = req.header('Authorization');
    if (!token) {
        return res.status(401).json({ error: 'Access denied' }); 
    }

    try {
        token = token.replace(/^Bearer\s+/, "");
        const decoded = jwt.verify(token, jwtSecret);
        
        req.userId = decoded.userId;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
 };

module.exports = verifyToken;