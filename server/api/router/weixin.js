import express from 'express'
import weixin from '../../controller/weixin'

const Router = express.Router()

Router

    // .post('/pay', async(req, res) => { // 统一下单、支付签名

    //     const result = await weixin.pay(req, res)
    //     res.json(result)
    // })
    .post('/payCallback', async(req, res) => { // 支付流水

        const isSuccess = await weixin.payLog(req, res)

        res.type('application/xml');

        if(isSuccess){
            res.end('<xml><return_code><![CDATA[SUCCESS]]></return_code><return_msg><![CDATA[OK]]></return_msg></xml>');
        }else{
            res.end('<xml><return_code><![CDATA[ERROR]]></return_code><return_msg><![CDATA[NO]]></return_msg></xml>');
        }
    })

export default Router
