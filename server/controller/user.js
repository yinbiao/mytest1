var utils = require('../common/lib/utils')
var C = require('../common/constant/index.js')
import _ from 'lodash'
import axios from 'axios'

var md5 = require('md5');
const _sql = require('sql-bricks');
const { select, insert, update, or, and, not, eq, like, $in, lt, gt, lte, gte, between, isNotNull, isNull } = _sql

var fs = require('fs');

export default class User {

    static async lockPlatformFee(req, res) { // 查询指定楼盘业务员
        const { lockPlatformFee,id } = req.user
        const data={lockPlatformFee:lockPlatformFee==0?1:0}
        return await query('update building set ? where id = ?', [data,id])
    }

    static async buildingUsers(req, res) { // 查询指定楼盘业务员
        const { companyId } = req.user
        return await query('select * from user where companyId = ?', [companyId])
    }

    static async companyDetail(req, res) { // 查询公司详情
        const { companyId } = req.query
        let sql = select('c.*,a.shortName as locateName,u1.name as userName,u1.nickName as userNickName,u1.phoneNum as userPhoneNum,u2.name as platformUserName, u2.nickName as platformUserNickName')
            .from('company as c')
            .leftJoin('cnarea_2016 as a').on('c.districtId', 'a.id')
            .leftJoin('user as u1').on('c.userId', 'u1.id')
            .leftJoin('user as u2').on('c.platformUserId', 'u2.id')
            .where('c.id', companyId)
            .toParams({ placeholder: '?' })

        const data = await query(sql.text.replace(/"/g, ''), sql.values).catch((err) => { utils.log(err) })
        data.map(v => {
            if (v.busLicenseImage) {
                v.busLicenseImage = conf.baseAssetsUrl + v.busLicenseImage.split(',')
            }

        })
        return data
    }

    static async online(req, res) { // 上线楼盘或者中介公司
        // buildingId, companyId
        const { buildingId, companyId } = req.body
        let sql;
        if (buildingId) {
            return await query('update building set ? where id = ?', [{ online: 1 }, buildingId]).catch((err) => { utils.log(err) })
        } else {
            return await query('update company set ? where id = ?', [{ online: 1 }, companyId]).catch((err) => { utils.log(err) })
        }

    }
    static async downline(req, res) { // 下线楼盘或者中介公司
        // buildingId, companyId
        const { buildingId, companyId } = req.body
        let sql;
        if (buildingId) {
            return await query('update building set ? where id = ?', [{ online: 0 }, buildingId]).catch((err) => { utils.log(err) })
        } else {
            return await query('update company set ? where id = ?', [{ online: 0 }, companyId]).catch((err) => { utils.log(err) })
        }

    }

    static async defineServicer(req, res) { // 设置维护人
        //buildingId,companyId,platformUserId
        const { buildingId, companyId, platformUserId } = req.body
        let sql;
        if (buildingId) { //楼盘
            sql = 'update building set ? where id = ?'
            return await query(sql, [{ platformUserId }, buildingId]).catch((err) => { utils.log(err) })
        } else { //中介
            sql = 'update company set ? where id = ?'
            return await query(sql, [{ platformUserId }, companyId]).catch((err) => { utils.log(err) })
        }
    }

    static async unpaidBillCount(req, res) { // 查询当前角色未支付账单列表数量
        return await query('select count(*) as count from bill where payerId = ? and state = 0', [req.user.id]).catch((err) => { utils.log(err) })
    }
    static async getPlatformFee(req, res) { // 二手房和租房的费用

        return await query('select a.id as _areaId,a.shortName as cityName,s.* from hufangtong.cnarea_2016 as a left join platformFee2 as s on a.id = s.areaId where open =1 and level = 1').catch((err) => { utils.log(err) })
    }

    static async postPlatformFee(req, res) { // 设置二手房和租房的费用
        const { arr, type } = req.body
        // this.userInfo.id,
        // v.houseToPlatformFee,
        // v.platformToHouseFee,
        // v.areaId
        await query('delete from platformFee2 where type = ?', [type]).catch((err) => { utils.log(err) })
        return await query('insert into platformFee2 (userId,houseToPlatformFee,platformToHouseFee,areaId,type) values ?', [arr]).catch((err) => { utils.log(err) })
    }

    static async vipList2(req, res) { // 会员管理 中介

        const { vipCompanyName, vipType, districtId, platformUserId, settlementType, dateStart, dateEnd } = req.query
        let sql1 = select('c.*,count(bi.id) as billCount,u1.avatarUrl,u1.name as vipusername,u1.nickname as vipUsernickname,u1.phonenum,u2.name as platformusername,u2.nickname as platformusernickname')
            .from('company as c')
            .leftJoin('user as u1').on('c.userid', 'u1.id')
            .leftJoin('user as u2').on('c.platformuserid', 'u2.id')
            //中介的结算为房源方给平台的费用
            .leftJoin('(select * from bill where state = 0) as bi').on('c.id', 'bi.payerCompanyId').groupBy('c.id')

        vipCompanyName && sql1.where(like('c.companyName', `%${vipCompanyName}%`))

        districtId && sql1.where('c.districtId', districtId)

        platformUserId && sql1.where('c.platformuserId', platformUserId)

        dateStart && sql1.where(gte('c.timestamp', dateStart))

        dateEnd && sql1.where(lte('c.timestamp', dateEnd))

        const _sql1 = sql1.toParams({ placeholder: '?' })

        const companys = await query(_sql1.text.replace(/"/g, ''), _sql1.values)

        //1.和楼盘的成交 数量 公司是发起方 或者为接受方  2.二手房和租房流程的  .groupBy('c.originatorCompanyId')  .groupBy('c.targetorCompanyId')
        //一次查询出所有订单，然后对订单进行 按公司id作为key，分新房、二手房、租房的流程状态处理

        let sql2 = select('*').from('orders as o').and(gte('(state + 0)', 4)).toParams({ placeholder: '?' })

        const orderState6 = await query(sql2.text.replace(/"/g, ''), sql2.values)

        const orderState1Map = {} //带看
        const orderState2Map = {} //成交

        orderState6.map(v => {
            !orderState1Map[v.originatorCompanyId] && (orderState1Map[v.originatorCompanyId] = 0);
            !orderState1Map[v.targetorCompanyId] && (orderState1Map[v.targetorCompanyId] = 0);
            !orderState2Map[v.originatorCompanyId] && (orderState2Map[v.originatorCompanyId] = 0);
            !orderState2Map[v.targetorCompanyId] && (orderState2Map[v.targetorCompanyId] = 0);
            if (v.type < 2) { //新房流程 6带看 10成交
                if (v.state >= 6) { //带看
                    orderState1Map[v.originatorCompanyId]++;
                    orderState1Map[v.targetorCompanyId]++;
                }
                if (v.state >= 10) { //成交
                    orderState2Map[v.originatorCompanyId]++;
                    orderState2Map[v.targetorCompanyId]++;
                }
            } else { //二手房流程
                if (v.state >= 4) { //带看
                    orderState1Map[v.originatorCompanyId]++;
                    orderState1Map[v.targetorCompanyId]++;
                }
                if (v.state >= 6) { //成交
                    orderState2Map[v.originatorCompanyId]++;
                    orderState2Map[v.targetorCompanyId]++;
                }
            }

        })

        //中介成交楼盘的情况 --

        //
        let newCompanys = companys.map(v => {
            v.orderState6 = orderState1Map[v.id] || 0
            v.orderState10 = orderState2Map[v.id] || 0
            //v.buildiingCitys = Object.values(buildingCityMap[v.id] || {}).map(x => { return x.join('') }).join()
            // v.buildiingCityString=v.buildiingCitys
            return v;
        })

        //settlementType && sql1.where('settlementType', settlementType) //查询账单支付
        if (settlementType > 0) { // 0 未选 1已结 2未结
            newCompanys = newCompanys.filter(v => {
                if (settlementType == 1) { //账单已结算
                    return v.billCount == 0
                } else {
                    //账单有未结算
                    return v.billCount != 0
                }
            })
        }


        //公司名 维护人名 负责人名 负责人电话 公司地址 带看数目 成交数目 成交的楼盘订单名称 
        return newCompanys
    }

    static async vipList(req, res) { // 会员管理 楼盘

        const { vipCompanyName, vipType, districtId, platformUserId, settlementType, dateStart, dateEnd } = req.query
        // vipCompanyName:companyName,vipType:company.departmentNum,  date：company.timestamp, isSettlement:bill.state,
        //楼盘 vipType 1楼盘 2中介
        //let tbBuildingOrCompany = vipType == 1 ? 'building as c' : 'company as c'

        //楼盘或者中介的 会员名、负责人、电话、维护人
        //id 客户判断，为buildingId,companyId 
        let sql1 = select('b.*,count(bi.id) as billCount,c.companyName,u1.name as vipusername,u1.nickname as vipUsernickname,u1.phonenum,u2.name as platformusername,u2.nickname as platformusernickname')
            .from('building as b')
            .leftJoin('company as c').on('b.companyId', 'c.id')
            .leftJoin('user as u1').on('b.userid', 'u1.id')
            .leftJoin('user as u2').on('b.platformuserid', 'u2.id')

            .leftJoin('(select * from bill where state = 0) as bi').on('b.id', 'bi.payerBuildingId').groupBy('b.id')
        //building company user order 

        // if(vipType==1){//查楼盘 => 楼盘名 楼盘负责人名 楼盘维护人名-id  平台费 公司名  订单状态 ，带看、成交、

        if (platformUserId) {
            if (platformUserId == -1) {//无维护人
                sql1.where(isNull('b.platformuserId'))
            } else {//指定维护人
                sql1.where('b.platformuserId', platformUserId)
            }
        }

        vipCompanyName && sql1.where(like('buildingName', `%${vipCompanyName}%`)) //楼盘情况 查楼盘名称

        districtId && sql1.where('b.districtId', districtId)

        dateStart && sql1.where(gte('b.time', dateStart))

        dateEnd && sql1.where(lte('b.time', dateEnd))

        const _sql1 = sql1.toParams({ placeholder: '?' })

        const buildings = await query(_sql1.text.replace(/"/g, ''), _sql1.values)
        // const buildingMap={}
        // buildings.map(v=>{buildingMap[v.id] = v})
        //
        // let linkKey={ids:[],user}
        // buildings.map(b=>{

        // })

        let sql2 = select('count(*) as state6').from('orders as o').where(isNotNull('o.buildingId')).and(gte('(state + 0)', 6)).groupBy('o.buildingId').toParams({ placeholder: '?' })

        const orderState6 = await query(sql2.text.replace(/"/g, ''), sql2.values)
        const orderState6Map = {}
        orderState6.map(v => { orderState6Map[v.buildingId] = v })

        let sql3 = select('count(*) as state10').from('orders as o').where(isNotNull('o.buildingId')).and(gte('(state + 0)', 10)).groupBy('o.buildingId').toParams({ placeholder: '?' })

        const orderState10 = await query(sql3.text.replace(/"/g, ''), sql3.values)
        const orderState10Map = {}
        orderState10.map(v => { orderState10Map[v.buildingId] = v })


        //查询楼盘按区域成交数量，1.查出报备订单、合作订单的 所有的成交订单和响应的中介公司并按城市分组，2.合并两次结果，再合并到newBuilding
        let sql4 = select('o.buildingId,n.shortName,c.cityId').from('orders as o')
            .innerJoin('company as c').on('o.originatorCompanyId', 'c.id')
            .innerJoin('cnarea_2016 as n').on('c.cityId', 'n.id')
            .where(gt('o.buildingId', 0)).and(gte('(state + 0)', 10)).and('o.type', 0).toParams({ placeholder: '?' })
        //.groupBy('o.buildingId,c.cityId')

        const buildingCity1 = await query(sql4.text.replace(/"/g, ''), sql4.values)

        let sql5 = select('o.buildingId,n.shortName,c.cityId').from('orders as o')
            .innerJoin('company as c').on('o.targetorCompanyId', 'c.id')
            .innerJoin('cnarea_2016 as n').on('c.cityId', 'n.id')
            .where(gt('o.buildingId', 0)).and(gte('(state + 0)', 10)).and('o.type', 1).toParams({ placeholder: '?' })
        // .groupBy('o.buildingId,c.cityId')

        const buildingCity2 = await query(sql5.text.replace(/"/g, ''), sql5.values)


        const buildingCityMap = {}

        buildingCity1.map(v => {
            !buildingCityMap[v.buildingId] && (buildingCityMap[v.buildingId] = {});
            !buildingCityMap[v.buildingId][v.cityId] && (buildingCityMap[v.buildingId][v.cityId] = { count: 0, shortName: v.shortName })
            buildingCityMap[v.buildingId][v.cityId].count++
        })
        buildingCity2.map(v => {
            !buildingCityMap[v.buildingId] && (buildingCityMap[v.buildingId] = {});
            !buildingCityMap[v.buildingId][v.cityId] && (buildingCityMap[v.buildingId][v.cityId] = { count: 0, shortName: v.shortName })
            buildingCityMap[v.buildingId][v.cityId].count++
        })


        let newBuildings = buildings.map(v => {
            v.orderState6 = orderState6Map[v.id] ? orderState6Map[v.id].state6 : 0
            v.orderState10 = orderState10Map[v.id] ? orderState10Map[v.id].state10 : 0
            v.buildiingCitys = Object.values(buildingCityMap[v.id] || {}).map(x => { return x.join('') }).join()
            // v.buildiingCityString=v.buildiingCitys
            return v;
        })

        //settlementType && sql1.where('settlementType', settlementType) //查询账单支付
        if (settlementType > 0) { // 0 未选 1已结 2未结
            newBuildings = newBuildings.filter(v => {
                if (settlementType == 1) { //账单已结算
                    return v.billCount == 0
                } else {
                    //账单有未结算
                    return v.billCount != 0
                }
            })
        }

        //楼盘:order: state 带看、成交，成交单数中介所在区域分布
        //中介:order: state 带看、成交，成交单数分属楼盘分布

        return newBuildings
    }
    static async uploadCoparation(req, res) { // 企业上传审核合作协议

        //记录2审图片
        const data = {
            coparationImg: req.body.url,
            verified: 4
        }
        const promise = await query('update company set ? where userId = ?', [data, req.user.id]).catch((err) => { utils.log(err) })
        //查询申请的公司
        const promise1 = await query('select * from company where userId = ?', [req.user.id]).catch((err) => { utils.log(err) })

        //发送2审通知
        const msg = `${req.user.applycompanyName} 已上传合作协议，请审核。`
        const sql3 = 'insert into notice set ?'
        const data3 = {
            msg,
            fromUserId: req.user.id,
            toUserId: promise1[0].platformUserId,
            companyId: promise1[0].id
        }

        await query(sql3, [data3]).catch((err) => { utils.log(err) })


        return promise
    }
    static async downLoadCoparation(req, res) { // 合作协议
        //department = type+1
        const promise = await query('select * from company where userId = ? limit 1', [req.user.id]).catch((err) => { utils.log(err) })
        if (promise.length == 0) { return [] }
        const departmentNum = promise[0].departmentNum
        const sql = `select url from coparation where type = ? and valid !=0`
        return await query(sql, [departmentNum - 1]).catch((err) => { utils.log(err) })
    }
    static async getCoparation(req, res) { // 合作协议
        const params = req.query.type ? req.query.type : [0, 1]
        const sql = `select * from coparation where valid !=0 and type in (${params})`
        return await query(sql, []).catch((err) => { utils.log(err) })
    }
    static async postCoparation(req, res) { // 合作协议
        const { url, type } = req.body
        const sql = 'insert into coparation set ?'
        return await query(sql, [{ url, type }]).catch((err) => { utils.log(err) })
    }
    static async deleteCoparation(req, res) { // 合作协议
        const sql = 'update coparation set valid = 0 where id = ?'
        return await query(sql, [req.body.id]).catch((err) => { utils.log(err) })
    }
    static async unReadNoticeCount(req, res) { // 更新通知为已读状态
        if (!req.user || !req.user.id) { return [] }
        const sql = 'select count(*) as unreadCount from notice where readed = 0 and toUserId = ?'
        return await query(sql, [req.user.id]).catch((err) => { utils.log(err) })
    }
    static async noticeRead(req, res) { // 更新通知为已读状态
        const sql = 'update notice set readed = 1 where id = ? and toUserId = ?'
        return await query(sql, [req.body.noticeId, req.user.id]).catch((err) => { utils.log(err) })
    }
    static async getCompanyGroups(req, res) { // 查询companyUsers
        const sql = 'select * from user_companyGroup_role where companyId = ?'
        return await query(sql, [req.user.companyId]).catch((err) => { utils.log(err) })
    }

    static async companyGroup(req, res) { // 新增或者更新组
        const { groupId, groupName, groupUserId, groupUserName } = req.body

        const role = await query('select id from role where parentRoleId = ? limit 1', [req.user.roleId]).catch((err) => { utils.log(err) })
        const roleId = role[0].id //这里是组匹配经理角色，在role 表中 parentRoleId =自身roleId的roleId

        const data = {
            groupName,
            userId: groupUserId,

            roleId, //组的角色都是经理角色
            companyId: req.user.companyId
        }

        let sql, companyGroupId

        if (groupId) { //更新
            companyGroupId = groupId
            sql = 'update user_companyGroup_role set ? where id = ?'
            await query(sql, [data, groupId]).catch((err) => { utils.log(err) })

        } else { //新增
            sql = 'insert into user_companyGroup_role set ?'
            const promise = await query(sql, [data, groupId]).catch((err) => { utils.log(err) })
            companyGroupId = promise.insertId

        }

        //更新user表
        //await query('update user set companyGroupId = ? where id = ?', [companyGroupId, groupUserId]).catch((err) => { utils.log(err) })


        //更新user_role表
        //await query('update user_role set roleId = ? where userId = ?', [roleId, groupUserId]).catch((err) => { utils.log(err) })

        return { msg: "success" }
        //更新user表companyGroupId
        // const sql2 = 'update user set companyGroupId = ? where id = ?'
        // return await query(sql2, [companyGroupId, groupUserId]).catch((err) => { utils.log(err) })
    }
    static async deleteUserGroup(req, res) { // 查询companyUsers
        const { groupId } = req.body
        const sql1 = 'update user_companyGroup_role set valid = 0 where id = ?'

        return await query(sql1, [groupId]).catch((err) => { utils.log(err) })

    }
    static async companyUsers(req, res) { // 查询companyUsers

        const sql1 = 'select * from user where companyId = ?'

        return await query(sql1, [req.user.companyId]).catch((err) => { utils.log(err) })
    }
    static async verifyList(req, res) { // 审核注册列表
        const data = {
            platformUserId: req.user.id
        }
        const sql1 = 'select c.*,u.name,u.nickname,u.phoneNum,u2.name as platformUserName from company as c inner join user as u on c.userId = u.id inner join user as u2 on c.platformUserId = u2.id where platformUserId = ? order by c.id desc'
        const promise = await query(sql1, [req.user.id]).catch((err) => { utils.log(err) })
        const state = {
            0: '', //初始状态
            1: '一审中',
            2: '一审不通过',
            3: '一审通过',
            4: '二审中',
            5: '二审不通过',
            6: '二审通过'
        }
        const resData = promise.map(v => {
            // <!-- 入驻审核:0初始状态，1申请状态一审审核中，2一审不通过，3一审通过，4二审审核中，5二审不通过，6二审通过  -->
            v.verifiedState = state[v.verified]
            v.busLicenseImage = conf.baseAssetsUrl + v.busLicenseImage
            v.coparationImg = conf.baseAssetsUrl + v.coparationImg
            v.allImgs = [v.busLicenseImage, v.coparationImg]
            v.timestamp = new Date(v.timestamp.getTime() + 8 * 60 * 60 * 1000).toISOString().replace(/\..+$/, '').replace('T', ' ')
            return v
        })
        return resData
    }

    static async setBanner(req, res) { // 更新设置banner

        const sql1 = 'delete from banner where id>0'
        await query(sql1).catch((err) => { utils.log(err) })

        const data = req.body.map(v => { return [v.imageSrc] })
        let sql2 = 'insert into banner (imageSrc) values ?'
        await query(sql2, [data]).catch((err) => { utils.log(err) })

        return true
    }

    static async confirmStaff(req, res) { // 更新临时表结果
        const { tempId, result } = req.body
        const data = { tempId, result }
        const sql1 = 'update tempUser set handled = ? where id = ?'
        await query(sql1, [result, tempId]).catch((err) => { utils.log(err) })

        //用户确认为是该企业的员工，更新用户信息和角色
        if (result) {
            const promise = await query('select * from tempUser where id =?', [tempId]).catch((err) => { utils.log(err) })
            const { name, phoneNum, companyId, companyGroupId, roleId } = promise[0]
            const data1 = { name, phoneNum, companyId, companyGroupId }
            await query('update user set ? where id = ?', [data1, req.user.id]).catch((err) => { utils.log(err) })
            const data2 = { roleId, userId: req.user.id }
            await query('insert into user_role set ?', [data2]).catch((err) => { utils.log(err) })
        }
        return true
    }

    static async getBanner(req, res) { // 查询banner
        const sql = 'select * from banner'
        const rows = await query(sql).catch((err) => { utils.log(err) })
        return rows
    }
    static async decryptData(req, res) { // 解密  这个方法已经变成更新电话号码的了，解密的后面再抽出来
        const { encryptedData, iv, keys } = req.body
        //解码手机号
        const data = utils.decryptData(encryptedData, iv, req.user.sessionKey)
        //更新电话号码
        await query('update user set ? where id=?', [{ phoneNum: data.phoneNumber }, req.user.id]).catch((err) => { utils.log(err) })
        //构建返回值
        let returnData = {}
        keys.split(',').forEach(v => {
            returnData[v] = data[v]
        })
        console.log('decryptData==>>', data, returnData)

        // if (keys == 'phoneNumber') { //key == phoneNumber 授权手机号的情况，查询 phoneNum in tempUser ?  更新用户信息和权限
        //     const promise = await query('select c.companyName,tu.id from tempUser as tu inner join company as c on c.id = companyId where handled =0 and phoneNum = ? limit 1', [data.phoneNumber]).catch((err) => { utils.log(err) })
        //     if (promise.length) { //存在，询问用户是否是该企业成员
        //         returnData.isStaff = promise
        //     }
        // }

        return returnData
    }

    static async list(req, res) { // 查询我的团队列表 and 经理下属订单状态

        /**
         * 列出当前用户所在企业团队的人员,按组排序
         *
        return ==>

         [{
            groupName:'',
            groupId:'',
            groupUserId:'',
            groupUsers:[{
                "id": 1, "nickName": "童年", "name": "正全平台超级管理员", "phoneNum": "17601206800", "parentRoleId": 1,带看，认购，签约，结佣
            }],
        }]

         */
        //tables: users, companyGroup, role
        const { companyId, companyGroupId } = req.user

        const sqlGroup = 'select g.id as groupId,g.groupName,g.userId as groupUserId,u.nickName as groupUserName from user_companyGroup_role as g,user as u where g.companyId = ? and g.valid = 1 and g.userId = u.id'

        const rowsGroup = await query(sqlGroup, [companyId]).catch((err) => { utils.log(err) })

        // let groupIds = []
        // rowsGroup.forEach(v => { groupIds.push(v.groupId) })



        // const sqlGroupUsers = 'select * from user where companyGroupId in (?)'
        // const sqlGroupUsers = select().from('user').where($in('companygroupid',...groupIds)).toParams()
        const sqlGroupUsers = `select * from user where companyId = ?`

        const groupUsers = await query(sqlGroupUsers, [companyId]).catch((err) => { utils.log(err) })

        const groupUsersMap = {}

        groupUsers.forEach(v => {
            if (!v.companyGroupId || v.companyGroupId == 0) {
                if (!groupUsersMap['0']) {
                    groupUsersMap['0'] = []
                    rowsGroup.push({ groupName: '未分组用户', groupUserName: '', groupId: '0' })
                }
                groupUsersMap['0'].push(v)
            } else {
                !groupUsersMap[v.companyGroupId] && (groupUsersMap[v.companyGroupId] = [])
                groupUsersMap[v.companyGroupId].push(v)
            }


        })

        // console.log('groupUsers==>', groupUsers, groupUsersMap)

        const resData = rowsGroup.map(v => {
            v.groupUsers = groupUsersMap[v.groupId]
            return v
        })

        return resData
    }
    static async list__bak(req, res) { // 查询我的团队列表 and 经理下属订单状态

        /**
         * 列出企业团队的人员
         *
         */
        const sql = 'select u.id, nickName,u.name, phoneNum,r.parentRoleId from user as u inner join user_role as ur on u.id =ur.userId inner join role as r on r.id = ur.roleId where companyId=? and valid=1'
        const rows = await query(sql, [req.user.companyId]).catch((err) => { utils.log(err) })
        let keyRows = {}
        rows.forEach(v => {
            !keyRows[v.parentRoleId] && (keyRows[v.parentRoleId] = [])

            keyRows[v.parentRoleId].push(v)
        })

        const subSql = 'SELECT u.id  FROM user as u inner join user_role as ur on u.id=ur.userId inner join role as r on ur.roleid = r.id  where parentRoleId = 2'

        if (req.user.rank == 2) { //当前请求为经理权限的查询其团队成员的订单状态
            //sql2检索结果不包含当前请求用户自己
            //报备、带看、认购、签约、待结佣、已经结佣 的数量

            const subRows = await query(subSql).catch((err) => { utils.log(err) })
            console.log('=====>', subRows)
            if (subRows.length == 0) {
                return keyRows
            }
            const sql3 = `select count(*) as countNum,o.*  from orders as o where o.originatorId in (${subRows}) or o.targetorId in (${subRows}) group by o.state`
            // const sql2 = 'select * from orders as o inner join (select count(*),orderId,state from order_state as os group by state )  as m on m.orderId = o.id  inner join user as u on u.id in (o.originatorId,o.comfirmUserId) where  = ?'

            const rows2 = await query(sql).catch((err) => { utils.log(err) })
            let userGroup = keyRows[req.user.parentRoleId]
            // userGroup.length = 1
            keyRows[req.user.parentRoleId] = userGroup.concat(rows2)
        }
        // else if(req.user.rank == 1){ //查询所有人的

        // }

        return keyRows
    }
    static async joinCompany(req, res) { // 加入公司
        const { companyId, departmentNum } = req.body

        const promise00 = await query('update user set ? where id = ?', [{ companyId }, req.user.id]).catch((err) => { utils.log(err) })

        let roleId = departmentNum == 3 ? '3' : departmentNum == 2 ? '7' : '10'

        await query('delete from user_role where userId = ?', [req.user.id]).catch((err) => { utils.log(err) })

        await query('insert into user_role set ?', [{ roleId, userId: req.user.id }]).catch((err) => { utils.log(err) })
        //附初始值角色

        return promise00

    }
    static async create(req, res) { // 新增我的团队成员 
        /**
           存在对应手机号的用户才更新权限角色

         * 新增人员
         * name 新增人员姓名
         * phone 新增人员手机号
         * roleid 新增人员角色
         */
        let { name, phoneNum, companyGroupId } = req.body

        let roleId = req.user.departmentNum == 3 ? '3' : req.user.departmentNum == 2 ? '7' : '10'

        // 0.检查用户是否存在 及 是否已经是其他公司的员工，都通过就insert into tempUser，然后返回

        const sql = 'select * from user where phoneNum=? limit 1'
        const promise = await query(sql, [phoneNum]).catch((err) => { utils.log(err) })
        //1.已经存在用户且已经是公司员工的，驳回
        if (promise.length > 0 && promise[0].companyId) { return { msg: `${phoneNum} 用户已经是企业用户，如确定要添加请先联系与原企业解绑。` } }

        //2.检查是否有排队添加用户情况,即临时表里面已经存在该手机用户，有则驳回
        const promise0 = await query('select * from tempUser where phoneNum = ? and handled is null', [phoneNum]).catch((err) => { utils.log(err) })
        if (promise0.length) { return { msg: `${phoneNum} 用户已经被添加为企业用户，正在等待用户确认，不可重复添加该用户。` } }

        //3.以上均符合，插入tempUser
        const data00 = {
            name,
            phoneNum,
            companyGroupId,
            companyId: req.user.companyId,
            //departmentNum: req.user.departmentNum,
            fromUserId: req.user.id,
            roleId
        }
        const promise00 = await query('insert into tempUser set ?', [data00]).catch((err) => { utils.log(err) })

        return { msg: '员工已经添加，等待其确认。' }



        // // 用户确认后方可更新
        // //1.更新user表
        // const data = {
        //     name,
        //     companyGroupId,
        //     companyId: req.user.companyId,
        //     departmentNum: req.user.departmentNum

        // }
        // const sql2 = 'update user set ? where phoneNum=?'
        // const promise2 = await query(sql2, [data, phoneNum]).catch((err) => { utils.log(err) })

        // //2.新增 或者 更新 user_role  //3平台 2中介 1楼盘 业务员角色 3，7，10

        // const data3 = {
        //     userId: promise[0].id,
        //     roleId
        // }

        // const promise4 = await query('select id from user_role where userId = ?', [promise[0].id]).catch((err) => { utils.log(err) })
        // if (promise4.length > 0) {
        //     await query('update user_role set ? where id = ?', [data3, promise4[0].id]).catch((err) => { utils.log(err) })
        // } else {
        //     const sql3 = 'insert into user_role set ?'
        //     await query(sql3, [data3]).catch((err) => { utils.log(err) })
        // }

        // return promise2
    }
    static async ourRoles(req, res) { // 查询我的团队角色
        const sql = 'select * from role where departmentNum = ? order by rank'
        return await query(sql, [req.user.departmentNum]).catch((err) => { utils.log(err) })
    }
    static async update(req, res) { // 修改我的团队成员
        let { name, companyGroupId, userId } = req.body

        let roleId = req.user.departmentNum == 3 ? '3' : req.user.departmentNum == 2 ? '7' : '10'

        const data1 = { name, companyGroupId, companyId: req.user.companyId }
        await query('update user set ? where id = ?', [data1, userId]).catch((err) => { utils.log(err) })
        const data2 = { roleId, userId }
        await query('insert into user_role set ?', [data2]).catch((err) => { utils.log(err) })

        return true
    }

    static async delete(req, res) { // 删除我的团队成员
        /**
         * 编辑人员，修改用户的姓名或角色
         * uid 用户id
         * name 人员姓名
         * roleid 人员角色
         */
        //1.更新user表
        const { userId } = req.body
        const data = {
            companyId: null,
            companyGroupId: null,
            // departmentNum: null
        }
        const sql = 'update user set ? where id=?'
        const promise = await query(sql, [data, userId]).catch((err) => { utils.log(err) })

        //2.更新user_role

        const sql2 = 'delete from user_role where userId=?'
        await query(sql2, [userId]).catch((err) => { utils.log(err) })

        return promise
    }

    static async get(req, res) { // 查询我的团队单个人员
        const { name } = req.body
        const data = {}
        const sql = 'select * from table where ?'
        return {}
    }

    // static async ___verifyRegister(req, res) { // 审核注册，并且发送审核结果通知
    //     const { verified, companyId, companyRegisterId } = req.body

    //     //1.审核
    //     const sql1 = 'update company set ? where id = ?'
    //     const promise1 = await query(sql1, [{ verified }, companyId]).catch((err) => { utils.log(err) })

    //     //2.发送审核结果通知
    //     const data3 = {
    //         fromUserId: req.user.id,
    //         toUserId: companyRegisterId,
    //         msg: `您的入驻申请审核 ${verified?'通过':'不通过'}`,
    //     }
    //     const sql3 = 'insert into notice set ?'

    //     const promise3 = await query(sql3, [data3]).catch((err) => { utils.log(err) })

    //     return promise1
    // }

    static async verifyRegister(req, res) {
        const { companyId, verified } = req.body //---verified: null申请状态，0不通过，1通过
        //入驻审核:0初始状态，1申请状态一审审核中，2一审不通过，3一审通过，4二审审核中，5二审不通过，6二审通过 
        let data0 = { verified }

        //1.更新company表 verified
        await query('update company set ? where id = ?', [data0, companyId]).catch((err) => { utils.log(err) })
        //2.查询出company信息
        const company = await query('select * from company where id = ?', [companyId]).catch((err) => { utils.log(err) })
        const { departmentNum, userId } = company[0]
        const sql2_1 = 'select * from role where departmentNum = ? order by rank' //经理角色
        const row2_1 = await query(sql2_1, [departmentNum]).catch((err) => { utils.log(err) })

        if (verified == 2) { //一审不通过，标识删除
            await query('insert into company_bak (userId,disctictOfBusiness,city,provice,district,serviceCharge,wallet,companyName,companyAddress,busLicenseImage,departmentNum,platformUserId,verified,valid,varifyInfo,timestamp,disctictOfBusinessNames,coparationImg) select userId,disctictOfBusiness,city,provice,district,serviceCharge,wallet,companyName,companyAddress,busLicenseImage,departmentNum,platformUserId,verified,valid,varifyInfo,timestamp,disctictOfBusinessNames,coparationImg from company where id = ?', [companyId]).catch((err) => { utils.log(err) })
            await query('delete from company where id = ?', [companyId]).catch((err) => { utils.log(err) })
        }

        if (verified == 6) {

            //3.更新用户表信息
            let data = {
                // departmentNum: departmentNum, //1开发商2中介3平台
                companyId,
            }

            const sql = 'update user set ? where id=?'
            await query(sql, [data, userId]).catch((err) => { utils.log(err) })


            //4.更新申请人的角色表
            const sql5 = 'insert into user_role set ?'
            const data5 = {
                userId,
                roleId: row2_1[0].id
            }
            const row5 = await query(sql5, [data5]).catch((err) => { utils.log(err) })

            //5.更新sessionUser中的user
            for (let token in sessionUsers) {
                if (sessionUsers[token].id == company.userId) { delete sessionUsers[token]; return; }
            }
        }

        const state = {
            0: '', //初始状态
            1: '一审中',
            2: '一审不通过',
            3: '一审通过',
            4: '二审中',
            5: '二审不通过',
            6: '二审通过'
        }
        //6.发送给审核人通知
        const msg = `您的入驻申请 ${state[verified]}`
        const sql3 = 'insert into notice set ?'
        const data3 = {
            msg,
            fromUserId: req.user.id,
            toUserId: userId,
            companyId,
        }

        await query(sql3, [data3]).catch((err) => { utils.log(err) })

        return true
    }

    static async createRegister(req, res) {
        /**
         * 仅 开发商 和 中介 申请入驻
         * departmentNum 1开发商 2中介
         */
        const {
            name,
            phoneNum,
            departmentNum,
            company,
            address,
            provice,
            district,
            city,
            disctictOfBusiness,
            disctictOfBusinessNames,
            companyName,
            busLicenseImage,
            companyAddress,
            platformUserId
        } = req.body


        const data1 = {
            userId: req.user.id,
            provice,
            city,
            district,
            disctictOfBusiness, //
            companyName,
            companyAddress,
            busLicenseImage, //营业执照图片
            departmentNum,
            platformUserId,
            verified: 1 //入驻审核:0初始状态，1申请状态一审审核中，2一审不通过，3一审通过，4二审审核中，5二审不通过，6二审通过 
        }
        //0.更新user name
        await query('update user set name = ? where id = ?', [name, req.user.id]).catch((err) => { utils.log(err) })

        //1.新增公司信息
        const sql1 = 'insert into company set ?'
        const rows1 = await query(sql1, [data1]).catch((err) => { utils.log(err) })
        const companyId = rows1.insertId;

        // //2.初始化公司组
        // const sql2_1 = 'select * from role where departmentNum = ? order by rank' //经理角色
        // const row2_1 = await query(sql2_1, [departmentNum]).catch((err) => { utils.log(err) })

        // const data2 = {
        //     userId: req.user.id,
        //     companyId,
        //     groupName: '',
        //     roleId: row2_1[0].id
        // }

        // await query('insert into user_companyGroup_role set ?', [data2_3]).catch((err) => { utils.log(err) })

        //5.发送给审核人通知
        const msg = `入驻申请：来自 ${companyName} ${companyAddress}`
        const sql3 = 'insert into notice set ?'
        const data3 = {
            msg,
            fromUserId: req.user.id,
            toUserId: platformUserId,
            companyId,
        }

        await query(sql3, [data3]).catch((err) => { utils.log(err) })

        return utils.success()

    }

    static async updateUserPhone(req, res) {
        const { name, phoneNum } = req.body
        let data = {}
        data = {
            name,
            phoneNum
        }
        const sql = 'update user set ? where id=?'
        const rows2 = await query(sql, [data, req.user.id]).catch((err) => { utils.log(err) })
        return rows2


    }


    static async getUserInfo(req, res) {
        const { openId } = req.user
        //1.查询最新用户信息
        const sql = 'select u.*,g.groupName,c.companyName, u2.name as platformUserName,u2.id as platformUserId,u2.nickName as platformUserNickName from user as u left join company as c on u.companyId = c.id left join user_companyGroup_role as g on u.companyGroupId = g.id left join user as u2 on c.platformUserId = u2.id where u.openId=?'
        const promise1 = await query(sql, [openId]).catch((err) => { utils.log(err) })

        //2.检查还未确认加入到某公司，查询是否申请了企业用户
        let promiseApplyO = {

        }
        if (!promise1[0].companyId) {
            const promiseApply = await query('select c.*,u.name as platformUserName,u.nickName as platformUserNickName from company as c left join user as u on c.platformUserId = u.id where c.userId = ?', [req.user.id]).catch((err) => { utils.log(err) })
            if (promiseApply.length > 0) {
                //verified 入驻审核:0初始状态，1申请状态一审审核中，2一审不通过，3一审通过，4二审审核中，5二审不通过，6二审通过 
                const state = {
                    0: '', //初始状态
                    1: '一审中',
                    2: '一审不通过',
                    3: '一审通过',
                    4: '二审中',
                    5: '二审不通过',
                    6: '二审通过'
                }
                promiseApplyO.applycompanyName = promiseApply[0].companyName
                promiseApplyO.applyState = state[promiseApply[0].verified]
                promiseApplyO.applyVerified = promiseApply[0].verified //== 0 ? '审核不通过' : '审核中'

                promiseApplyO.platformUserId = promiseApply[0].platformUserId
                promiseApplyO.platformUserName = promiseApply[0].platformUserName
                promiseApplyO.platformUserNickName = promiseApply[0].platformUserNickName

            }
        }
        //3.检查还未确认加入到某公司，且已经被公司询问了，有则要求用户确认
        let resData = {}
        if (!promise1[0].companyId) {
            const promise3 = await query('select tu.id, c.companyName,c.companyAddress from tempUser as tu inner join company as c on c.id = tu.companyId where tu.phoneNum = ? and tu.handled is null', [promise1[0].phoneNum]).catch((err) => { utils.log(err) })
            if (promise3.length) {
                resData.staff = promise3
                resData.msg = `请确认您是否是 ${promise3[0].companyName} ${promise3[0].companyAddress} 的员工。`
                // return resData;
            }
        }

        //4.前台菜单显示隐藏权限
        const sql3 = "select m.*,r.id as roleId,r.departmentNum,r.parentRoleId,r.rank,r.name as roleName from user_role as ur inner join role as r on ur.roleId = r.id  inner join role_menu as rm on rm.roleId = r.id inner join menu as m on rm.menuId =m.id where ur.userId=? and m.type=0;"
        const promise3 = await query(sql3, [promise1[0].id]).catch((err) => { utils.log(err) })
        let permission = {}
        // let roleName;
        promise3.forEach(item => {
            permission[item.path] = item
            //roleName = item.roleName
        })
        sessionUsers[req.user.token] = {
            ...sessionUsers[req.user.token],
            ...promise3[0],
            ...promise1[0],
            permission,
            ...promiseApplyO
        }

        return {
            ...sessionUsers[req.user.token],
            openId: '',
            sessionKey: '',
        }
    }

    static async wxCode(req, res) { // /code 更换sessionKey, https://api.weixin.qq.com/sns/jscode2session
        //?appid=APPID&secret=SECRET&js_code=JSCODE&grant_type=authorization_code
        const { code } = req.body
        const url = 'https://api.weixin.qq.com/sns/jscode2session?appid=' + wxconfig.appid + '&secret=' + wxconfig.AppSecret + '&js_code=' + code + '&grant_type=authorization_code'
        //wxconfig
        //const url = 'https://api.weixin.qq.com/sns/jscode2session'
        const appid = wxconfig.appid //'wxaac5cf98fdbcafa4'
        const secret = wxconfig.AppSecret //'141e688c5aa361e87d3cf54178cbc384'

        const grant_type = 'authorization_code' //grant_type=authorization_code
        //appid=APPID&secret=SECRET&js_code=JSCODE&grant_type=authorization_code
        // const params = {
        //     js_code: code,
        //     appid,
        //     secret,
        //     grant_type
        // }
        // console.log('params==>',params)
        // 1.请求微信code换openId和session_key
        const wxRes = await utils.request(url)
        console.log('wxRes=>', wxRes)
        // const { openId, session_key } = wxRes.openid;
        const openId = wxRes.openid
        const sessionKey = wxRes.session_key

        //console.log('======')
        // console.log('wxRes==>', wxRes) //sessionKey openId
        //console.log('======')
        //2.查询 用户 组 公司 
        const sql = 'select u.*,g.groupName,c.companyName, u2.name as platformUserName,u2.id as platformUserId,u2.nickName as platformUserNickName from user as u left join company as c on u.companyId = c.id left join user_companyGroup_role as g on u.companyGroupId = g.id left join user as u2 on c.platformUserId = u2.id where u.openId=?'
        const promise1 = await query(sql, [openId]).catch((err) => { utils.log(err) })
        //保存token 

        let token = req.header('token')

        // console.log('token=====>', typeof token, token == '[object Undefined]', typeof token == 'undefined', req.header('token'))
        //3.不存在合法token则初始化一个新token
        if (!token || token == '[object Undefined]') { token = md5(openId + Math.random()) }
        //4.服务端缓存token 信息
        sessionUsers[token] = { openId, sessionKey, token, ...promise1[0] };


        let id;
        let resData = { token }
        // //

        // //5.首次未登录访问
        if (promise1.length === 0) {
            //     //新用户，标识客户端请求授权、登录
            //     resData.newUser = 1
            //     resData.msg = '未授权用户信息'
            // const sql9 = 'insert into user set openId=?'
            const promise = await query('insert into user set openId=?', [openId]).catch((err) => { utils.log(err) })
            // sessionUsers[token].id = promise.insertId
            sessionUsers[token].id = promise.insertId
            return resData;
        }


        //6.未授权手机号用户要求授权手机号
        // if (!promise1[0].phoneNum) { //手机号未授权
        //     resData.newUser = 2
        //     resData.msg = "请授权手机号"
        //     return resData;

        // }
        //6.检查还未确认加入到某公司，查询是否申请了企业用户
        let promiseApplyO = {}
        if (!promise1[0].companyId) {
            const promiseApply = await query('select c.*,u.name as platformUserName,u.nickName as platformUserNickName from company as c left join user as u on c.platformUserId = u.id where c.userId = ?', [sessionUsers[token].id]).catch((err) => { utils.log(err) })
            if (promiseApply.length > 0) {
                //verified 入驻审核:0初始状态，1申请状态一审审核中，2一审不通过，3一审通过，4二审审核中，5二审不通过，6二审通过 
                const state = {
                    0: '', //初始状态
                    1: '一审审核中',
                    2: '一审不通过',
                    3: '一审通过',
                    4: '二审审核中',
                    5: '二审不通过',
                    6: '二审通过'
                }
                promiseApplyO.applycompanyName = promiseApply[0].companyName
                promiseApplyO.applyState = state[promiseApply[0].verified]
                promiseApplyO.applyVerified = promiseApply[0].verified //== 0 ? '审核不通过' : '审核中'
            }
        }
        //7.检查还未确认加入到某公司，且已经被公司询问了，有则要求用户确认
        if (!promise1[0].companyId) {
            const promise3 = await query('select tu.id, c.companyName,c.companyAddress from tempUser as tu inner join company as c on c.id = tu.companyId where tu.phoneNum = ? and tu.handled is null', [promise1[0].phoneNum]).catch((err) => { utils.log(err) })
            if (promise3.length) {
                resData.staff = promise3
                resData.msg = `请确认您是否是 ${promise3[0].companyName} ${promise3[0].companyAddress} 的员工。`
                return resData;
            }
        }

        //8.前台菜单显示隐藏权限
        const sql3 = "select m.*,r.id as roleId,r.departmentNum,r.parentRoleId,r.rank,r.name as roleName from user_role as ur inner join role as r on ur.roleId = r.id  inner join role_menu as rm on rm.roleId = r.id inner join menu as m on rm.menuId =m.id where ur.userId=? and m.type=0"
        const promise3 = await query(sql3, [promise1[0].id]).catch((err) => { utils.log(err) })
        let permission = {}
        // let roleName;
        promise3.forEach(item => {
            permission[item.path] = item
            //roleName = item.roleName
        })
        sessionUsers[token] = {
            ...promise3[0],
            ...promise1[0],
            permission,
            //roleName,
            openId,
            sessionKey,
            token,
            ...promiseApplyO
        }
        console.log('当前用户sessionUsers值==>', sessionUsers[token])
        return {
            ...sessionUsers[token],
            openId: '',
            sessionKey: '',

        }

    }

    static async wxGetUserInfo(req, res) { //
        const { encryptedData, iv } = req.body
        const { nickName, city, country, gender, language, province, avatarUrl } = req.body.userInfo

        const token = req.header('token')
        //console.log('token:', token, sessionUsers)
        const openId = sessionUsers[token].openId
        const sql = 'update user set ? where openId=?'
        const data = {
            nickName,
            avatarUrl,
            city,
            country,
            province,
            gender,
            language,
        }
        const promise = await query(sql, [data, openId]).catch((err) => { utils.log(err) })
        return promise.effectedRows
    }


    static async getWallet(req, res) { // 查询钱包
        if (req.session.user_id == undefined) {
            return utils.exception('用户没有登录')
        }
        const sql = 'select wallet from company where id=? limit 1'
        const promise = await query(sql, [req.session.user_id]).catch((err) => { utils.log(err) })
        if (promise.length > 0) {
            return utils.success(promise[0].wallet)
        } else {
            return utils.exception()
        }
    }
    static async platformUsers(req, res) { // 查询平台用户信息
        const sql = 'select u.* from user as u  where u.companyId = (select id from company limit 1)' //平台公司为最先初始化
        const promise = await query(sql).catch((err) => { utils.log(err) })
        return promise
    }

    static async rechargeWallet(req, res) { // 充值钱包
        const { money } = req.body

        if (req.session.user_id == undefined) {
            return utils.exception('用户没有登录')
        }

        const sql = 'update company set ? where id=?'
        var data = {
            wallet: money
        }
        const promise = await query(sql, [data, req.session.user_id]).catch((err) => { utils.log(err) })
        return utils.res(promise)
    }

    static async getAttention(req, res) { // 查询关注列表
        const { userId } = req.body
        const data = {
            id: userId
        }
        if (userId == undefined) {
            return utils.exception('userId要给我哦')
        }
        const sql = 'select * from user_attention where ? limit 1'
        const promise = await query(sql, [data]).catch((err) => { utils.log(err) })

        var buildId = promise[0].buildingId.split(',')
        var demandId = promise[0].demandId.split(',')
        var resdata = {
            buildId: buildId,
            demandId: demandId
        }
        return utils.success(resdata)
    }

    static async createAttention(req, res) { // 新增关注
        const token = req.header('token')
        const data = {
            userId: req.user.id,
            buildingId: req.body.buildingId,
            demandId: req.body.demandId
        }
        const sql = 'insert into user_attention set ? '
        const promise = await query(sql, [data]).catch((err) => { utils.log(err) })
        return promise.insertId
    }


    static async deleteAttention(req, res) { // 取消关注

        let data = _.pick(req.body, ['buildingId', 'demandId'])
        //**** automatic quoting of columns that collide with keywords (order, desc, etc) & columns that contain capital letters
        data.userId = req.user.id

        //sql-breaks 会自动给骆驼命名法的key加引号，要转成全部小写以便去掉引号
        data = utils.lowerJSONKey(data);
        //const sql = 'delete from user_attention where ? '
        const sql = _sql.delete('user_attention')
            .where(data)
            .toParams({ placeholder: '?' })

        const promise = await query(sql.text, sql.values).catch((err) => { utils.log(err) })
        return promise.affectedRows
    }

    static async createMsg(req, res) { // 发送消息
        const { toUserId, content } = req.body
        const data = {
            fromUserId: req.session.user_id,
            toUserId: toUserId,
            content: content,
            time: utils.getDatetime()
        }
        const sql = 'insert into message set ?'

        const promise = await query(sql, [data]).catch((err) => { utils.log(err) })
        return utils.res(promise)
    }

    static async getMsg(req, res) { // 查询获取消息
        const data = {
            toUserId: req.session.user_id
        }
        const sql = 'select * from message where ? order by id desc'

        const promise = await query(sql, [data]).catch((err) => { utils.log(err) })
        return utils.success(promise)
    }

    static async noticeList(req, res) { // 查询消息列表
        const sql = 'select * from notice where toUserid = ? order by id desc' //

        const promise = await query(sql, [req.user.id]).catch((err) => { utils.log(err) })
        return promise
    }

    static async geolocation(req, res) { // 查询地理位置
        const { userId } = req.body
        if (userId == undefined) {
            userId = req.session.user_id
        }
        const sql = 'select * from company where id=? limit 1'

        const promise = await query(sql, [userId]).catch((err) => { utils.log(err) })
        return utils.success(promise[0])
    }

    static async productive(req, res) { // 查询我的成果,我及我的下属统计 总客户数，报备，带看，签约
        //插入订单，订单状态更新，统计

        const sql = ''
        const rows = await query(sql, req.user.id).catch((err) => { utils.log(err) })

        return rows
    }


    //----------------------------------
    static async login(req, res) {
        const { name, password, phone } = req.body
        if (name != undefined) {
            const sql = 'select id,type,role,name,password from user where name=? limit 1'
            const userobj = await query(sql, [name]).catch((err) => { utils.log(err) })

            if (userobj[0].password == password) {
                this._saveSession(req, userobj[0])
                return utils.success()
            } else {
                return false
            }

        }
        if (phone != undefined) {
            const sql = 'select id,type,role,name,password from user where phoneNum=? limit 1'
            const userobj = await query(sql, [phone]).catch((err) => { utils.log(err) })

            if (userobj[0].password == password) {
                this._saveSession(req, userobj[0])
                return utils.success()
            } else {
                return false
            }

        }
    }

    static async fileUpload(req, res) {
        // console.log('上传的文件对象：', req.files)
        // console.log("req==> ", req)
        let _filename = utils.fileLowupload(req.files.file)
        return _filename
    }

    /**
     * [saveSession 存储session]
     * @param  {[type]} res  [res响应]
     * @param  {[type]} user [用户名/qq号/邮箱]
     * @param  {[type]} type [user的类型]
     * @return {[type]}      [返回登陆的信息供客户端存储]
     */
    static async _saveSession(req, userobj) {
        req.session.user_id = userobj.id
        req.session.user_type = userobj.type
        req.session.user_role = userobj.role
        req.session.user_name = userobj.name
    }

    static async _getUserByid(uid) {
        const sql = 'select * from user where id=? limit 1'
        const res = await query(sql, [userId]).catch((err) => { utils.log(err) })
        return res
    }

    static async province() {
        const sql = 'select * from cnarea_2016 where level=1 and open = 1 limit 100'
        const res = await query(sql).catch((err) => { utils.log(err) })
        return res
    }

    static async city(req) {
        const dbCols = ['parentId', 'level']
        let data = _.pick(req.query, dbCols)
        if (data.parentId) { data.parentId = parseInt(data.parentId) }

        //if(data.level==1){data['open']=1;}
        data['open'] = 1;

        data = utils.lowerJSONKey(data);
        console.log(data)
        /**
         * @param  
         * @return {[type]}      [返回登陆的信息供客户端存储]
         */
        const sql = select().from('cnarea_2016').where(data).toParams({ placeholder: '?' })

        const res = await query(sql.text, sql.values).catch((err) => { utils.log(err) })
        return res
    }

    static async district(req, res) {

        const sql = 'SELECT id,name as value,shortName FROM hufangtong.cnarea_2016 where  parentId=? and open=1' //161793 默认调试上海

        const promise = await query(sql, [req.query.parentId]).catch((err) => { utils.log(err) })
        return promise
    }

}