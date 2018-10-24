const express = require('express')
const router = express.Router()
const con = require('../db')
const bcrypt = require('bcryptjs')
const jwt  = require('jsonwebtoken')
const checkAuth = require('../auth')
const fs = require('fs')
const cloudinary = require('cloudinary')

cloudinary.config({ 
    cloud_name: 'dsgtzloau', 
    api_key: '191975171813797', 
    api_secret: 'Dd8aUnrnDUU4Pd4uup89-nReDlk'
});

//shoudl reply with a jwt that does not expire
router.post('/register', (req, res)=>{
    var email =req.body.email
    var password = req.body.password
    var name = req.body.name
    if(!email ||!password || !name){
        res.status(400).json({response: "bad request"})
        return
    }
    else{
        bcrypt.hash(password,10, (err, hash)=>{
            if(err){
             res.status(500).json({response: "server error"})
             return
            }else{
                var sql = "INSERT INTO users (name, email, password) "+
                          "VALUES('"+name+"','"+email+"','"+hash+"'); "
                con.query(sql, (error, result)=>{
                    if(error){
                        if(error.errno === 1062)
                            return res.status(409).json({response: "Email Already In Use"})
                            
                        res.status(500).json({response: "server error"})
                        return
                    }else{
                        const token = jwt.sign({
                            id: result.insertId,
                            email: email
                        },process.env.JWT_SECRET)
                        res.status(201).json({response: "successful",
                                              token: token,
                                              user_id: result.insertId})
                        return
                    }
                })
            }
        })
    }
})

//should reply with a jwt that does not expire
router.post('/login', (req, res)=>{
    var email = req.body.email
    var passwordPlain = req.body.password
    if(!email || ! passwordPlain){
        res.status(400).json({response: "bad request"})
        return
    }else{
        var sql = "SELECT * FROM users WHERE email="+"'"+email+"'"
        con.query(sql, (err, result)=>{
            if(err){
                res.status(500).json({response: "database error"})
                return
            }else if(result.length < 1){
                //never tell why auth failed. (could give hackers clues)
                res.status(404).json({response: "auth failed"})
                return
            }else{
                var hashedPass = result[0].password
                bcrypt.compare(passwordPlain, hashedPass, (err, good)=>{
                    if(good){
                        const token = jwt.sign({
                            id: result[0].user_id,
                            email: result[0].email
                        },process.env.JWT_SECRET)
                        res.status(200).json({response: "successful",
                                              token: token,
                                              user_id: result[0].user_id})
                        return
                    }else{
                        //never tell why auth failed. (could give hackers clues)
                        res.status(404).json({response: "auth failed"})
                        return
                    }
                })
            }
        })
    }
})

router.get('/:userId', checkAuth, (req, res)=>{
    if(!req.params.userId)return res.status(400).json({response: "bad request"})
    
    var sql = "SELECT id, name, email, picture_url FROM users WHERE user_id="+req.params.userId
    con.query(sql, (err, result)=>{
        if(err){
            return res.status(500).json({response: "server error"})
        }
        else{
            if(result.length > 0)
                res.status(200).json(result[0])
            else
                res.status(404).json({response: "not found"})
        }
    })
})

//change login credientials i.e email and/or password
router.patch('/:userId/email', checkAuth, (req, res)=>{
    if(!req.params.userId || !req.body.password || !req.body.new_email) return res.status(400).json({response:"bad request"})
    if(req.authData.id != req.params.userId)return res.status(403).json({response:"forbidden"})
    var plainPass = req.body.password
    var sql = "SELECT password FROM users WHERE user_id="+req.params.userId
    con.query(sql, (err, result)=>{
        if(err)return res.status(500).json({response:"server error"})
        else{
            bcrypt.compare(plainPass, result[0].password,(err, good)=>{
                if(err)return res.status(500).json({response:"server error"})
                if(good){
                    sql = "UPDATE users SET email="+"'"+req.body.new_email+"'"+"WHERE user_id="+req.params.userId
                    con.query(sql,(err)=>{
                        if(err){
                            if(err.errno == 1062) return res.status(409).json({response: "Email Already In Use"})
                            
                            res.status(500).json({response: "server error"})
                            return
                        }
                        else{
                            const token = jwt.sign({
                                id: req.params.userId,
                                email: req.body.new_email
                            },process.env.JWT_SECRET)
                            res.status(200).json({response: "successful",
                                                  token: token,
                                                  user_id: req.params.userId})
                        }
                    })
                }else{
                    return res.status(400).json({response:"auth failed"})
                }
            })
        }
    })
})

