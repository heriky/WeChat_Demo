// 这是执行的第一个中间件!

const sha1 = require('sha1');
const path = require('path');
const Wechat = require('./wechat');
const getRawBody = require('raw-body');
const parseXML = require('./utils')['parseXML'];
const formatXML = require('./utils')['formatXML'];


const BASE_URL = 'https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&' ;
const tokenPath = path.resolve(__dirname,'../accessToken.txt');

module.exports = function(opts, replyHandler) { // 传入配置项
	
// 初始化微信账号，获取合法accestoken, 读出-> 验证-> 更新或者返回
	const wechat = new Wechat({
		appID: opts.appID,
		appsecret: opts.appsecret,
		token: opts.token,
		tokenPath: tokenPath,
		url: BASE_URL+`appid=${opts.appID}&secret=${opts.appsecret}`,
	})
	
	// Koa中的中间件必须是generator类型的,用作中间件的时候this指代的是app本身
  return function*(next) {
    const q = this.query;
    const encrypted = sha1([opts.token, q.timestamp, q.nonce].sort().join('')); // token、timestamp、nonce排序加密

		// GET请求验证
		if(this.method ==='GET'){
			if (encrypted === q.signature) {
			    this.body = q.echostr + "";
			    return true;
			} else {
			    this.body = 'Error, 账号验证未通过。';
			    return false;
			}
		}

		// POST 请求数据
		if(this.method === 'POST'){
			if (encrypted !== q.signature) {
			  this.body = 'Error, 账号验证未通过。'
			  return false;
			}
			
			// 在koa中通过raw-body来获取post过来的数据流！！获取输入流
			const bufData = yield getRawBody(this.req, {
				length: this.length,
				limit: '1mb',
				encoding: this.charset
			});
			 //  1.注意yield关键字和promise的配合 2.格式化xml字符流为普通的json
			const jsData = yield parseXML(bufData.toString()) ;
			// console.log(jsData);
			const msg = formatXML(jsData.xml) ;
			
			// 将消息挂在上下文中，可用于传递,在中间件中处理。这种全局挂在，然后再中间件中处理的思想非常重要。
			this.recvMsg = msg ; 
			
			// 1. 将收到的消息解析成功之后，将执行权限交给业务逻辑层，业务逻辑层中进行消息类型的判断和定制回复规则。
			// 2. express使用next串联中间件，koa使用yield next调用中间件的传递。
			// 3. 这里的yield后面的是另一个generator函数，即yield function *(){} . 
			// 4. 疑问：这里的next是哪里来的？？注意，koa中间件调用的时候自动传入的是next！！！用于执行中间件的传递 yield next.
			yield replyHandler.call(this, next) ; // 回复规则,内部有yield next

			wechat.reply.call(this) ; // 在wechat类中进行消息的回复，使用call的目的是将当前上下文传递给wechat。

		}
	}


}
