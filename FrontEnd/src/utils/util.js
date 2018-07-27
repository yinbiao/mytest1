import http from '../utils/http.js'
function formatTime(date) {
  var year = date.getFullYear()
  var month = date.getMonth() + 1
  var day = date.getDate()

  var hour = date.getHours()
  var minute = date.getMinutes()
  var second = date.getSeconds();


  return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

function formatNumber(n) {
  n = n.toString()
  return n[1] ? n : '0' + n
}

function formatLocation(longitude, latitude) {
  longitude = longitude.toFixed(2)
  latitude = latitude.toFixed(2)

  return {
    longitude: longitude.toString().split('.'),
    latitude: latitude.toString().split('.')
  }
}
// 百度地图 转 火星坐标系（腾讯地图）
function BdmapEncryptToMapabc(bdLat, bdLon) {
  var point = {};
  var xPi = 3.14159265358979324 * 3000.0 / 180.0;
  var x = Number(bdLon - 0.0065);
  var y = Number(bdLat - 0.006);
  var z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * xPi);
  var theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * xPi);
  var MarsLon = z * Math.cos(theta);
  var MarsLat = z * Math.sin(theta);
  point.lng = MarsLon;
  point.lat = MarsLat;
  return point;
}

function chooseImagesAndUpload(data) {
  wx.chooseImage({
      count: 9, // 默认9
      sizeType: ['original', 'compressed'], // 可以指定是原图还是压缩图，默认二者都有
      sourceType: ['album', 'camera'], // 可以指定来源是相册还是相机，默认二者都有
      success: function(res) {
        // 返回选定照片的本地文件路径列表，tempFilePath可以作为img标签的src属性显示图片
        var path = res.tempFilePaths;
        console.log('tempFilePaths:', path)
        uploadFile({
          ...data,
          path
        })
      }
  })
}

function chooseVideoAndUpload(data) {
  wx.chooseVideo({
      success: function(res) {
        // 返回选定照片的本地文件路径列表，tempFilePath可以作为img标签的src属性显示图片
        var path = [res.tempFilePath];
        console.log('tempFilePaths:', path)
        uploadFile({
          ...data,
          path
        })
      }
  })
}


//多张图片上传
function uploadFile(data){
 /*
  data{
    path:[],
    succ:func,
  }
 */
 var that=this,
     i=data.i?data.i:0,//当前上传的哪张图片
     successCount=data.successCount?data.successCount:0,//上传成功的个数
     failCount=data.failCount?data.failCount:0;//上传失败的个数
  wx.uploadFile({
        url: http.baseConfig.baseUrl + '/user/fileUpload', 
        filePath: data.path[i],
        name: 'file',//这里根据自己的实际情况改
        formData:{
          'token': http.baseConfig.header.token
        },//这里是上传图片时一起上传的数据
        success: (resp) => {
           successCount++;//图片上传成功，图片上传成功的变量+1
           // console.log('resp=>',resp,resp.path)
           data.success && data.success(resp,data)

           
           // console.log(i);
           //这里可能有BUG，失败也会执行这里,所以这里应该是后台返回过来的状态码为成功时，这里的success才+1
        },
        fail: (res) => {
            failCount++;//图片上传失败，图片上传失败的变量+1
            console.log('failCount:'+i+"failCount:"+failCount);
        },
        complete: () => {
            //console.log(i);
            i++;//这个图片执行完上传后，开始上传下一张
        if(i==data.path.length){   //当图片传完时，停止调用          
            console.log('执行完毕');
            console.log('成功：'+successCount+" 失败："+failCount);
        }else{//若图片还没有传完，则继续调用函数
            //console.log(i);
            data.i=i;
            data.successCount=successCount;
            data.failCount=failCount;
            uploadFile(data);
        }
            
        }
    });
}



module.exports = {
  formatTime: formatTime,
  formatLocation: formatLocation,
  BdmapEncryptToMapabc: BdmapEncryptToMapabc,
  chooseImagesAndUpload,
  chooseVideoAndUpload
}
