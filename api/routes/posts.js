const express = require('express')
const router = express.Router()
const checkAuth = require('../auth')
const timeStamp = require('../time_stamp')
const con = require('../db')


router.post('/',checkAuth, (req, res) =>{
    if(!req.body.content || !req.body.user_id) return res.status(400).json({response:"bad request"})
    if(req.authData.id != req.body.user_id) return res.status(403).json({response:"forbidden"}) 
    var date = timeStamp.getDateNow()
    var sql = "INSERT INTO posts (content, user_id, date_posted) VALUES ('"
    +req.body.content+"', '"+req.body.user_id+ "', '"+date+"')"
    con.query(sql, (err, result)=>{
        if (err) {
            res.status(500).json({response:"server error"})
            return
        }else{
            res.status(201).json({response:"successful"})
        }
    })
})

//recent?page=#
router.get('/recent',checkAuth, (req, res)=>{
    if(!req.query.page){
        res.status(400).json({response:"bad request"})
        return
    }
    var page = req.query.page
    if(!Number.isInteger(Number(page)) || page == '0'){
        res.status(400).json({response:"bad request"})
        return
    }
    const pageSize = 10
    var startRecord = pageSize*(page-1)

    var sql = "SELECT posts.*, users.name, users.user_id, users.picture_url, COALESCE(post_like_record.like_value, 0) AS like_value FROM posts "+
          "INNER JOIN users ON users.user_id = posts.user_id "+
          "LEFT JOIN post_like_record ON post_like_record.user_id = posts.user_id AND post_like_record.post_id = posts.id "+
          "WHERE posts.date_posted <='"+timeStamp.getDateNow()+"' "+
          "ORDER BY posts.date_posted DESC LIMIT "+startRecord+", "+pageSize 
    con.query(sql, (err, response)=>{
        if(err){
            console.log(err)
            res.status(500).json({response:"server error"})
            return
        }else{
            for(i=0; i<response.length; i++){
                var user = {id: response[i].user_id, name: response[i].name, picture_url: response[i].picture_url}
                response[i].user = user
                delete response[i].user_id; delete response[i].name; delete response[i].picture_url
                response[i].time_elapsed = timeStamp.getSecondsPast(response[i].date_posted)
                delete response[i].date_posted
            }
            res.status(200).json(response)
        }
    })
})

//trending?page=#
router.get('/trending',checkAuth, (req, res)=>{
    if(!req.query.page){
        res.status(400).json({response:"bad request"})
        return
    }
    var page = req.query.page
    if(!Number.isInteger(Number(page)) || page == '0'){
        res.status(400).json({response:"bad request"})
        return
    }
    const pageSize = 10
    var startRecord = pageSize*(page-1)

    var startDay = timeStamp.getBeggingOfDay()
    var nextDay = timeStamp.getNextDay()

    // var sql = "SELECT posts.*, users.user_id, users.name, users.picture_url FROM posts, users"+
    // " WHERE posts.date_posted >= "+"'"+startDay+"'"+" "+"AND posts.date_posted < "+"'"+nextDay+"'" + "AND posts.votes >= 0"+
    // " AND users.user_id = posts.user_id"+                                                 
    // " ORDER BY posts.votes DESC LIMIT "+startRecord+", "+pageSize 

    var sql = "SELECT posts.*, users.user_id, users.name, users.picture_url, post_like_record.like_value FROM posts "+
          "INNER JOIN users ON users.user_id = posts.user_id "+
          "LEFT JOIN post_like_record ON post_like_record.user_id = posts.user_id AND post_like_record.post_id = posts.id "+
          "WHERE posts.date_posted >= "+"'"+startDay+"'"+" "+"AND posts.date_posted < "+"'"+nextDay+"'" + "AND posts.votes >= 0 "+
          "ORDER BY posts.votes DESC LIMIT "+startRecord+", "+pageSize 

    con.query(sql, (err, response)=>{
        if(err){
            res.status(500).json({response: "server error"})
            return
        }
        else{
            for(i=0; i<response.length; i++){
                var user = {id: response[i].user_id, name: response[i].name, picture_url: response[i].picture_url}
                response[i].user = user
                delete response[i].user_id; delete response[i].name; delete response[i].picture_url
                response[i].time_elapsed = timeStamp.getSecondsPast(response[i].date_posted)
                delete response[i].date_posted
            }
            res.status(200).json(response)
        }
    })
})

