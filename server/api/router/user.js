import express from 'express'
import user from '../../controller/user'

const Router = express.Router()

Router


    .get('/buildingUsers', async(req, res) => { // 查询当前楼盘用户
        const result = await user.buildingUsers(req, res)
        res.json(result)
    })
    .get('/companyDetail', async(req, res) => { // 查询公司详情
        const result = await user.companyDetail(req, res)
        res.json(result)
    })
    
    .post('/lockPlatformFee', async(req, res) => { // 锁定、解锁楼盘平台费
        const result = await user.lockPlatformFee(req, res)
        res.json(result)
    })
    .post('/online', async(req, res) => { // 下线楼盘
        const result = await user.online(req, res)
        res.json(result)
    })
    .post('/downline', async(req, res) => { // 下线楼盘
        const result = await user.downline(req, res)
        res.json(result)
    })
    .post('/defineServicer', async(req, res) => { // 设置维护人
        const result = await user.defineServicer(req, res)
        res.json(result)
    })
    .get('/unpaidBillCount', async(req, res) => { // 设置二手房和租房的费用
        const result = await user.unpaidBillCount(req, res)
        res.json(result)
    })
    .get('/platformFee', async(req, res) => { // 设置二手房和租房的费用
        const result = await user.getPlatformFee(req, res)
        res.json(result)
    })
    .post('/platformFee', async(req, res) => { // 设置二手房和租房的费用

        const result = await user.postPlatformFee(req, res)
        res.json(result)
    })
    .get('/vipList', async(req, res) => { // 会员管理列表
        let result
        if(req.query.vipType == 1){ //楼盘
            result = await user.vipList(req, res)
        }else{ //中介
            result = await user.vipList2(req, res)
        }
        res.json(result)
    })
    .post('/uploadCoparation', async(req, res) => { // 下载合作协议

        const result = await user.uploadCoparation(req, res)
        res.json(result)
    })
    .get('/downLoadCoparation', async(req, res) => { // 下载合作协议

        const result = await user.downLoadCoparation(req, res)
        res.json(result)
    })
    .get('/coparation', async(req, res) => { // 合作协议

        const result = await user.getCoparation(req, res)
        res.json(result)
    })
    .post('/coparation', async(req, res) => { // 合作协议

        const result = await user.postCoparation(req, res)
        res.json(result)
    })
    .delete('/coparation', async(req, res) => { // 合作协议

        const result = await user.deleteCoparation(req, res)
        res.json(result)
    })
    .get('/userInfo', async(req, res) => { // 我的页面

        const result = await user.getUserInfo(req, res)
        res.json(result)
    })
    .post('/joinCompany', async(req, res) => { // 加入公司

        const result = await user.joinCompany(req, res)
        res.json(result)
    })
    .post('/confirmStaff', async(req, res) => { // 更新临时表信息

        const result = await user.confirmStaff(req, res)
        res.json(result)
    })
    .get('/unReadNoticeCount', async(req, res) => { // 更新通知为已读状态

        const result = await user.unReadNoticeCount(req, res)
        res.json(result)
    })
    .post('/noticeRead', async(req, res) => { // 更新通知为已读状态

        const result = await user.noticeRead(req, res)
        res.json(result)
    })
    .get('/companyGroups', async(req, res) => { // 查询组

        const result = await user.getCompanyGroups(req, res)
        res.json(result)
    })
    .post('/companyGroup', async(req, res) => { // 新增或者更新组

        const result = await user.companyGroup(req, res)
        res.json(result)
    })
    .delete('/userGroup', async(req, res) => { // 查询companyUsers

        const result = await user.deleteUserGroup(req, res)
        res.json(result)
    })
    .get('/companyUsers', async(req, res) => { // 查询companyUsers

        const result = await user.companyUsers(req, res)
        res.json(result)
    })
    .post('/verifyRegister', async(req, res) => { // 入驻审核

        const result = await user.verifyRegister(req, res)
        res.json(result)
    })
    .get('/verifyList', async(req, res) => { // 入驻审核列表

        const result = await user.verifyList(req, res)
        res.json(result)
    })
    .get('/ourRoles', async(req, res) => { // 查询企业角色

        const result = await user.ourRoles(req, res)
        res.json(result)
    })
    .get('/banner', async(req, res) => { // 查询首页banner

        const result = await user.getBanner(req, res)
        res.json(result)
    })
    .post('/banner', async(req, res) => { // 设置更新首页banner

        const result = await user.setBanner(req, res)
        res.json(result)
    })
    .post('/decryptData', async(req, res) => { // 微信解码

        const result = await user.decryptData(req, res)
        res.json(result)
    })

    .get('/list', async(req, res) => { // 查询我的团队列表

        const result = await user.list(req, res)
        res.json(result)
    })
    .post('/', async(req, res) => { // 新增我的团队成员

        const result = await user.create(req, res)
        res.json(result)
    })
    .delete('/', async(req, res) => { // 删除我的团队成员

        const result = await user.delete(req, res)
        res.json(result)
    })
    .put('/', async(req, res) => { // 修改我的团队成员

        const result = await user.update(req, res)
        res.json(result)
    })
    .get('/', async(req, res) => { // 查询我的团队单个人员

        const result = await user.get(req, res)
        res.json(result)
    })
    .get('/wallet', async(req, res) => { // 查询钱包

        const result = await user.getWallet(req, res)
        res.json(result)
    })
    .post('/wallet', async(req, res) => { // 充值钱包

        const result = await user.rechargeWallet(req, res)
        res.json(result)
    })
    .get('/attention', async(req, res) => { // 查询关注列表

        const result = await user.getAttention(req, res)
        res.json(result)
    })
    .post('/attention', async(req, res) => { // 新增关注

        const result = await user.createAttention(req, res)
        res.json(result)
    })
    .delete('/attention', async(req, res) => { // 取消关注

        const result = await user.deleteAttention(req, res)
        res.json(result)
    })
    .post('/msg', async(req, res) => { // 发送消息

        const result = await user.createMsg(req, res)
        res.json(result)
    })
    .get('/msg', async(req, res) => { // 查询获取消息

        const result = await user.getMsg(req, res)
        res.json(result)
    })
    .get('/noticeList', async(req, res) => { // 查询消息列表
        const result = await user.noticeList(req, res)
        res.json(result)
    })
    .post('/updateUserPhone', async(req, res) => { // 查询消息列表
        const result = await user.updateUserPhone(req, res)
        res.json(result)
    })

    .post('/wxCode', async(req, res) => {
        //code 更换sessionKey, https://api.weixin.qq.com/sns/jscode2session?appid=APPID&secret=SECRET&js_code=JSCODE&grant_type=authorization_code
        const token = await user.wxCode(req, res)

        res.json(token)
    })
    .post('/wxGetUserInfo', async(req, res) => {
        //code 换sessionKey,openId，https://api.weixin.qq.com/sns/jscode2session?appid=APPID&secret=SECRET&js_code=JSCODE&grant_type=authorization_code
        const result = await user.wxGetUserInfo(req, res)

        res.json(result) //
    })
    .post('getPhoneNumber', async(req, res) => {
        //解密phoneNumber

        res.json({ phoneNumber })
    })
    .get('/platformUsers', async(req, res) => { // 查询平台用户信息

        const result = await user.platformUsers(req, res)
        res.json(result)
    })
    .post('/register', async(req, res) => { // 注册入驻

        const result = await user.createRegister(req, res)
        res.json(result)
    })
    .post('/confirmRegister', async(req, res) => { // 确认注册通过

        const result = await user.confirmRegister(req, res)
        res.json(result)
    })
    .get('/geolocation', async(req, res) => { // 查询地理位置

        const result = await user.geolocation(req, res)
        res.json(result)
    })
    .get('/productive', async(req, res) => { // 查询我的成果

        const result = await user.productive(req, res)
        res.json(result)
    })
    .get('/achievement', async(req, res) => { // 查询我的成果
        /**
            
        */
        const result = await user.achievement(req, res)
        res.json(result)
    })
    .post('/fileUpload', async(req, res) => { // 查询我的成果
        /**
            
        */
        const result = await user.fileUpload(req, res)
        res.send(result)
    })
    .get('/province', async(req, res) => { // 查询省
        /**
            
        */
        const result = await user.province(req, res)
        res.json(result)
    })
    .get('/city', async(req, res) => { // 查询城市
        /**
            
        */
        const result = await user.city(req, res)
        res.json(result)
    })
    .get('/district', async(req, res) => { // 查询区
        /**
            
        */
        const result = await user.district(req, res)
        res.json(result)
    })
export default Router