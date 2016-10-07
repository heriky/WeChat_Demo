// 第二个中间件，处理回复规则


// 处理事件推送
function handleEvent(msg){
	switch(msg.Event){
		case 'subscribe':
			if(msg.EventKey){ 
				console.log(`扫描二维码进来的.EventKey:${msg.EventKey} . Ticket:${msg.Ticket}`)
			}
			this.body = {type:'text', content: '哈哈， 你订阅成功了。'}
			break;

		case 'unsubscribe':
			this.body = {type:'text',content:''} ;
				console.log('无情取关')
			break;
			
		case 'SCAN':
			console.log(`关注后扫描二维码. EventKey:${msg.EventKey}. Ticket: ${msg.Ticket}`)
			this.body = {type:'text', content: "扫描了二维码"}
			break;

		case 'LOCATION':
			console.log(`上报地理位置。Latitude:${msg.Latitude}. Longitude:${msg.Longitude}. Precision:${Precision}`)
			this.body = {type: 'text', content: '上报了地理位置.'}
			break;

		case 'CLICK':
			console.log('点击了自定义菜单，发生click事件。EventKye:'+msg.EventKey)
			this.body = {type:'text', content: '点击自定义菜单CLICK'}
			break;

		case 'VIEW':
			console.log('点击自定义菜单，View事件. url为：'+ msg.EventKey)
			this.body = {type: 'text', content:'VIEW事件发生'}
			break;

		default:
			throw Error('Invalid EventType, by hk.')		
	}
}

// 处理文本消息的回复规则
function handleText(msg){
	const recvContent = msg.Content;
	if(recvContent === '1'){
		this.body = {type: 'text', content: '天下第一吃大米'}
	}else if(recvContent == '2'){
		//array(obj) [{title, description, picUrl, url},{}]
		var content = [{
			title: '发狗粮的季节',
			description: '猝不及防就发狗粮，我兼职哔了狗了',
			picUrl: 'http://img3.cache.netease.com/3g/2015/10/31/201510311401228c35c.jpg',
			url: 'http://baidu.com'
		}]
		this.body = {type: 'news', content: content}
	}else{
		this.body = {type: 'text', content: '听不懂你说什么'}
	}
}

exports.reply = function* (next){
	const recvMsg = this.recvMsg ;

	// 整体划分为"事件推送"和"普通消息"， 事件推送内通过Event区分不同事件。
	switch(recvMsg.MsgType){
		case 'event':
			handleEvent.call(this, recvMsg)
			break;
		case 'text':
			handleText.call(this, recvMsg)
			break;
		case 'image':

			break;
		case 'voice':

			break;
		case 'video':

			break;
		case 'music':

			break;
		case 'news':

			break;
		default: 
			throw new Error('Invalid msgType, by hk.')
	}

	yield next; // 千万不能忘记这个。
}