import express from 'express'
import order from '../../controller/order'

const Router = express.Router()

Router


    .post('/addAdviser', async(req, res) => { // 分配订单的楼盘顾问

        const result = await order.addAdviser(req, res)
        res.json(result)
    })

    .post('/pay', async(req, res) => { // 统一下单、支付签名

        const result = await order.pay(req, res)
        res.json(result)
    })
    
    .get('/unpaidBillCount', async(req, res) => { // 查询待支付账单数量

        const result = await order.unpaidBillCount(req, res)
        res.json(result)
    })
    .get('/bill', async(req, res) => { // 查询账单

        const result = await order.getBill(req, res)
        res.json(result)
    })
    .post('/report', async(req, res) => { // 添加报备

        const result = await order.report(req, res)
        res.json(result)
    })
    .post('/startCoporation', async(req, res) => { // 发起合作

        const result = await order.startCoporation(req, res)
        res.json(result)
    })
    .post('/confirmCoporation', async(req, res) => { // 确认合作

        const result = await order.confirmCoporation(req, res)
        res.json(result)
    })
    .get('/coporationList', async(req, res) => { // 查看合作通知列表

        const result = await order.coporationList(req, res)
        res.json(result)
    })
    .get('/list', async(req, res) => { // 查询客户列表（客户订单列表）
        /**
            入参：
            {
                token:'',
                district:'',
                reported:'',
                seen:'',
                signed:'',
                done:'',
                userId:''
            }
            返回：{}
        */
        const result = await order.list(req, res)
        res.json(result)
    })
    .post('/comment', async(req, res) => { // 对接待员进行评价
        /**
            入参：
            {
                token:'',
                orderId:''
            }
            返回：{status:true|false}
        */
        const result = await order.comment(req, res)
        res.json(result)
    })
    // .post('/confirmSeen', async(req, res) => { // 确认带看
    //     *
    //         入参：
    //         {
    //             token:'',
    //             orderId:''
    //         }
    //         返回：{status:true|false}

    //     const result = await order.confirmSeen(req, res)
    //     res.json(result)
    // })
    // .post('/confirmSigned', async(req, res) => { // 确认签约
    //     /**
    //         入参：
    //         {
    //             token:'',
    //             orderId:''
    //         }
    //         返回：{status:true|false}
    //     */
    //     const result = await order.confirmSigned(req, res)
    //     res.json(result)
    // })
    // .post('/confirmDone', async(req, res) => { // 确认结佣
    //     /**
    //         入参：
    //         {
    //             token:'',
    //             orderId:''
    //         }
    //         返回：{status:true|false}
    //     */
    //     const result = await order.confirmDone(req, res)
    //     res.json(result)
    // })
    .get('/', async(req, res) => { // 查询订单详情
        /**
            入参：
            {
                token:'',
                orderId:''
            }
            返回：{status:true|false}
        */
        const result = await order.get(req, res)
        res.json(result)
    })
    .get('/statistics', async(req, res) => { // 我的成果查询
        /**
            入参：
            {
                token:'',
            }
            返回：{status:true|false}
        */

        const result = await order.statistics(req, res)
        res.json(result)
    })
    .post('/state', async(req, res) => { // 我的成果查询

        const result = await order.state(req, res)
        res.json(result)
    })

export default Router