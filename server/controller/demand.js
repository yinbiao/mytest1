var utils = require('../common/lib/utils')
import _ from 'lodash'

const { select, insert, update, or, and, not, eq, like, $in, lt, gt, lte, gte, between } = require('sql-bricks');
const demandPo = `houseType,provinceId,cityId,districtIds,provinceName,cityName,districtNames,subways,propertyType,handsType,budgetMin,budgetMax,
                buildingIds,buildingNames,degreeType,remarks,appointment,customerName,
                street,type,gender,phone,timestamp`.replace(/[\n\s]+/g, '').split(',')
export default class Demand {


    static async list(req, res) { // 查询需求列表
        /**
            入参：['recommend','city','district','houseType','search','time']
            返回：[]
            */
        const { search, timestamp, mine, districtId, budgetMin, budgetMax, handsType } = req.query

        //const sql = 'select * from building where city=? and district=? and recommend=? and houseType=? and name like %?% and time>?'
        const commParam = ['cityId', 'propertyType', 'handsType'] //数据表通用查询字段

        let data = _.pick(req.query, commParam) //差集取客户端传来的查询参数
        if (data.city) {
            data['d.cityId'] = data.city
            delete data.city
        }

        data['i.online'] = 1

        let sql = 'select d.*,u.nickName,u.name,u.avatarUrl,i.companyName from demand as d inner join user as u on d.userid = u.id left join company as i on u.companyId = i.id '

        let entries = Object.entries(data)

        mine && req.user && entries.push(['d.userid', req.user.id])

        entries = entries.map(item => [item[0] + ' = ', item[1]])

        timestamp && entries.push(['d.timestamp > ', timestamp])

        search && entries.push(['d.name like ', `%${search}%`])

        budgetMin && entries.push(['d.budgetMin >= ', parseInt(budgetMin)])

        budgetMax && entries.push(['d.budgetMax <= ', parseInt(budgetMax)])

        districtId && entries.push(['d.districtIds like ', `%${districtId}%`])


        //1二手房和2租房 查 中介经营区域 

        if (handsType > 0) {
            const districtIds = await query('select disctictOfBusiness from company where id = ?', [req.user.companyId]);
            if (districtIds.length) {
                const disctictOfBusiness = districtIds[0].disctictOfBusiness
                if (disctictOfBusiness) {
                    const exp = disctictOfBusiness.split(',').join('|')
                    entries.push(['d.districtIds regexp ', exp])
                }
            }
        }


        let ev = []
        let ek = entries.map(item => {
            ev.push(item[1])
            return item[0] + '?'
        })
        // console.log('======>>>>>',data,ek,ev,req.user)
        ek.length && (sql += 'where ' + ek.join(' and '))

        const promise = await query(sql, ev).catch((err) => { utils.log(err) })

        return promise;
    }

    // static async list(req, res) { // 查询需求列表
    //      /**
    //          入参：['recommend','city','district','houseType','search','time']
    //          返回：[]
    //          */
    //      const {search, time, token} = req.query

    //      //const sql = 'select * from building where city=? and district=? and recommend=? and houseType=? and name like %?% and time>?'
    //      const commParam = ['city', 'district', 'houseType'] //数据表通用查询字段

    //      const data = _.pick(req.query, commParam) //差集取客户端传来的查询参数
    //      if(data.city){
    //          data['d.city']=data.city
    //          delete data.city
    //      }
    //      var sql = select('d.*,u.nickname').from('demand as d').where(data) //^拼装sql

    //      //search && sql.and(like('name',`%${search}%`))

    //      time && sql.and(gt('time', `${time}`))

    //      token && sql.and('userid', parseToken(token).id)

    //      sql.innerJoin('user as u').on('d.userid','u.id')

    //      sql.innerJoin('company as i').on('u.userinfoid',i.id)
    //      console.log('sql==>',sql)
    //      sql = sql.toParams({placeholder: '?'}) //$拼装sql
    //      console.log('sql==>',sql)
    //      const promise = await query(sql.text.replace(/"/g,''), sql.values).catch((err) => {utils.log(err)})

    //      return promise;
    // }

    static async get(req, res) { // 查询需求详情
        const data = [parseInt(req.query.id)]

        const sql = 'select d.*,c.companyName,u.phoneNum, u.nickName from demand as d inner join user as u on d.userId = u.id inner join company as c on c.id = u.companyId where d.id=?'

        const promise = await query(sql, data).catch((err) => { utils.log(err) })
        return promise;
    }

    static async create(req, res) { // 发布新客户需求
        let data = _.pick(req.body, demandPo)

        data.userId = req.user.id;

        //sql-bricks 遇到骆驼命名法会自动加引号
        // console.log(data)
        data = utils.lowerJSONKey(data);
        if (!data.appointment) { delete data.appointment }
        // console.log(data)
        var sql = insert('demand').values(data).toParams({ placeholder: '?' }) //^$拼装sql

        const promise = await query(sql.text, sql.values).catch((err) => { utils.log(err) })

        return promise.insertId
    }

    static async delete(req, res) { // 删除客户需求
        const sql = 'update user set valid=0 where id=?'
        //执行前检查权限
        const promise = await query(sql, [req.query.id]).catch((err) => { utils.log(err) })
        return promise
    }

    static async update(req, res) { // 修改客户需求
        const { id, token } = req.body

        const data = _.pick(req.body, buildingPo)

        delete data.userId

        const sql = 'update user set ? where id=?'

        const promise = await query(sql, [data, id]).catch((err) => { utils.log(err) })
        return promise
    }
}