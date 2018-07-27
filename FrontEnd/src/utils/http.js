const wepy = require('wepy').default

let baseConfig = {
  baseUrl: 'http://42.203.2.208:3002',
  method: 'GET',
  url: '',
  //data: {},
  header: {},
  beforeRequest() {
    wx.showLoading({
      title: '拼命请求中...'
    })
    return true
  },
  beforeResolve(res) {
    return res
  },
  success() {},
  fail() {},
  complete() {}
}

// Promise.prototype.success
function http(config) {
  let conf = Object.assign({}, baseConfig, config)

  if (conf.url.indexOf('http') == -1) {
    conf.url = conf.baseUrl + conf.url
  }
  console.info('请求发起的参数：', conf)
  let { reqSuccess, reqFail, reqComplete } = {}
  let req = {
    success(func) {
      reqSuccess = func
    },
    fail(func) {
      reqFail = func
    },
    complete(func) {
      reqComplete = func
    }
  }
  conf.beforeRequest();
  wepy.request({
    ...conf,
    success(res) {
      if (res.data.reload) {
        wx.showToast({
          title: '登录失效，即将重试登录',
          duration: 3000,
          complete: () => {
            wx.reLaunch({
              url: './find_home'
            })
          }
        })
      }

      if (res.data.errMsg) {
        wx.showToast({
          title: res.data.errMsg,
          duration: 8000,
        })

        return;
      }

      //4.询问是否是该企业员工
      const staff = res.data.staff
      if (staff) {
        wx.showModal({
          title: '提示',
          content: res.data.msg,
          cancelText: '不是',
          confirmText: '是',
          success: res => {
            //res.confirm
            const data = {
              tempId: staff[0].id,
              result: res.confirm ? 1 : 0
            }
            //更新临时表，用户权限
            http.post('/user/confirmStaff', data).success(res => {
              _this.userCheck() //重新执行wxCode以获取最新用户信息
            })
          }
        })
        return;
      }

      setTimeout(() => {
        wx.hideLoading()
      }, 300)
      console.info('请求成功的返回值：', res)
      if (conf.beforeResolve) {
        let _res = conf.beforeResolve(res)
        if (!_res) {
          return false
        }
        conf.success(_res)

        reqSuccess && reqSuccess(_res)
      }
    },
    fail(res) {
      wx.showModal({
        title: '网络错误',
        content: Object.values(res).toString(),
        success: function(res) {
          if (res.confirm) {
            console.log('用户点击确定')
          } else if (res.cancel) {
            console.log('用户点击取消')
          }
          wx.navigateBack();
        }
      })


      console.error('请求失败的返回值：', res)
      conf.fail && conf.fail(res)
      reqFail && reqFail(res)
    },
    complete(res) {
      conf.complete && conf.complete(res)
      reqComplete && reqComplete(res)
    },
  });

  return req
}

http.get = (url, params, success, fail, complete) => {
  let c = {
    method: 'GET',
    url: url + jsonToParams(params),
  }
  console.log('c=>', c)
  success && (c.success = success)
  fail && (c.fail = fail)
  complete && (c.complete = complete)
  return http(c)
}

http.post = (url, params, success, fail, complete) => {
  let c = {
    method: 'POST',
    url,
    data: params
  }
  success && (c.success = success)
  fail && (c.fail = fail)
  complete && (c.complete = complete)
  return http(c)
}

http.put = (url, params, success, fail, complete) => {
  let c = {
    method: 'PUT',
    url,
    data: params
  }
  success && (c.success = success)
  fail && (c.fail = fail)
  complete && (c.complete = complete)
  return http(c)
}

http.delete = (url, params, success, fail, complete) => {
  let c = {
    method: 'DELETE',
    url,
    data: params
  }
  success && (c.success = success)
  fail && (c.fail = fail)
  complete && (c.complete = complete)
  return http(c)
}

function jsonToParams(json) {
  if (!json) {
    return ''
  }
  if (typeof json == 'string') {
    return json
  }

  return '?' + Object.keys(json).map(function(key) {
    return encodeURIComponent(key) + "=" + encodeURIComponent(json[key]);
  }).join("&");
}

http.baseConfig = baseConfig;

module.exports = http
