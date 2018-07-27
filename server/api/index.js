import express from 'express'
import user from './router/user'
import building from './router/building'
import demand from './router/demand'
import order from './router/order'
import wxRouter from './router/weixin'

const apiRouter = express.Router()

global.wxconfig = require('../weixin/wx.config') //微信配置文件
//微信配置信息
const wxConfig = {
    appid: wxconfig.appid, //公众号ID
    mchid: wxconfig.mchid, //微信商户号
    partnerKey: wxconfig.partnerKey, //微信支付安全密钥
    pfx: require('fs').readFileSync(wxconfig.pfx), //证书文件路径
    notify_url: wxconfig.notify_url, //支付回调网址
    spbill_create_ip: wxconfig.spbill_create_ip //IP地址
}

const tenpay = require('../weixin/pay/index.js'); //微信支付tenpay
global.api = new tenpay(wxConfig)
var middleware = api.middlewareForExpress();


apiRouter
    .use('/user', user) //
    .use('/building', building)
    .use('/demand', demand)
    .use('/order', order)

	.use('/wx', middleware,wxRouter)


export default apiRouter