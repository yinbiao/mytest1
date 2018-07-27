/**
 * 微信支付API
 * @author Eric
 */
var Log = console.log
var crypto = require('crypto');
var urllib = require('urllib');
var getRawBody = require('raw-body');
var util = require('./util');

var URLS = {
    // 统一下单
    unifiedorder: 'https://api.mch.weixin.qq.com/pay/unifiedorder',
    // 查询订单
    orderquery: 'https://api.mch.weixin.qq.com/pay/orderquery',
    // 关闭订单
    closeorder: 'https://api.mch.weixin.qq.com/pay/closeorder',
    // 申请退款
    refund: 'https://api.mch.weixin.qq.com/secapi/pay/refund',
    // 查询退款
    refundquery: 'https://api.mch.weixin.qq.com/pay/refundquery',
    // 下载对帐单
    downloadbill: 'https://api.mch.weixin.qq.com/pay/downloadbill',
    // 企业付款
    transfers: 'https://api.mch.weixin.qq.com/mmpaymkttransfers/promotion/transfers',
    // 查询企业付款
    gettransferinfo: 'https://api.mch.weixin.qq.com/mmpaymkttransfers/gettransferinfo',
    // 发放普通红包
    sendredpack: 'https://api.mch.weixin.qq.com/mmpaymkttransfers/sendredpack',
    // 发放裂变红包
    sendgroupredpack: 'https://api.mch.weixin.qq.com/mmpaymkttransfers/sendgroupredpack',
    // 查询红包记录
    gethbinfo: 'https://api.mch.weixin.qq.com/mmpaymkttransfers/gethbinfo',
    // 发放代金券
    send_coupon: 'https://api.mch.weixin.qq.com/mmpaymkttransfers/send_coupon'
};

var Payment = function(config, debug = false) {
    if (!config) throw new Error('参数不能为空');
    if (!config.appid) throw new Error('appid为必传参数');
    if (!config.mchid) throw new Error('mchid为必传参数');
    if (!config.partnerKey) throw new Error('partnerKey为必传参数');
    this.appid = config.appid;
    this.mchid = config.mchid;
    this.partnerKey = config.partnerKey;
    this.passphrase = config.passphrase || config.mchid;
    this.pfx = config.pfx;
    this.notify_url = config.notify_url;
    this.spbill_create_ip = config.spbill_create_ip || '127.0.0.1';
    this.debug = debug;
}

/* 微信支付API */


/**
 * 发放代金券入口
 */
Payment.prototype.getCoupon = function(params, callback) {
    var that = this;
    // callback模式
    if (typeof callback == 'function') return that._getCoupon(params, callback);
    // promise模式
    return new Promise(function(resolve, reject) {
        that._getCoupon(params, function(err, result) {
            err ? reject(err) : resolve(result);
        });
    });
};
/**
 * 扫码支付
 */
Payment.prototype._wxCode = function(id) {
    Log("订单id", id)
    let params_ = {
        product_id: id,
        appid: this.appid,
        mch_id: this.mchid,
        time_stamp: '' + (Date.now() / 1000 | 0),
        nonce_str: util.generateNonceStr()
    }
    params_.sign = this.getSign(params_);
    let res = 'weixin://wxpay/bizpayurl?sign=' + params_.sign + '&appid=' + params_.appid + '&mch_id=' + params_.mch_id + '&product_id=' + params_.product_id + '&time_stamp=' + params_.time_stamp + '&nonce_str=' + params_.nonce_str
    Log(res)
    return res
    // return res
}
// 代金券原始方法
Payment.prototype._getCoupon = function(params, callback) {
    var that = this;
    that.send_coupon(params, function(err, result) {
        Log('result')
        Log(result)
        Log('err====')
        Log(err)
        if (err) return callback(err, result);
        // var pkg = Object.assign({}, {
        //  appId: that.appid,
        //  timeStamp: '' + (Date.now() / 1000 |0),
        //  nonceStr: util.generateNonceStr(),
        //  package: 'prepay_id=' + result.prepay_id,
        //  signType: 'MD5'
        // });
        // pkg.paySign = that.getSign(pkg);
        Log('_getCoupon')
        Log(result)
        return callback(null, result);
    })
};

