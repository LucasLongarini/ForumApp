const express = require('express')
const router = express.Router()
const con = require('../db')
const time_stamp = require('../time_stamp')
const checkAuth = require('../auth')

//{content,user_id}
router.post('/:PostId',checkAuth, (req, res)=>{
    if(!req.body.content || !req.params.PostId || !req.body.user_id)return res.status(400).json({response:"bad request"})
    if(req.body.user_id != req.authData.id)return res.status(403).json({response:"forbidden"})
    var date = time_stamp.getDateNow()
    const sql = "INSERT INTO comments (content, post_id, user_id, date_posted) "+
    "VALUES ('"+req.body.content+"', '"+req.params.PostId+"', '"+req.body.user_id+"', '"+date+"')"
    con.query(sql, (err, results)=>{
        if(err){
            res.status(500).json({response: "server error"})
            return
        }else{
            var sql2 = "UPDATE posts SET comments = comments + 1 WHERE id="+req.params.PostId
            con.query(sql2, (err)=>{
                if(err) return res.status(400).json({response: "Error"})
                
                else return res.status(201).json({response: "Success"})
            })
        }
    })
})

router.get('/:PostId', checkAuth, (req, res)=>{
    var id = req.params.PostId
    var sql = "SELECT comments.*, users.user_id, users.name, users.picture_url FROM comments, users "+ 
    "WHERE comments.post_id = "+id+" AND users.user_id = comments.user_id ORDER BY comments.date_posted DESC"
    con.query(sql, (err, result)=>{
        if(err){
            res.status(500).json({response: "server error"})
            return
        }else{
            for(var i=0; i<result.length; i++){
                var user = {id: result[i].user_id, name: result[i].name, picture_url: result[i].picture_url}
                result[i].user = user
                delete result[i].user_id; delete result[i].name; delete result[i].picture_url
                result[i].time_elapsed = time_stamp.getSecondsPast(result[i].date_posted)
                delete result[i].date_posted
            }
            res.status(200).json(result)
        }
    })
})

router.patch('/votes/:PostId/:CommentId',checkAuth, (req, res) => {
    var value = req.query.value
    var type;
    if(value == '1'){
        type = "+ 1"
    }
    else if(value == '-1'){
        type = "- 1"
    }
    else{
        res.status(400).json({response:'bad request'})
        return
    }
    var sql = "UPDATE comments SET votes = votes " + type + " WHERE id="+req.params.CommentId+
    " AND post_id="+req.params.PostId
    con.query(sql, (err, result)=>{
        if(err){
            res.status(500).json({response:"server error"})
            return
        }
        else{
            res.json({response:"successful"})
        }
    })
})

router.get('/votes/:PostId/:CommentId', checkAuth, (req, res)=>{
    if(!req.params.CommentId || !req.params.PostId)return res.status(400).json({response:"bad request"})
    var sql = "SELECT votes FROM comments WHERE id="+req.params.CommentId + 
    " AND post_id="+req.params.PostId
    con.query(sql, (err,result)=>{
        if(err){
            res.status(500).json({response:"server error"})
            return
        }else{
            res.status(200).json(result[0])
            return
        }
    })
})

router.get('/:CommentId', checkAuth, (req,res)=>{
    if(!req.params.CommentId)return res.status(400).json({response:"bad request"})
    var sql = "SELECT * FROM comments WHERE id="+req.params.CommentId 
    con.query(sql, (err,result)=>{
        if(err){
            res.status(500).json({response:"server error"})
            return
        }
        else{
            result[0].time_elapsed = time_stamp.getSecondsPast(result[0].date_posted)
            res.status(200).json(result[0])
        }
    })
})

router.delete('/:PostId/:CommentId', checkAuth, (req,res)=>{
    if(!req.params.CommentId || !req.body.user_id || !req.params.PostId)return res.status(400).json({response:"bad request"})
    if(req.body.user_id != req.authData.id)return res.status(403).json({response:"forbidden"})
    var sql = "DELETE FROM comments WHERE id="+req.params.CommentId
    con.query(sql, (err, result)=>{
        if(err)return res.status(500).json({response:"server error"})
            
        else{
            var sql2 = "UPDATE posts SET comments = comments - 1 WHERE id="+req.params.PostId
            con.query(sql2, (error)=>{
                if(error) return res.status(500).json({response:"server error"}) 

                else return res.status(201).json({response:"Success"})
            })
        }            
    })
})

router.patch('/:CommentId',checkAuth, (req, res)=>{
    if(!req.params.CommentId || !req.body.content || !req.body.user_id)return res.status(400).json({response:"bad request"})
    if(req.body.user_id != req.authData.id)return res.status(403).json({response:"forbidden"})
    var sql = "UPDATE comments SET content = "+"'"+req.body.content+"'"+
    " WHERE id="+req.params.CommentId
    con.query(sql,(err,result)=>{
        if(err){
            res.status(400).json({result:"Error"})
        }
        else{
            res.status(201).json({result:"Success"})
        }
    })
})

module.exports = router