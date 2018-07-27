require('import-export');

const express = require('express');
const bodyParser = require('body-parser')
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const cookieParser = require('cookie-parser');
const apiRouter = require('./api');

const db = require('./common/mysql/db');
const async = require("async");
const http = require('http');
const log4js_lib = require('log4js');
const config = require('./config');
const _ = require('lodash')

process.on('uncaughtException', function(err) {
    console.log('Caught exception: ', err);
});

const utils = require('./common/lib/utils')


const app = express()

const fs = require('fs');
const path = require('path');
// var options = {
//     key:fs.readFileSync('./keys/server.key'),
//     cert:fs.readFileSync('./keys/server.crt')
// }
// const server = http.createServer(options,app)
const server = http.createServer(app)
server.listen(3002)


// log4j 配置
log4js_lib.configure(config.log)

// 解析表单post数据
app.use(bodyParser.urlencoded({
    extended: true
}))
app.use(bodyParser.json())

// cookie、session配置
// app.use(session({
//     secret: 'fdsam$#FSKaewrewd2423fdsafe',
//     cookie: {
//         maxAge: 60 * 1000 * 30
//     },
//     store: new FileStore(),
//     resave: false,
//     saveUninitialized: false,
// }))

const fileUpload = require('express-fileupload');

app.use(fileUpload());

global.conf = {
    baseAssetsUrl: config.baseAssetsUrl,
}
global.sessionUsers = []


// 设置为全局数据库连接句柄
global.query = db.query
global.async = async
global.pool = db.pool
global.log4js = log4js_lib.getLogger()
global.config = config


// global.workflowMap = {}

// query('select * from workflow order by (number+0) ', function(error, results, fields) {
//     if (error) throw error;
//     global.workflow = results
//     results.forEach(v => {
//         workflowMap[v.number] = v
//     })
// })





const excludeUrls = ['/wx/payCallback','/weixin/pay','/user/banner', '/user/unReadNoticeCount', '/building/list', '/user/wxCode', '/user/wxCode', '/user/wxGetUserInfo', '/user/decryptData']
// 资源路径
app.use('/assets', express.static(path.join(__dirname, 'static\\uploads')));

//拦截器
app.use(function(req, res, next) {

    // token每一次入口访问进来都生成一个新的（绑过卡状态才能生成token，新token生成则替换老token，
    // 服务器重启后服务端token丢失客户端做重新记录token），植入客户端，本次打开小程序都使用同一个token，token有效期为24小时。

    const token = req.header('token') || req.body.token
    req.user = sessionUsers[token];
    const isExclude = excludeUrls.includes(req.path)

    if (token && req.user || isExclude) {

        // console.log('拦截器req.path=>', req.path,token,req.user,isExclude)
        next();
    } else {
        console.log('拦截器：req.path,req.body,token,req.user==>', req.path, req.body, token, req.user)
        res.json({ msg: 'token失效，请刷新重试', reload: 1 })
    }
})



// app.use(function(req, res, next) {
//     //拦截公司为空的user，且已经被公司询问了，有则要求用户确认
//     if(!req.user || !req.user.token){next()}
//     let resData = { token: req.user.token }
//     if (req.user.phoneNum && !req.user.companyId) {
//         query('select tu.id, c.companyName,c.companyAddress from tempUser as tu inner join company as c on c.id = tu.companyId where tu.phoneNum = ? and tu.handled is null', [req.user.phoneNum], function(error, results, fields) {
//             if (results.length) {
//                 resData.staff = promise3
//                 resData.msg = `请确认您是否是 ${promise3[0].companyName} ${promise3[0].companyAddress} 的员工。`
//                 res.json(resData)
//                 //return resData;
//             }else{
//                 next()
//             }
//         })

//     }
// })


// 使用路由
app.use('/', apiRouter)

// //微信支付回调中间件
// var middleware = api.middlewareForExpress();
// app.use('/pay', middleware,weixinRouter)


console.log('server ready on port 3002')

module.exports = app