var utils = require('../common/lib/utils')
import _ from 'lodash'
import moment from 'moment'
const { select, insert, update, or, and, not, eq, like, $in, lt, gt, lte, gte, between } = require('sql-bricks');
const orderPo = `buildingId,demandId,type,originatorId,reportId,targetorId`.split(',')
export default class Order {


    static async addAdviser(req, res) { // 分配订单的楼盘顾问
        const { orderId, adviserId } = req.body
        const data = { targetorId: adviserId }
        return await query('update orders set ? where id = ?', [data, orderId])

    }

    static async pay(req, res) { // 统一下单、支付签名
        //['body', 'out_trade_no', 'total_fee','openid']

        const { billId } = req.body
        const promise = await query('select * from bill where id =?', [billId])


        const params = {
            openid: req.user.openId,
            out_trade_no: promise[0].billNum, // moment().format('YYYYMMDDHHmmss')+Math.random().toString().substring(2,5)
            total_fee: promise[0].amount * 100,
            body: 'hufangtong-pingtaifei'
        }
        console.log('支付签名参数=>', params)
        const result = await api.getPayParams(params)

        console.log('支付签名=>', result)
        return result

        //appId,nonceStr,signType,timeStamp,  package  统一下单接口返回的 prepay_id 参数值
    }
    static async unpaidBillCount(req, res) { // 查询待支付账单数量
        return await query('select count(*) from bill where payerId = ? and state = 0', [req.user.id]).catch((err) => { utils.log(err) })
    }
    static async getBill(req, res) {
        const { type } = req.body //type=1 平台查询应收款列表
        const data = {}
        let sql;
        if (!type) {
            sql = 'select * from bill where payerId = ? order by id desc'
        } else {
            sql = 'select * from bill where receiverId = ? order by id desc'
        }

        const promise = await query(sql, [req.user.id]).catch((err) => { utils.log(err) })
        const resData = { payedBill: [], unpayBill: [] }
        promise.map(v => {
            if (v.state) {
                resData.payedBill.push(v)
            } else {
                resData.unpayBill.push(v)
            }
        })
        return resData
    }

    static async report(req, res) {
        /** 添加报备
         * 
         */
        const { buildingId, showTime, customerName, customerGender, customerPhone, peopleCount, remarks, carNumber, busAddress, busTime, targetorId } = req.body
        // const user=sessionUsers[req.header('token')]
        const data = {
            buildingId,
            customerName,
            customerGender,
            customerPhone,
            showTime,
            peopleCount,
            remarks,
            carNumber,
            busAddress,
            busTime,
            reporterId: req.user.id,
        }
        const sql = 'insert into report set ?'
        const promise = await query(sql, [data]).catch((err) => { utils.log(err) })

        const data2 = {
            buildingId,
            targetorId,
            originatorId: req.user.id,
            reportId: promise.insertId,
            type: 0, //0报备订单；1楼盘发起的合作订单；2中介发起的二手房订单
            state: 1,
        }
        const sql2 = 'insert into orders set ?'
        const promise2 = await query(sql2, [data2]).catch((err) => { utils.log(err) })

        const data3 = {
            orderId: promise2.insertId,
            state: 1, //1报备订单     
            operateUserId: req.user.id,
            toUserId: targetorId, //下一个状态的接收人ID
        }
        const sql3 = 'insert into order_state set ?'
        const promise3 = await query(sql3, [data3]).catch((err) => { utils.log(err) })

        //查询出当前楼盘方所有员工的id （companyId）targetorId为发布楼盘用户的id
        const sql4 = 'select * from user where companyId in (select companyId from user where id = ?)'
        const promise4 = await query(sql4, [targetorId]).catch((err) => { utils.log(err) })

        const sql5 = 'insert into notice set ?'
        let data5 = { //报备消息发给楼盘方所有人
            orderId: promise2.insertId,
            fromUserId: req.user.id,
            toUserId: targetorId, //下一个状态的接收人ID
            msg: '', //消息模板，后续
        }
        // promise4.forEach(v => {
        for (let v of promise4) {
            data5.msg = `报备：${customerName} ${customerGender?'男':'女'} ${peopleCount} 出发时间：${showTime} ${busTime} | 车牌号：${carNumber} 报备带看，请及时线下联系处理。`;
            data5.toUserId = v.id
            let a = await global.query(sql5, [data5]).catch((err) => { utils.log(err) })
        }
        // })
        const sql6 = 'select * from building where id = ? limit 1'
        const promise6 = await query(sql6, [buildingId]).catch((err) => { utils.log(err) })

        data5.toUserId = req.user.id
        data5.msg = `您的报备 楼盘： ${promise6[0].buildingName} - 客户：${customerName} ${customerGender?'男':'女'} ${peopleCount}人 出发时间：${showTime} ${busTime} | 车牌号：${carNumber}  已通知到楼盘方。`;
        const promise5 = await query(sql5, [data5]).catch((err) => { utils.log(err) })

        return promise2
    }