router.get('/:PostId',checkAuth, (req, res)=>{
    const id = req.params.PostId
    var sql = "SELECT posts.*, users.name, users.user_id, users.picture_url FROM posts, users WHERE posts.id="+id +
    " AND users.user_id = posts.user_id"
    con.query(sql, (err, result)=>{
        if(err){
            res.status(500).json({response: "server error"})
            return
        }
        else{
            var user = {id: result[0].user_id, name: result[0].name, picture_url: result[0].picture_url}
            result[0].user = user
            delete result[0].user_id; delete result[0].name; delete result[0].picture_url
            result[0].time_elapsed = timeStamp.getSecondsPast(result[0].date_posted)
            delete result[0].date_posted
            res.status(200).json(result[0])
        }
    })
})

router.patch('/:PostId',checkAuth, (req, res)=>{
    if(!req.body.content|| !req.body.user_id) return res.status(400).json({response: "bad request"})
    if(req.authData.id != req.body.user_id) return res.status(403).json({response: "forbidden"})
    const postID = req.params.PostId
    var sql = "UPDATE posts SET content ='" + req.body.content + "' WHERE id = "+postID+
    " AND user_id ="+req.authData.id
    con.query(sql, (err, response)=>{
        if(err){
            res.status(500).json({response: "server error"})
            return
        }else{
            res.status(201).json({response: "success"})
        }
    })
})

router.delete('/:PostId',checkAuth, (req, res)=>{
    if(!req.body.user_id)return res.status(400).json({response: "bad request"})
    if(req.authData.id != req.body.user_id) return res.status(403).json({response: "forbidden"})
    var id = req.params.PostId
    var sql = "DELETE FROM posts WHERE id="+id + " AND user_id="+req.authData.id
    con.query(sql, (err, response)=>{
        if(err){
            res.status(500).json({response:"server error"})
            return
        }else{
            var sql2 = "DELETE FROM comments WHERE post_id="+id
            con.query(sql2, (err, response)=>{
                if(err)
                    return status(500).json({response:"server error"})
                else
                    return res.status(200).json({response:"Success"})
            })
        }
    })
})

router.get('/:PostId/votes',checkAuth, (req, res)=>{
    const id = req.params.PostId
    var sql = "SELECT votes FROM posts WHERE id="+id
    con.query(sql, (err, response)=>{
        if(err){
            res.status(500).json({response:"server error"})
            return
        }else{
            res.status(200).json(response[0])
        }
    })
})

router.patch('/:PostId/votes',checkAuth, (req, res) => {
    var value = req.query.value
    var type;
    if(value == '1' ||value == '+1'){
        type = "+1"
    }
    else if(value == '-1'){
        type = "-1"
    }
    else{
        res.status(404).send('bad request')
        return
    }
    var sql = "UPDATE posts SET votes = votes " + type + " WHERE id="+req.params.PostId
    con.query(sql, (err)=>{
        if(err){
            res.status(500).json({response:'server error'})
            return
        }
        else{
            var like;
            if(type == '+1'){like = 1}
            else {like = -1}
            sql = "INSERT INTO post_like_record (user_id, post_id, like_value) VALUES ('"+req.authData.id+"','"+req.params.PostId+"','"+like+"')"
            con.query(sql, (err)=>{
                if(err)return res.status(500).json({response:'server error'})
                else return res.json({response:"successful"})
            })
        }
    })
})

module.exports = router