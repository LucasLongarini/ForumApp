const mysql = require('mysql')

var connection = mysql.createConnection({
    host: "us-cdbr-iron-east-01.cleardb.net",
    user: "b9722f7bd3eaa8",
    password: "c883147f",
    database: "heroku_e5f64c95cb1c6a1"
})

connection.connect((err)=>{
    if (err) throw err
    console.log('Connected to MySQL')
})

module.exports = connection;