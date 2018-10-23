const express = require('express');
const app = express()
const mysql = require('mysql')
const bodyParser = require('body-parser')


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