// 发放代金券
Payment.prototype.send_coupon = function(params, callback) {
    var pkg = Object.assign({}, params, {
        openid_count: 1, //openid记录数（目前支持num=1）
        appid: this.appid,
        mch_id: this.mchid,
        op_user_id: '', //操作员帐号, 默认为商户号 可在商户平台配置操作员对应的api权限
        device_info: '', //微信支付分配的终端设备号
        nonce_str: util.generateNonceStr(), //随机字符串，不长于32位
        version: '1.0',
        type: 'XML'
    });

    var needs = ['coupon_stock_id', 'partner_trade_no'];
    // if (pkg.trade_type == 'JSAPI') {
    //  needs.push('openid');
    // } else if (pkg.trade_type == 'NATIVE') {
    //  needs.push('product_id');
    // }
    return this.request(pkg, { type: 'send_coupon', needs, cert: true }, callback);
};

// JSSDK支付签名: 自动区分callback或promise
Payment.prototype.getPayParams = function(params, callback) {
    var that = this;
    // callback模式
    if (typeof callback == 'function') return that._getPayParams(params, callback);
    // promise模式
    return new Promise(function(resolve, reject) {
        that._getPayParams(params, function(err, result) {
            err ? reject(err) : resolve(result);
        });
    });
};

// JSSDK支付签名(原始方法)
Payment.prototype._getPayParams = function(params, callback) {
    var that = this;
    that.unifiedOrder(params, function(err, result) {
        if (err) return callback(err);
        var pkg = Object.assign({}, {
            appId: that.appid,
            timeStamp: '' + (Date.now() / 1000 | 0),
            nonceStr: util.generateNonceStr(),
            package: 'prepay_id=' + result.prepay_id,
            signType: 'MD5'
        });
        pkg.paySign = that.getSign(pkg);
        pkg.timestamp = pkg.timeStamp;
        callback(null, pkg);
    })
};

// 统一下单
Payment.prototype.unifiedOrder = function(params, callback) {
    var pkg = Object.assign({}, params, {
        appid: this.appid,
        mch_id: this.mchid,
        nonce_str: util.generateNonceStr(),
        notify_url: params.notify_url || this.notify_url,
        spbill_create_ip: params.spbill_create_ip || this.spbill_create_ip,
        trade_type: params.trade_type || 'JSAPI'
    });

    var needs = ['body', 'out_trade_no', 'total_fee', 'notify_url'];
    if (pkg.trade_type == 'JSAPI') {
        needs.push('openid');
    } else if (pkg.trade_type == 'NATIVE') {
        needs.push('product_id');
    }
    return this.request(pkg, { type: 'unifiedorder', needs }, callback);
};

// 订单查询
Payment.prototype.orderQuery = function(params, callback) {
    var pkg = Object.assign({}, params, {
        appid: this.appid,
        mch_id: this.mchid,
        nonce_str: util.generateNonceStr()
    });

    var needs = ['transaction_id|out_trade_no'];
    return this.request(pkg, { type: 'orderquery', needs }, callback);
};

// 关闭订单
Payment.prototype.closeOrder = function(params, callback) {
    var pkg = Object.assign({}, params, {
        appid: this.appid,
        mch_id: this.mchid,
        nonce_str: util.generateNonceStr()
    });

    var needs = ['out_trade_no'];
    return this.request(pkg, { type: 'closeorder', needs }, callback);
};

// 申请退款
Payment.prototype.refund = function(params, callback) {
    var pkg = Object.assign({}, params, {
        appid: this.appid,
        mch_id: this.mchid,
        nonce_str: util.generateNonceStr(),
        op_user_id: params.op_user_id || this.mchid
    });

    var needs = ['transaction_id|out_trade_no', 'out_refund_no', 'total_fee', 'refund_fee', 'op_user_id'];
    var cert = true;
    return this.request(pkg, { type: 'refund', needs, cert }, callback);
};

// 查询退款
Payment.prototype.refundQuery = function(params, callback) {
    var pkg = Object.assign({}, params, {
        appid: this.appid,
        mch_id: this.mchid,
        nonce_str: util.generateNonceStr()
    });

    var needs = ['transaction_id|out_trade_no|out_refund_no|refund_id'];
    return this.request(pkg, { type: 'refundquery', needs }, callback);
};

