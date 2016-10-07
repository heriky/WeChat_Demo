/**
 * [用于对微信一些参数进行初始化、更新或者预处理] 
 * @param {[type]} opts [需要传入配置参数,必须包含的字段有:
 * {
 * 		appID,
 * 		appsecret,
 * 		token,
 * 		tokenPath,  // 保存accessToken的文件路径
 * 		url // 获取新的accesstoken所使用的请求url
 * }
 */

const fs = require('fs');
const request = require('superagent');
const renderMsg = require('./utils')['renderMsg'];


function Wechat(opts){
	const that = this;
	this.appID = opts.appID ;
	this.appsecret = opts.appsecret;
	this.token = opts.token;
	this.tokenPath = opts.tokenPath;
	this.url = opts.url;
	
	Wechat.prototype.getAccessToken.call(this);
}

Wechat.prototype = {
	
	getAccessToken: function(){  // 读取文件-> 是否过期-> 否(不操作)，是-> 发起请求
		this.readAccessToken()
			.then(content=>{ // 读取的是字符串
				try{
					const obj = JSON.parse(content);
					if(!this.isValidAccessToken(obj)){ 
						console.log('无效的accesstoken,开始获取新的accesstoken')
						return this.updateAcessToken();
					}else{
						console.log('有效的accesstoken')
						return Promise.resolve(content) ; // 为了保持下一个then的连贯性，token有效的时候仍然需要返回一个
					} 
				}catch(err){
					console.log('发生错误', err) ;
					return this.updateAcessToken();  // 异常分为两类:1.文件不粗拿在 2.文件中字符串时非法的JSON字符串。
				}
			})
			.then(data=>{
				this.saveAccessToken(data).then().catch(err=>{console.log('写入文件发生错误',err); throw err;});
			})
			.catch(err=>{
				console.log(err) ;
				throw err;
			});
	}
	,

	readAccessToken: function(){
		return new Promise((resolve, reject)=>{
			fs.readFile(this.tokenPath, (err, data)=>{
				if (err) {reject(err)}
				else{
					resolve(data);
				}
			})
		})
	},
	saveAccessToken: function( data){

		return new Promise((resolve, reject)=>{
			fs.writeFile(this.tokenPath, data, err=>{
				if (err) {reject(err)}
				else{
					resolve(true);
				}
			})
		})
	},

	updateAcessToken: function(){
		// 发送新的请求, 获取新的json数据{access_token:'', expires_in:''}
		return new Promise((resolve, reject)=>{
			request
        .get(this.url)
        .timeout(10000)
        .end((err, res) => {
					if (err) { reject(err) }
					else{
						const data = JSON.parse(res.text) ; // data的结构为{access_token:', expires_in:''}
						data['expires'] = (+new Date()) + (data['expires_in'] - 20)*1000; // expires_in单位是秒，时间戳是毫秒
						console.log('新的accesstoken为:'+res.text)
						resolve(JSON.stringify(data))
					}
        })
		})
	},

	isValidAccessToken: function(data){
		if (data==null || data['access_token'] == null || data['expires_in'] == null || data['expires'] == null) {
			return false;
		}
		const now = +new Date();
		if (now >= data['expires']) {
			return false;
		}
		return true;
	},

	reply: function(){
		var rawReply = this.body ; // 根据业务逻辑层的规则产生不同的回复体，格式为{type:消息体类型，content: 消息体具体内容}
		var recvMsg = this.recvMsg; // 用于发来的消息体
		const reply = renderMsg(rawReply, recvMsg);

		//console.log(reply)

		this.type = 'application/xml';
		this.status = 200 ;
		this.body = reply ;
		return;
	}
	,
	// 处理临时素材和永久素材的上传。
	uploadMaterial:function(){
		
	}
}

module.exports = Wechat ;