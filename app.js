const Koa = require('koa');
const wConfig = require('./env.config')['wechat'];
const handler = require('./wx/handler') ;
const app = new Koa();

// 1. 微信网页开发的入口中间件(路由中间件)
app.use(require('./wx/page')(wConfig));

// 2. 微信内交互的入口中间件(聊天交互或者菜单交互的中间件)
const wxChat = require('./wx/g')(wConfig, handler.reply); 
app.use(wxChat) ;
app.listen(3000, ()=>{
	console.log('Server is running on port 3000')
});
