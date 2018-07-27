let wx = {
    appid:'wx4da3552bdd8bf8cb',
    AppSecret:'4a270e9861b8215e8edd3fec65d231aa',
    mchid: '1502556741',//微信商户号
	partnerKey: 'hufangtongwangluokejiyouxian1234',//微信支付安全密钥,商户平台设置的api秘钥

	pfx: __dirname+'/cert/apiclient_cert.p12',//证书文件路径
	notify_url: 'https://www.ifruit.org/wx/payCallback',//支付回调网址
	spbill_create_ip: '47.94.207.120'//IP地址
}
export default wx