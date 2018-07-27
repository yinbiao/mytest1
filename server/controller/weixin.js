var utils = require('../common/lib/utils')
import _ from 'lodash'
const { select, insert, update, or, and, not, eq, like, $in, lt, gt, lte, gte, between } = require('sql-bricks');
const orderPo = `buildingId,demandId,type,originatorId,reportId,targetorId`.split(',')
export default class Weixin {
    
    static async payLog(req, res) {
        // console.log('req.weixin', req, req.weixin)
        /*
        { appid: 'wxad52bb2df99db2b9',
          bank_type: 'CFT',
          cash_fee: '50',
          fee_type: 'CNY',
          is_subscribe: 'Y',
          mch_id: '1489029502',
          nonce_str: 'j2aFxrwTHt5EghzoGTVJGuclcnb9TCAD',
          openid: 'oXNkEwwhW1qb38zz0M6_sM-5AlT4',
          out_trade_no: '201710151741036098075',
          result_code: 'SUCCESS',
          return_code: 'SUCCESS',
          sign: '9A497E2999BECFA8144EA686F9554829',
          time_end: '20171015174110',
          total_fee: '50',
          trade_type: 'JSAPI',
          transaction_id: '4200000023201710158250559083' }
      */

        if (api.getSign(req.weixin) == req.weixin.sign) {
            const { appid, mch_id, trade_type, bank_type, total_fee, cash_fee, transaction_id, out_trade_no, time_end, timestamp,timeStamp, result_code, openid } = req.weixin
            const data = { appid, mch_id, trade_type, bank_type, total_fee, cash_fee, transaction_id, out_trade_no, time_end, timestamp:timestamp||timeStamp, result_code, openid }
            //插入流水表
            await query('insert into payment set ?', [data]).catch((err) => { utils.log(err) })
            //更新bill表状态
            await query('update bill set state = 1 where billNum = ?', [out_trade_no]).catch((err) => { utils.log(err) })
            return true
        }
        return false

    }

}