exports.log = {
    appenders: {
        stdout: { type: 'stdout' },
        file: { type: 'file', filename: '.info.log' },
    },
    categories: {
        default: { appenders: [ 'file', 'stdout' ], level: 'debug' }
    }
}

exports.baseAssetsUrl = 'http://192.168.1.100:3002/assets/' //'http://ifruit.org/assets/';
exports.uploadUrl = "/static/uploads"
exports.upload = process.cwd() + "/static/uploads"

exports.skipAuth = false //是否跳过权限控制