    static async startCoporation(req, res) { // 发起合作
        //1.生成订单
        const { demandId, type } = req.body

        const demand = await query('select * from demand where id = ? limit 1', [demandId]).catch((err) => { utils.log(err) })

        const data1 = {
            demandId,
            targetorId: demand[0].userId,
            type: 1, //name: '报备订单', type: 0 },{ name: '楼盘发起的合作订单', type: 1 },{ name: '中介发起的二手房订单', type: 2 },
            originatorId: req.user.id,
            state: 3, //state => workfow.number
            // orderNum:''

        }
        //如果发起人是楼盘人员，根据companyId 查询出对应的楼盘id，插入order
        if (req.user.departmentNum == 1) {
            const promise0 = await query('select id from building where companyId = ?', [req.user.companyId]).catch((err) => { utils.log(err) })

            promise0[0] && (data1.buildingId = promise0[0].id)
        }
        //data1.originatorId=parseToken(req.body.token)

        const sql1 = 'insert into orders set ?'

        const promise1 = await query(sql1, data1).catch((err) => { utils.log(err) })

        //2.订单状态,
        const sql2 = 'insert into order_state set ?'

        const data2 = {
            state: 3, //
            orderId: promise1.insertId,
            operateUserId: req.user.id,
            toUserId: demand[0].userId
        }

        const promise2 = await query(sql2, [data2]).catch((err) => { utils.log(err) })

        //3.发送通知
        const sql3 = 'insert into notice set ?'
        const data3 = {
            orderId: promise1.insertId,
            orderStateId: promise2.insertId,
            fromUserId: req.user.id,
            toUserId: demand[0].userId,
            msg: `发起合作：来自 ${req.user.nickName} ${req.user.phoneNum} 客户：${demand[0].customerName}`,
        }

        await query(sql3, [data3]).catch((err) => { utils.log(err) })

        return { status: 'success' }
    }

    static async confirmCoporation(req, res) { // 确认合作
        return
    }
    static async state(req, res) { //操作订单状态
        const { orderId, toUserId, state } = req.body

        const msg = {
            '4': `同意合作：来自 ${req.user.nickName} ${req.user.phoneNum}`,
        }


        //1.更新订单表state
        const sqlOrder = 'update orders set ? where id = ?'

        await query(sqlOrder, [{ state }, orderId]).catch((err) => { utils.log(err) })

        //2.记录订单状态表数据
        const sql2 = 'insert into order_state set ?'

        const data2 = {
            state,
            orderId,
            operateUserId: req.user.id,
            toUserId,
        }

        const promise2 = await query(sql2, [data2]).catch((err) => { utils.log(err) })

        //3. 新房相关的订单，state为10 确认签约状态，向楼盘方发送账单 ==================
        if (state == 10) {
            const ob = await query('select * from orders as o inner join building as b on o.buildingId = b.id where o.id = ?', [orderId])
            const building = ob[0]

            const billData = {
                orderId,
                amount: building.platformFee, //楼盘给到平台的平台费，楼盘表 platformFee, amount 签名的时候单位为分
                payerId: building.userId, //楼盘管理 -------------------------------------------------------------------------
                receiverId: 1, //平台账户
                payerBuildingId: building.id,
                payerCompanyId: building.companyId,
                billNum: moment().format('YYYYMMDDHHmmss') + Math.random().toString().substring(2, 5)
            }
            await query('insert into bill set ?', [billData])
        }

        //4.发送订单状态通知
        const sql3 = 'insert into notice set ?'
        const data3 = {
            orderId,
            orderStateId: promise2.insertId,
            fromUserId: req.user.id,
            toUserId,
            msg: msg[state] || `新通知，注意查收`,
        }

        await query(sql3, [data3]).catch((err) => { utils.log(err) })

        return { status: 'success' }
    }

    static async coporationList(req, res) { // 查看合作通知列表,发起人和接收人
        const { token } = req.body
        const data = req.user
        const sql = 'select o.originatorId,o.confirmuserId,s.orderId,s.state from orders as o left join order_state as s where '
        const sql1 = sql + 'o.originatorId=?'
        const sql2 = sql + 'confirmuserId=?'

        const promise1 = await query(sql1, [data]).catch((err) => { utils.log(err) })

        const promise2 = await query(sql2, [data]).catch((err) => { utils.log(err) })

        return {
            ILaunched: promise1,
            IReciveded: promise2
        }
    }

