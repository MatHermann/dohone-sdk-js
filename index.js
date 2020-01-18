require('tls').DEFAULT_MIN_VERSION = 'TLSv1'
var payin = require('./src/DohoneSDK')
var payout = require('./src/DohonePayoutSDK')

var dohoneSdk = payin
dohoneSdk.payin = payin
dohoneSdk.payout = payout

module.exports = dohoneSdk
