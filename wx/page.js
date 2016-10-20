// 提供临时的页面服务


function renderPage(data){ // data 结构必须是{appId, timestamp(注意是秒为单位), nonceStr, signature, jsApiList}

	//需要将数组格式的jsApiList处理一下
	var arrConvert = '[';
	data.jsApiList.forEach((item)=>{arrConvert += '"'+item+'",'}) ;
	arrConvert+= ']' ;

	var html = `
	<!DOCTYPE html>
	<html lang="en">
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width,initial-scale=1.0,minimum-scale=1.0,maximum-scale=1.0,user-scaleable=no">
		<title>测试页面</title>
		<script src="http://cdn.bootcss.com/zepto/1.2.0/zepto.min.js"></script>
		<script src="http://res.wx.qq.com/open/js/jweixin-1.0.0.js"></script>
		
		<script>
			wx.config({
		    debug: false, // 开启调试模式,调用的所有api的返回值会在客户端alert出来，若要查看传入的参数，可以在pc端打开，参数信息会通过log打出，仅在pc端时才会打印。
		    appId: "${data.appId}", // 必填，公众号的唯一标识
		    timestamp: "${data.timestamp}", // 必填，生成签名的时间戳
		    nonceStr: "${data.nonceStr}", // 必填，生成签名的随机串
		    signature: "${data.signature}",// 必填，签名，见附录1
		    jsApiList: ${arrConvert} // 必填，需要使用的JS接口列表，所有JS接口列表见附录2
			});
	

			wx.ready(function(){
				
				// 判断是否支持指定的接口
				wx.checkJsApi({
				    jsApiList: ['startRecord', 'stopRecord', 'onVoiceRecordEnd' ,'translateVoice'], 
				    success: function(res) {
				        // 以键值对的形式返回，可用的api值true，不可用为false
				        // 如：{"checkResult":{"chooseImage":true},"errMsg":"checkJsApi:ok"}
				        
				    }
				});

				// 开始设置录音逻辑
				
				var isRecording = false;
				var recordTip = $('h1') ;
				//recordTip.on('tap',function(){alert('x')}) // tap事件需要引入额外的tap.js插件
				recordTip.on('click', function(){
					if (!isRecording) {
						// 开始录音
						recordTip.text('正在录音，点击停止。')
						wx.startRecord();
						isRecording = true;
						return;
					}

					if(isRecording){
						// 停止录音
						recordTip.text('停止录音，正在识别')
						wx.stopRecord({
					    success: function (res) {
					    	isRecording = false;
					    	var localId = res.localId;
								// 开始识别录音
					    	wx.translateVoice({
				    	   localId: localId, // 需要识别的音频的本地Id，由录音相关接口获得
				    	    isShowProgressTips: 1, // 默认为1，显示进度提示
				    	    success: function (res) {
				    	      alert(res.translateResult); // 语音识别的结果
				    	      recordTip.text('开始录音')
				    	    }
					    	});

					    }
						});
					}

				});



			});

			wx.error(function(err){
				console.log(err);
			})

		</script>
	</head>
	<body>
		<h1 id="record">点击开始录音翻译</h1>
		<h2 id="title"></h2>
		<div id="poster"></div>
	</body>
	</html>
	`;
	return html;
}

const wechat = require('./wechat')();

function createSignData(appId, ticket, url){
	const timestamp = parseInt((+new Date() / 1000), 10);
	const nonceStr = Math.random().toString(36).substr(2, 16);
	const signature = require('./utils').ticketSign(nonceStr, ticket, timestamp, url);
	const jsApiList = [
		'startRecord',
		'stopRecord',
		'onVoiceRecordEnd',
		'translateVoice'
	];
	
	return {appId, timestamp, nonceStr, signature, jsApiList};
}


module.exports = function(opts){ // 直接的中间件只能被传入next，如果想要自定义传入参数，还是使用闭包吧
	// 这个是真正的中间件
	return function* (next){
		if (this.url.indexOf('/movie') !== -1) {
			//获取accesstoken => 获取ticket => 签名=> 渲染页面
			const acObj = yield wechat.getAccessToken() ;
			const ticketObj = yield wechat.getTicket(acObj.access_token) ;
			const ticket = ticketObj.ticket;
			const signData = createSignData(opts.appID, ticket, this.href);
			
			// this.originalUrl打印出/movie ,this.href打印出http://5eed222f.tunnel.qydev.com/movie
			// 所以用this.href
			//console.log('测试this.href:', this.href) ; 
			//console.log('url'+this.url, 'originalUrl:'+this.originalUrl, 'origin:'+ this.origin, 'href:'+this.href, 'path:'+this.path)

			//console.log('签名数据对象:', signData);
			
			this.body = renderPage(signData);
			return;  // 提前结束事件循环不再执行后面中间件
		}
		yield next;
	}

}

