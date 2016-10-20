const path = require('path');

module.exports = {
	wechat: {
		appID:'wx5c4c290c2c7879b2',
		appsecret: 'b9ea8ab439695142453ec61a1156238e',
		// appID: 'wxb5ed9e1133b1dd4c',
		// appsecret: '2aeed0108f0faf1708fbc43193175866',
		token: 'ihankang',
		tokenPath: path.resolve(__dirname,'./wx/config/accessToken.txt'),
		jsApiTicketPath: path.resolve(__dirname, './wx/config/jsApiTicket.txt')
	}
}