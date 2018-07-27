const utils = require('../common/lib/utils')
import _ from 'lodash'
//import {select,insert,update,or,and,not,eq,like,in,lt,gt,lte,gte,between} from 'sql-bricks'
const { select, insert, update,set, or, and, not, eq, like, $in, lt, gt, lte, gte, between } = require('sql-bricks');
const buildingPo = `buildingName,phoneNum,provinceId,cityId,districtId,provinceName,cityName,districtName,street,award,averagePrice,
                    commision,minQuato,saleType,propertyType,geolocation,introduce,
                    cooperationRule,personIdInCharge,state,online,surround,minTotalPrice,maxTotalPrice,
                    traffic,remark,policy,finishTime,address,banners,mainImages,mainVideos,minRoomSize,maxRoomSize,partnerMsg,credentialsImages,
                    infoImages,coporationImages,seenCoporationImages,ruleJudge,ruleReport,brokerageSpeed,paymentRatio,roomSize,houseType,companyId,platformFee`.replace(/[\n\s]+/g, '').split(',')
export default class Building {

    //const buildingFeePo=``.split(',');

    static async list(req, res) { // 查询楼盘列表、推荐楼盘列表
        /**
            入参：['recommend','city','district','houseType','search','time','mine']
            返回：[]
            mine 标识查询我的列表
            */
        const { search, time, report, mine, attention, brokerageSpeed, minRoomSize, maxRoomSize, minPrice, maxPrice, houseType } = req.query

        const token = req.header('token')
        //const sql = 'select * from building where city=? and district=? and recommend=? and houseType=? and name like %?% and time>?'
        const commParam = ['recommend', 'cityId', 'districtId', 'propertyType', 'handsType', 'saleType'] //数据表通用查询字段
        // 
        let data = _.pick(req.query, commParam) //差集取客户端传来的查询参数

        data.valid = 1

        var sql = select('d.*').from('building as d');

        if (attention) {
            data['a.userId'] = req.user.id
            sql.innerJoin('user_attention as a')
                .on('a.buildingid', 'd.id')
        }
        if (report) { //我的报备楼盘列表
            console.log('=====', report)
            sql.rightJoin('report as r').on('r.buildingid', 'd.id').and('r.reporterid', req.user.id)
            // sql.and()
        }

        data = utils.lowerJSONKey(data);

        sql.where(data) //^拼装sql

        sql.and('d.online', 1)

        search && sql.and(like('buildingname', `%${search}%`))

        houseType && sql.and(like('housetype', `%${houseType}%`))

        time && sql.and(gt('time', `${time}`))

        minPrice && sql.and(gte('averageprice', `${minPrice}`))

        maxPrice && sql.and(lte('averageprice', `${maxPrice}`))

        if (minRoomSize && maxRoomSize) {
            sql.and(or(lte('minroomsize', `${minRoomSize}`), gte('maxroomsize', `${maxRoomSize}`)))
        } else if (minRoomSize) {
            sql.and(lte('minroomsize', `${minRoomSize}`))
        } else if (maxRoomSize) {
            sql.and(gte('maxroomsize', `${maxRoomSize}`))
        }

        mine && token && sql.and('d.userid', req.user.id)

        // roomSize && sql.and(like('roomSize', `%${roomSize}%`))


        sql.orderBy('time desc')

        if (brokerageSpeed) {
            if (brokerageSpeed == 1) {
                sql.orderBy('brokeragespeed desc')
            } else {
                sql.orderBy('brokeragespeed asc')
            }
        }

        sql = sql.toParams({ placeholder: '?' }) //$拼装sql

        const promise = await query(sql.text, sql.values).catch((err) => { utils.log(err) })

        return promise;
    }

    static async getBuildingNews(req, res) { // 查询楼盘动态
        const { buildingId } = req.body
        const sql = 'select newsText,newsImgs from building where id = ?'

        const promise = await query(sql, [buildingId]).catch((err) => { utils.log(err) })
        return promise
    }

    static async setBuildingNews(req, res) { // 更新楼盘动态
        const { buildingId, newsText, newsImgs } = req.body
        const data = { newsText, newsImgs }
        const sql = 'update building set ? where id = ?'

        const promise = await query(sql, [data, buildingId]).catch((err) => { utils.log(err) })
        return promise
    }

    static async get(req, res) { // 查询楼盘详情
        const sql = 'select b.*,a.id as hasAttentioned from building b left join user_attention a on b.id=a.buildingId where b.id=?'

        const promise = await query(sql, [req.query.id]).catch((err) => { utils.log(err) })
        return promise
    }

    static async create(req, res) { // 发布楼盘
        let data = _.pick(req.body, buildingPo)
        //const sql = 'insert into building set ?'
        var userId = null

        data.userId = req.user.id;
        data.companyId = req.user.companyId

        //sql-breaks 会自动给骆驼命名法的key加引号，要转成全部小写以便去掉引号
        data = utils.lowerJSONKey(data);

        var sql;
        if (req.body.id) {
            sql = update('building').set(data).where('id',req.body.id).toParams({ placeholder: '?' }) //^$拼装sql
        } else {
            sql = insert('building').values(data).toParams({ placeholder: '?' }) //^$拼装sql
        }

        const promise = await query(sql.text, sql.values).catch((err) => { utils.log(err) })
        // console.log(promise)
        return promise;
    }

    static async delete(req, res) { // 删除楼盘
        const sql = 'update building set valid=0 where id=?'
        //执行前检查权限
        const promise = await query(sql, [req.body.id]).catch((err) => { utils.log(err) })
        return promise
    }

    static async update(req, res) { // 编辑楼盘
        const data = _.pick(req.body, buildingPo)

        delete data.userId

        const sql = 'update user set ? where id=?'
        //执行前检查权限

        const promise = await query(sql, [data, req.body.id]).catch((err) => { utils.log(err) })
        return promise
    }

}