// 下载对帐单
Payment.prototype.downloadBill = function(params, callback) {
    var pkg = Object.assign({}, params, {
        appid: this.appid,
        mch_id: this.mchid,
        nonce_str: util.generateNonceStr(),
        bill_type: params.bill_type || 'ALL'
    });

    var needs = ['bill_date'];
    return this.request(pkg, { type: 'downloadbill', needs }, callback);
};

// 企业付款api
Payment.prototype.transfers = function(params, callback) {
    var pkg = Object.assign({}, params, {
        mch_appid: this.appid,
        mchid: this.mchid,
        nonce_str: util.generateNonceStr(),
        check_name: params.check_name || 'NO_CHECK',
        spbill_create_ip: params.spbill_create_ip || this.spbill_create_ip
    });

    var needs = ['partner_trade_no', 'openid', 'check_name', 'amount', 'desc'];
    if (pkg.check_name == 'FORCE_CHECK') needs.push('re_user_name');
    var cert = true;
    return this.request(pkg, { type: 'transfers', needs, cert }, callback);
};

// 查询企业付款API
Payment.prototype.transfersQuery = function(params, callback) {
    var pkg = Object.assign({}, params, {
        appid: this.appid,
        mch_id: this.mchid,
        nonce_str: util.generateNonceStr()
    });

    var needs = ['partner_trade_no'];
    var cert = true;
    return this.request(pkg, { type: 'gettransferinfo', needs, cert }, callback);
};

// 发送普通红包
Payment.prototype.sendRedpack = function(params, callback) {
    var pkg = Object.assign({}, params, {
        wxappid: this.appid,
        mch_id: this.mchid,
        nonce_str: util.generateNonceStr(),
        client_ip: params.client_ip || this.spbill_create_ip,
        mch_billno: params.mch_billno || (params.mch_autono ? this.mchid + util.formatToWechatTime() + params.mch_autono : ''),
        total_num: params.total_num || 1
    });
    delete pkg.mch_autono;

    var needs = ['mch_billno', 'send_name', 're_openid', 'total_amount', 'wishing', 'act_name', 'remark'];
    if (pkg.total_amount > 200) needs.push('scene_id');
    var cert = true;
    return this.request(pkg, { type: 'sendredpack', needs, cert }, callback);
};

// 发送裂变红包
Payment.prototype.sendGroupRedpack = function(params, callback) {
    var pkg = Object.assign({}, params, {
        wxappid: this.appid,
        mch_id: this.mchid,
        nonce_str: util.generateNonceStr(),
        mch_billno: params.mch_billno || (params.mch_autono ? this.mchid + util.formatToWechatTime() + params.mch_autono : ''),
        total_num: params.total_num || 3,
        amt_type: params.amt_type || 'ALL_RAND'
    });
    delete pkg.mch_autono;

    var needs = ['mch_billno', 'send_name', 're_openid', 'total_amount', 'wishing', 'act_name', 'remark'];
    if (pkg.total_amount > 200) needs.push('scene_id');
    var cert = true;
    return this.request(pkg, { type: 'sendgroupredpack', needs, cert }, callback);
};

// 查询红包记录
Payment.prototype.redpackQuery = function(params, callback) {
    var pkg = Object.assign({}, params, {
        appid: this.appid,
        mch_id: this.mchid,
        nonce_str: util.generateNonceStr(),
        bill_type: params.bill_type || 'MCHT'
    });

    var needs = ['mch_billno'];
    var cert = true;
    return this.request(pkg, { type: 'gethbinfo', needs, cert }, callback);
};

/* 支付结果通知 • 中间件 */

// Koa
Payment.prototype.middleware = function() {
    var that = this;
    return function*(next) {
        if (this.method != 'POST') throw new Error('请求来源错误');
        var xml = yield getRawBody(this.req, {
            length: this.length,
            limit: '1mb',
            encoding: this.charset
        });
        this.weixin = yield that.validate(xml);
        yield next;
    };
};
// Express
Payment.prototype.middlewareForExpress = function() {
    Log('eureri')
    var that = this;
    return function(req, res, next) {
        Log("~")
        if (req.method != 'POST') return next('请求来源错误');
        getRawBody(req, {
            length: req.headers['content-length'],
            limit: '1mb',
            encoding: 'utf8'
        }, function(err, xml) {
            console.log('middlewareForExpress==>',xml)
            if (err) return next(err);
            that.validate(xml, function(err, result) {
                if (err) return next(err);
                req.weixin = result;
                next();
            });
        });
    }
};