    static async list(req, res) { // 查询客户列表（我的客户订单列表）
        //入参：[token] //reported,seen,signed,done 前台根据state字段判断

        const { state, token } = req.query

        //如果当前是经理或者管理员角色，查询出自己 团队 下属的所有ID，然后发起人和接收人是自己下属的订单都可以看到
        let sql0, promise0;
        if (req.user.rank == 1) { //管理员
            sql0 = 'select id from user where companyId = ?'
            promise0 = await query(sql0, [req.user.companyId]).catch((err) => { utils.log(err) })
        } else if (req.user.rank == 2) { //经理
            sql0 = 'select id from user where companyGroupId = ?'
            promise0 = await query(sql0, [req.user.companyGroupId]).catch((err) => { utils.log(err) })
        }
        const userIds = promise0.map(v => {
            return v.id
        })
        userIds.push(req.user.id)
        const userIdsString = _.uniq(userIds).join(',')

        //发起人和接受人有一个是自己的都可以查到订单 req.user.id where or
        let sql = 'select o.type,u1.name as originatorName,u1.nickName as originatorNickName,u2.name as targetorName,u2.nickName as targetorNickName, d.customerName as customerNameD,r.customerName as customerNameR,b.buildingName,d.budgetMin,d.budgetMax,o.timestamp,o.state,o.id as oid,b.id as bid,r.id as rid,d.id as did from orders as o left join user as u1 on o.originatorId = u1.id left join user as u2 on o.targetorId = u2.id left join building as b on o.buildingId=b.id left join report as r on o.reportId = r.id left join demand as d on o.demandId=d.id where (originatorId in (?) or targetorId in (?))'
        sql = sql.replace(/\?/g, userIdsString)
        //'select * from orders as o on b.id=o.buildingId left join building as b  left join report as r on o.reportId = r.id where originatorId=? or targetorId=?'
        //select * from building as b,report as r,orders as o,demand as d where (o.targetorId = 32 or originatorId = 32) and (b.id=o.buildingId and r.id=o.reportId) 
        //select * from orders as o left join building as b on b.id=o.buildingId   left join report as r on o.reportId = r.id where originatorId=? or targetorId=?
        const states = {
            1: [1, 2],
            3: [3, 4],
            5: [5, 6, 7],
            8: [8, 9],
            10: [10, 11],
            12: [12, 13]
        }
        state && (sql += ` and o.state in (${states[state]})`)

        const promise = await query(sql).catch((err) => { utils.log(err) })
        const workflowMap = {}
        // if (promise.length) {
        const workflow = await query('select * from workflow  where type = ? order by (number+0)', [1])
        workflow.forEach(v => {
            workflowMap[v.number] = v
        })
        // }

        promise.map(v => {
            // console.log('-------------->>>-----',v.state,workflow)
            v.stateName = workflowMap[v.state].name
            return v
        })
        return promise
    }

    static async comment(req, res) { // 对接待员进行评价
        //token,orderId,content
        const { token, orderId, content } = req.body
        //校验评论人拥有这个订单并且是可以评论的状态

        const data = {
            orderId,
            content,
            userId: req.user.id
        }
        const sql = 'insert into comment set ?'

        const promise = await query(sql, [data]).catch((err) => { utils.log(err) })
        return promise
    }

    // static async confirmSeen(req, res) { // 确认带看
    //     const { token, content, orderId } = req.body
    //     const data = {
    //         state: 4,
    //         orderId,
    //         content,
    //         operateUserId: req.user.id
    //     }
    //     const sql = 'insert into order_state set ?'

    //     const promise = await query(sql, [data]).catch((err) => { utils.log(err) })
    //     return promise
    // }

    // static async confirmSigned(req, res) { // 确认签约
    //     const { token, } = req.body
    //     const data = {
    //         state: 5,
    //         orderId,
    //         content,
    //         operateUserId: req.user.id
    //     }
    //     const sql = 'insert into order_state set ?'

    //     const promise = await query(sql, [data]).catch((err) => { utils.log(err) })
    //     return promise
    // }

    // static async confirmDone(req, res) { // 确认结佣
    //     const { token, } = req.body
    //     const data = {
    //         state: 6,
    //         orderId,
    //         content,
    //         operateUserId: req.user.id
    //     }
    //     const sql = 'insert into order_state set ?'

    //     const promise = await query(sql, [data]).catch((err) => { utils.log(err) })
    //     return promise
    // }

