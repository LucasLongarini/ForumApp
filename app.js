const express = require('express');
const app = express()
const mysql = require('mysql')
const bodyParser = require('body-parser')
const con = require('./api/db')

app.use(bodyParser.json())

const postRoutes = require('./api/routes/posts')
const commentRoutes = require('./api/routes/comments')
const userRoutes = require('./api/routes/users')

//localhost:3000
app.listen(3000, ()=>{
    console.log("Server Listening on port 3000")
})

app.get('/', (req, res)=>{
    res.status(200).json({response:"Root"})
})

app.use('/posts', postRoutes)

app.use('/comments',commentRoutes)

app.use('/users', userRoutes)

//database cleanup
var interval = 43200000 //12 hours
setInterval(()=>{
    var sql1 = "DELETE FROM post_like_record WHERE like_value=0"
    var sql2= "DELETE FROM comments_like_record WHERE like_value=0"
    con.query(sql1, (err1)=>{
        if(err1) console.log(err1)
    })
    con.query(sql2, (err2)=>{
        if(err2)console.log(err2)
    })
}, interval)

//error handling
app.use((req, res, next)=>{
    const error = new Error('Not Found')
    error.status(404)
    next(error)
})

app.use((error, req, res, next)=>{
    res.status(error.status || 500).json({error:error.message})
})