router.patch('/:userId/password', checkAuth, (req, res)=>{
    if(!req.params.userId || !req.body.password || !req.body.new_password)return res.status(400).json({response:"bad request"})
    const plainPass = req.body.password
    const id = req.params.userId
    if(id != req.authData.id) return res.status(403).json({response:"forbidden"})
    var sql = "SELECT password FROM users WHERE user_id="+id
    con.query(sql,(err, result)=>{
        if(err)return res.status(500).json({response:"server error"})
        else{
            bcrypt.compare(plainPass, result[0].password, (err, good)=>{
                if(err)return res.status(500).json({response:"server error"})
                if(good){
                    bcrypt.hash(req.body.new_password, 10, (err, hash)=>{
                        if(err)return res.status(500).json({response:"server error"})
                        else{
                            sql = "UPDATE users SET password="+"'"+hash+"'"+" WHERE user_id ="+id
                            con.query(sql, (err, result)=>{
                                if(err)return res.status(500).json({response:"server error"})
                                else{
                                    return res.status(201).json({response:"success"})
                                }
                            })
                        }
                    })
                }
                else return res.status(400).json({response:"auth error"})
            })
        }
    })
})

//should add deletion of photo alsos
router.delete('/:userId', checkAuth, (req, res)=>{
    if(!req.params.userId) return res.status(400).json({response: "bad request"})
    const id = req.params.userId
    if(req.authData.id != id)return res.status(403).json({response: "forbidden"})
    var sql = "DELETE FROM users WHERE user_id="+id
    con.query(sql, (err)=>{
        if(err)return res.status(500).json({response: "server error"})
        else{
            sql = "DELETE FROM comments WHERE user_id="+id
            con.query(sql, (err)=>{
                if(err)return res.status(500).json({response: "server error"})
                else{
                    sql = "DELETE FROM posts WHERE user_id="+id
                    con.query(sql, (err)=>{
                        if(err)return res.status(500).json({response: "server error"})
                        else return res.status(201).json({response: "success"})
                    })
                }
            })

        }
            
    })
})

//to change name
router.patch('/:userId', checkAuth, (req, res)=>{
    if(!req.params.userId || !req.body.name)return res.status(400).json({response: "bad request"})
    if(req.params.userId != req.authData.id)return res.status(403).json({response: "forbidden"})
    var sql = "UPDATE users SET name ='"+req.body.name+"' WHERE user_id="+req.params.userId
    con.query(sql, (err)=>{
        if(err)return res.status(500).json({response:"server error"})
        else return res.status(201).json({response:"success"})
    })
})

router.post('/picture', checkAuth, (req,res)=>{
    var data = new Buffer('');
    req.on('data', function(chunk) {
        data = Buffer.concat([data, chunk]);
    });
    req.on('end', function() {
        var id = "user-"+req.authData.id
        cloudinary.v2.uploader.upload_stream({resource_type: 'image', public_id:id}, 
        function(error, result){
            if(error)return res.status(500).json({response:"server error"})
            else{
                var sql = "UPDATE users SET picture_url ='"+result.public_id+"'"
                con.query(sql, (err)=>{
                    if(err)return res.status(500).json({response:"server error"})
                    else return res.status(201).json({response:"successful"})
                })
            }
        })
        .end(data);
    });
    
})



module.exports = router