/* 其它依赖方法 */

// 发起请求: 自动区分callback或promise
Payment.prototype.request = function(params, options, callback) {
    var that = this;
    // callback
    if (typeof callback == 'function') return that._request(params, options, callback);
    // promise
    return new Promise(function(resolve, reject) {
        that._request(params, options, function(err, result) {
            err ? reject(err) : resolve(result);
        });
    });
};
// 发起请求(原始方法)
Payment.prototype._request = function(params, options, callback) {
    var that = this;
    var type = options.type;
    var needs = options.needs || [];
    var cert = options.cert || false;

    // 验证参数合法且完整
    var missing = [];
    needs.forEach(function(key) {
        var keys = key.split('|');
        for (var i = 0; i < keys.length; i++) {
            if (params[keys[i]]) return;
        }
        missing.push(key);
    });
    if (missing.length) return callback('missing params: ' + missing.join(', '));

    // 安全签名
    params.sign = that.getSign(params);
    console.log('params.sign==>',params.sign)
    // 创建请求参数
    var pkg = { method: 'POST', data: util.buildXML(params) };
    if (cert) {
        pkg.pfx = that.pfx;
        pkg.passphrase = that.passphrase;
    }
    Log(pkg)

    urllib.request(URLS[type], pkg, function(err, data, res) {
        Log('err==========')
        Log(err)
        Log('data==========')
        Log(data)
        Log('res=========')
        Log(res)
        Log('data==========')
        Log(data.toString())
        if (err) return callback(err);
        that.validate(data.toString(), type, callback, params.trade_type);
    });
};

// 数据合法性验证: 自动区分callback或promise
Payment.prototype.validate = function(xml, type, callback, flag) {
    if (typeof type == 'function') {
        callback = type;
        type = null;
    }

    var that = this;
    // callback
    if (typeof callback == 'function') return that._validate(xml, type, callback, flag);
    // promise
    return new Promise(function(resolve, reject) {
        that._validate(xml, type, function(err, result) {
            err ? reject(err) : resolve(result);
        }, flag);
    });
}

// 数据合法性验证(原始方法)
Payment.prototype._validate = function(xml, type, callback, flag) {
    var that = this;
    //测试加上
    // that.debug = true
    if (that.debug) console.info('---- tenpay debug ----\r\n' + xml);
    util.parseXML(xml, function(err, json) {
        // Log('err==========')
        Log(err)
        if (err) {
            if (type == 'downloadbill') return callback(null, xml);
            return callback('XMLParseError', xml);
        }
        Log(json)
        if (type == null) {
            if (json.appid !== that.appid) return callback('appid不匹配');
            if (json.mch_id !== that.mchid) return callback('mch_id不匹配');
            if (json.sign !== that.getSign(json)) return callback('sign签名错误');
            return callback(null, json);
        }
        if (json.return_code != 'SUCCESS') return callback(json.return_msg || '消息格式错误: return_msg');
        if (json.result_code != 'SUCCESS') return callback(json.err_code || 'err_code格式错误', json.err_code_des);
        if (type == 'downloadbill') {
            return callback('微信端返回参数错误');
        } else if (type == 'gettransferinfo' || type == 'gethbinfo') {
            if (json.mch_id !== that.mchid) return callback('mchid不匹配');
        } else if (type == 'sendredpack' || type == 'sendgroupredpack') {
            if (json.wxappid !== that.appid) return callback('wxappid不匹配');
            if (json.mch_id !== that.mchid) return callback('mchid不匹配');
        } else if (type != 'transfers' && type != 'send_coupon') {
            if (json.appid !== that.appid) return callback('appid不匹配');
            if (json.mch_id !== that.mchid) return callback('mch_id不匹配');
            if (json.sign !== that.getSign(json)) return callback('sign签名错误');
        }
        // Log('999999')
        if (flag == 'NATIVE') {
            callback(null, xml);
        } else {
            callback(null, json);
        }

    });
};

Payment.prototype.getSign = function(pkg) {
    pkg = Object.assign({}, pkg);
    delete pkg.sign;
    var str = util.toQueryString(pkg) + '&key=' + this.partnerKey;
    console.log('str==>',str)
    return crypto.createHash('md5').update(str, 'utf8').digest('hex').toUpperCase();
};

module.exports = Payment;