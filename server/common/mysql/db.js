// import mysql from 'mysql'
// import dbConfig from '../../db'
// import utils from '../lib/utils.js'
const mysql = require('mysql')
const dbConfig = require('../../db')
const utils = require('../lib/utils.js')

console.warn(dbConfig)
const pool = mysql.createPool(dbConfig.dbConfig)

// exports.connection = pool.getConnection(
//     function(err, connection){
//         if(err){
//             throw err
//         }else{
//             return connection
//         }
//     }
// )

exports.pool = pool

exports.query = function(sql, values) {
    // utils.log(sql,values)
    // logSql()
    return new Promise((resolve, reject) => {
        pool.getConnection((err, connection) => {
            if (err) {
                reject(err)
            } else {
                let q=connection.query(sql, values, (err, rows) => {
                    if (err) {
                        reject(err)
                    } else {
                        resolve(rows)
                    }
                    connection.release()
                })

                console.log(q.sql+';','\n')
            }
        })
    })
}


// function logSql(sql, values) {
// 	let i=0
//     let arr = sql.split('?').map(v => {
//     	v+=values
//     })
// }