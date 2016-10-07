const Koa = require('koa');
const wConfig = require('./env.config')['wechat'];
const handler = require('./libs/handler') ;

const app = new Koa();
app.use(require('./libs/g')(wConfig, handler.reply)) ; // handler.reply是传入回复规则处理的函数
app.listen(3000, ()=>{
	console.log('Server is running on port 3000')
});
