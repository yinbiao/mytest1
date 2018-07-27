var moment = require('moment');
var multiparty = require('multiparty');
var WXBizDataCrypt = require('./WXBizDataCrypt.js');
var fs = require('fs');
const path = require('path');
//import axios from 'axios'
const axios = require('axios')
const config = require('../../config')

exports.decryptData = function decryptData(encryptedData, iv, sessionKey) {
    /**
     * 微信敏感数据对称解密
     */
    const appId = wxconfig.appid;
    return new WXBizDataCrypt(appId, sessionKey).decryptData(encryptedData, iv)
};

exports.response = function response(data, message, code) {
    /**
     * 全站的所有接口返回数据类型
     */
    return {
        "code": code,
        "message": message,
        "data": data
    }
};

exports.exception = function exception(message, code, data) {
    /**
     * 异常的返回数据函数
     * @type {[type]}
     */
    message = message == undefined ? '' : message
    code = code == undefined ? 1 : code
    data = data == undefined ? '' : data
    return exports.response('', message, code = 1)
}

exports.success = function success(data, message) {
    /**
     * 正常的返回数据函数
     * @type {[type]}
     */
    data = data == undefined ? '' : data
    message = message == undefined ? '' : message
    return exports.response(data, message, code = 0)
}

exports.res = function res(sqlpromise) {
    /**
     * 检查更新、插入或编辑的sql是否正常执行
     */
    if (sqlpromise.affectedRows == 1) {
        return exports.success()
    } else {
        return exports.exception()
    }
}

exports.getDatetime = function getDatetime() {
    return moment().format('YYYY-MM-DD HH:mm:ss')
}

exports.log = function log() {
    for (i = 0; i < arguments.length; i++) {
        if(typeof log4j == 'undefined'){
            console.log(arguments[i])
        }else{
            log4js.info(arguments[i])
        }
    }
}

exports.isLogin = function isLogin(req) {
    if (req.session.user_id == undefined) {
        return false
    } else {
        return true
    }
}

exports.check_permission = function check_permission(req, res, next) {
    /**
     * 检查用户权限
     */

    // 获取用户的策略列表
    var path = req.url.split('/').filter(
        function(element, index, ary) { return (element.length > 0) }
    ).join('.')
    var policy = path + '::' + req.method.toLowerCase()

    // 列出所有公共策略
    const sql = 'select policy from menu where isPublic=1'
    const promise = query(sql, []).catch((err) => {
        exports.log(err)
        res.json(exports.exception('没有权限1'))
    })
    promise.then(function(result) {
        // 用户策略没有缓冲
        if (req.session.policy == undefined) {

            // 检查公共策略
            for (var p in result) {
                if (policy == result[p]['policy']) {
                    return next()
                }
            }

            // 如果是没有登陆的用户，公共策略检查也未通过，判定没有权限
            if (req.session.user_id == undefined) {
                res.json(exports.exception('没有权限5'))
            }

            //如果是登陆的用户，从数据库获取该用户的策略
            const sql = 'select menu.policy,menu.isPublic from user_role inner join \
            role_menu on user_role.roleId=role_menu.roleId inner join menu \
            on role_menu.menuId=menu.id where user_role.userId=?'
            const promise = query(sql, [req.session.user_id]).catch((err) => {
                exports.log(err)
                res.json(exports.exception('没有权限2'))
            })
            promise.then(function(result) {
                for (var p in result) {
                    if (result[p]['policy'] == policy) {
                        //有权限，并设置session
                        // req.session.policy = result.map(
                        //     function(v){
                        //         return v.policy
                        //     }
                        // ).join('|')
                        return next()
                    }
                }
                res.json(exports.exception('没有权限3'))
            })
        } else {
            if (req.session.policy.split('|').indexOf(policy) > -1) {
                return next()
            } else {
                res.json(exports.exception('没有权限4'))
            }
        }

    })
}

exports.fileLowupload = function fileLowupload(fileobj) {
    /**
     * 保存文件对象
     * fileobj 文件对象
     *     { name: 'icon_home.png',
             data: ,
             encoding: '7bit',
             truncated: false,
             mimetype: 'image/png',
             md5: '8c8225b59df8a2cbc9d0d503a47df4ce',
             mv: [Function: mv] }
            }
     * dstPath 文件保存目录
     *
     * 返回 文件名称
     */
    let dstPath= config.upload;
    let _name_array = fileobj.name.split('.')
    let dstFilename = fileobj.md5 + '.' + _name_array[_name_array.length - 1]
    var savefile = dstPath + '/' + dstFilename
// console.log('fileobj==> ',fileobj)
    fs.writeFile(savefile, fileobj.data, function(err) {
        if (err) {
            console.log(err)
        }
    });
    return dstFilename
}

exports.request = function request(url,params) {
    return axios.get(url,params)
        .then((res) => {
            return Promise.resolve(res.data)
        })
}


exports.lowerJSONKey=function lowerJSONKey(jsonObj){
    let newJson={}
    Object.keys(jsonObj).forEach((v,k)=>{
        newJson[v.toLowerCase()]=jsonObj[v]
    })
    return newJson;
}  