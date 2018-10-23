const jwt = require('jsonwebtoken')

module.exports = (req, res, next) =>{
    var token = req.headers.token || req.body.token
    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        req.authData = decoded
        next()
    }catch(error){
        return res.status(401).json({result: "auth failed"})
    }
}