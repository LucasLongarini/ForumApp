const mysql = require('mysql')

// var connection = mysql.createConnection({
//     connectionLimit: 10,
//     host: "us-cdbr-iron-east-01.cleardb.net",
//     user: "b9722f7bd3eaa8",
//     password: "c883147f",
//     database: "heroku_e5f64c95cb1c6a1"
// })

// // connection.connect((err)=>{
// //     if (err) throw err
// //     console.log('Connected to MySQL')
// // })

const connection = mysql.createPool({
    connectionLimit:10,
    host: "us-cdbr-iron-east-01.cleardb.net",
    user: "b9722f7bd3eaa8",
    password: "c883147f",
    database: "heroku_e5f64c95cb1c6a1"
})

module.exports = connection;