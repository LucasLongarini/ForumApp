const express = require('express');
const app = express()
const mysql = require('mysql')
const bodyParser = require('body-parser')

app.use(bodyParser.json())


//localhost:3000
app.listen(3000, ()=>{
    console.log("Server Listening on port 3000")
})

app.get('/', (req, res)=>{
    res.status(200).json({response:"Root"})
})