    static async get(req, res) { // 查询订单详情 
        const { orderId } = req.query

        const sql0 = 'select o.*,u.nickName as fromUserName,u.phoneNum as fromPhoneNum,u2.phoneNum as toPhoneNum,u2.nickName as toUserName,u.avatarUrl as fromAvatarUrl, u2.avatarUrl as toAvatarUrl,c.companyName as fromCompanyName,c2.companyName as toCompanyName from orders as o inner join user as u on o.originatorId = u.id inner join user as u2 on u2.id=o.targetorId inner join company as c on c.id = u.companyId inner join company as c2 on c2.id=u2.companyId where o.id=?'

        const promise0 = await query(sql0, [orderId]).catch((err) => { utils.log(err) })
        const order = promise0[0]
        let sqlReport, sqlDemand, report, demand, sqlBuilding, building, buidlingUserId;
        //报备和需求订单的查询结果 nickName，name,companyName都是接收人的
        if (order.reportId) { //报备订单//发起人是中介，
            buidlingUserId = order.targetorId;
            sqlReport = `select r.*,u.nickName,u.name,u.phoneNum,u.avatarUrl,c.companyName from report as r,user as u inner join company as c on u.companyId=c.id where r.id=${order.reportId} and u.id=${order.originatorId}`
            //sql1 = 'select r.*,b.*,o.* from report as r,building as b,orders as o where o.reportId=r.id and o.buildingId = b.id and o.id=?'
            report = await query(sqlReport).catch((err) => { utils.log(err) })
        } else if (order.demandId) { //需求订单//接收人是中介
            buidlingUserId = order.originatorId;
            sqlDemand = `select d.*,u.nickName,u.name,u.phoneNum,u.avatarUrl,c.companyName from demand as d,user as u inner join company as c on u.companyId=c.id where d.id=${order.demandId} and u.id=${order.targetorId}`
            //sql1 = 'select d.*,b.*,o.* from demand as d,building as b,orders as o where o.demandId=d.id and o.buildingId = b.id and o.id=?'
            demand = await query(sqlDemand).catch((err) => { utils.log(err) })

            //界面点击楼盘用户头像，链接到楼盘地址，所以要查出buildingId

        } //租房订单...

        sqlBuilding = `select b.*,b.id as buildingId,u.nickName,u.name,u.phoneNum,u.avatarUrl,c.companyName from building as b,user as u inner join company as c on u.companyId=c.id where b.id=${order.buildingId} and u.id=${buidlingUserId}`

        building = await query(sqlBuilding).catch((err) => { utils.log(err) })

        const sql2 = 'select os.*,u1.nickName as fromName,u2.nickName as toName from order_state as os left join user as u1 on os.operateUserId = u1.id left join user as u2 on os.toUserId = u2.id where os.orderId = ? order by os.state'

        const orderState1 = await query(sql2, [orderId]).catch((err) => { utils.log(err) })

        // 查询workflow表并转成map
        const workflow = await query('select * from workflow  where type = ? order by (number+0)', [1])
        let orderStates = {}
        workflow.forEach(v => {
            orderStates[v.number] = v
        })




        // let orderStates = { ...workflowMap }
        // let orderStates = _.cloneDeep(workflowMap)
        // const workflowLength = workflow.length
        const oslength = orderState1.length

        for (let i = 0; i < oslength; i++) {
            let v = orderState1[i]
            let os = orderStates[v.state]
            orderStates[v.state] = {
                ...os,
                ...v
            }
            orderStates[v.state].done = 1

            //最后一步,给下一个节点加current
            let nextState = orderStates[os.nextNum]

            //current 为界面上显示可操作状态按钮 
            i == oslength - 1 && nextState && nextState.roleId.split(',').includes(req.user.roleId.toString()) && (nextState.current = 1)
            if (i == oslength - 1 && nextState) {
                console.log('-------->>>-----------------', nextState.roleId.split(','), req.user.roleId, nextState.roleId.split(',').includes(req.user.roleId.toString()))

            }
            //1 2,3 4 不共存
            if (v.state == 1) {
                delete orderStates['3']
                delete orderStates['4']
            } else if (v.state == 3) {
                delete orderStates['1']
                delete orderStates['2']
            }
        }

        orderStates = Object.values(orderStates)
        return { demand, report, building, orderStates, order: promise0 }
    }

    static async statistics(req, res) { // 我的成果查询
        const { token } = req.body
        const data = {}
        const sql = 'select s.state,count(s.state) as counts from order_state as s,orders as o  where o.originatorId =? and o.id=s.orderId group by s.state'

        const promise = await query(sql, [data]).catch((err) => { utils.log(err) })
        return promise
    }



}