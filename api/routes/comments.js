const express = require('express')
const router = express.Router()
const con = require('../db')
const time_stamp = require('../time_stamp')
const checkAuth = require('../auth')

router.post('/:PostId',checkAuth, (req, res)=>{
    if(!req.body.content || !req.params.PostId)return res.status(400).json({response:"bad request"})
    var date = time_stamp.getDateNow()
    const sql = "INSERT INTO comments (content, post_id, user_id, date_posted) "+
    "VALUES ('"+req.body.content+"', '"+req.params.PostId+"', '"+req.authData.id+"', '"+date+"')"
    con.query(sql, (err)=>{
        if(err) return res.status(500).json({response: "server error"})
        else{
            var sql2 = "UPDATE posts SET comments = comments + 1 WHERE id="+req.params.PostId
            con.query(sql2, (err)=>{
                if(err) return res.status(500).json({response: "server error"})
                else return res.status(201).json({response: "Success"})
            })
        }
    })
})

router.get('/:PostId', checkAuth, (req, res)=>{
    if(!req.params.PostId)return res.status(400).json({response: "bad request"})
    var id = req.params.PostId
    var sql = "SELECT comments.*, users.user_id, users.name, users.picture_url, COALESCE(comments_like_record.like_value, 0) AS like_value FROM comments "+
          "INNER JOIN users ON users.user_id = comments.user_id "+
          "LEFT JOIN comments_like_record ON comments_like_record.user_id = "+req.authData.id+" AND comments_like_record.comment_id = comments.id "+
          "WHERE comments.post_id = "+id+" ORDER BY comments.date_posted DESC"
    con.query(sql, (err, result)=>{
        if(err)return res.status(500).json({response: "server error"})
            
        else{
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

router.patch('/:CommentId/votes',checkAuth, (req, res) => {
    var value = req.query.value
    if(!req.params.CommentId||!req.query.value || (value!='-1'&&value!='1'&&value!='+1'))return res.status(400).json({response:"bad request"})
    var type;

    if(value == '1'||value=='+1')type = "+1"
    else if(value == '-1')type = "-1"
    else return res.status(400).json({response:'bad request'})
    
    var sql = "UPDATE comments SET votes = votes " + type + " WHERE id="+req.params.CommentId
    con.query(sql, (err)=>{
        if(err) return res.status(500).json({response:"server error"})
        else{
            sql = "INSERT INTO comments_like_record (user_id, comment_id, like_value) "+
                  "VALUES ('"+req.authData.id+"','"+req.params.CommentId+"','"+type+"') "+
                  "ON DUPLICATE KEY UPDATE like_value=like_value "+type
            con.query(sql, (err)=>{
                if(err) return res.status(500).json({response:"server error"})
                else return res.json({response:"successful"})
            })
        }
    })
})

router.get('/:CommentId/votes', checkAuth, (req, res)=>{
    if(!req.params.CommentId)return res.status(400).json({response:"bad request"})
    var sql = "SELECT votes FROM comments WHERE id="+req.params.CommentId
    con.query(sql, (err,result)=>{
        if(err)return res.status(500).json({response:"server error"})
        else return res.status(200).json(result[0])
    })
})

router.get('/:CommentId/single', checkAuth, (req,res)=>{
    if(!req.params.CommentId)return res.status(400).json({response:"bad request"})
    var sql = "SELECT comments.*, users.user_id, users.name, users.picture_url, COALESCE(comments_like_record.like_value, 0) AS like_value FROM comments "+
              "INNER JOIN users ON users.user_id = comments.user_id "+
              "LEFT JOIN comments_like_record ON comments_like_record.user_id = "+req.authData.id+" AND comments_like_record.comment_id = comments.id "+
              "WHERE comments.id = "+req.params.CommentId
    con.query(sql, (err,result)=>{
        if(err)return res.status(500).json({response:"server error"})
        else{
            var user = {id: result[0].user_id, name: result[0].name, picture_url: result[0].picture_url}
                result[0].user = user
                delete result[0].user_id; delete result[0].name; delete result[0].picture_url
                result[0].time_elapsed = time_stamp.getSecondsPast(result[0].date_posted)
                delete result[0].date_posted
            return res.status(200).json(result[0])
        }
    })
})

router.delete('/:PostId/:CommentId', checkAuth, (req,res)=>{
    if(!req.params.CommentId || !req.params.PostId)return res.status(400).json({response:"bad request"})
    var sql = "DELETE FROM comments WHERE id="+req.params.CommentId+" AND user_id="+req.authData.id
    console.log(sql)
    con.query(sql, (err, result)=>{
        if(err)return res.status(500).json({response:"server error"})
        else if(result.affectedRows < 1) return res.status(404).json({response:"not found"})
        else{
            console.log(result)
            var sql2 = "UPDATE posts SET comments = comments - 1 WHERE id="+req.params.PostId
            con.query(sql2, (error)=>{
                if(error) return res.status(500).json({response:"server error"}) 

                else return res.status(201).json({response:"Success"})
            })
        }            
    })
})

router.patch('/:CommentId',checkAuth, (req, res)=>{
    if(!req.params.CommentId || !req.body.content )return res.status(400).json({response:"bad request"})
    var sql = "UPDATE comments SET content = "+"'"+req.body.content+"'"+
    " WHERE id="+req.params.CommentId+" AND user_id="+req.authData.id
    con.query(sql,(err,result)=>{
        if(err)return res.status(500).json({result:"server error"})
        if(result.affectedRows < 1)return res.status(404).json({result:"not found"})
        else return res.status(201).json({result:"Success"})
    })
})

module.exports = router