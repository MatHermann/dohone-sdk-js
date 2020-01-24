var AbstractDohoneSDK = require('./AbstractDohoneSDK')
var md5 = require('md5')

function DohoneSDK(merchantKey, dohoneAppName, hashCode, notifyUrl) {
    AbstractDohoneSDK.call(this, hashCode, notifyUrl)

    this.merchantKey = merchantKey
    this.dohoneAppName = dohoneAppName
    this.BASE_URL = 'https://www.my-dohone.com/dohone/pay'
    this.OPERATORS = {
        'DOHONE_MOMO': 1, // MTN Mobile Money
        'DOHONE_OM': 2,   // Orange Money
        'DOHONE_EU': 3,   // Express Union Mobile Money
        'DOHONE_TRANSFER': 10 // Dohone Account Transfer
    }
}

DohoneSDK.prototype = Object.create(AbstractDohoneSDK.prototype)
DohoneSDK.prototype.constructor = DohoneSDK

DohoneSDK.prototype.parseDohoneResponse = function (res) {
    var words = res.split(' ');
    var cmd = words.length > 1 ? words[1] : null; // Second word
    var message = res.substr(res.indexOf(':') + 2);
    var refIndex = message.indexOf('REF');
    var needCFRMSMS = message.indexOf('SMS') >= 0;
    var REF = refIndex >= 0 ? message.substr(refIndex + 5) : null;

    var response = Object.getPrototypeOf(DohoneSDK.prototype).parseDohoneResponse(res)
    response.cmd = cmd
    response.message = message
    response.needCFRMSMS = needCFRMSMS
    response.REF = REF

    return response
}

DohoneSDK.prototype.quote = function (transaction, params, callback) {
    params = {
        cmd: 'cotation',
        rH: this.merchantKey,
        rMo: this.getOperatorCodeFromSlug(transaction.operator),
        rMt: transaction.amount,
        rDvs: transaction.currency,
        levelFeeds: params.mode
    }
    this.request(params, callback)
}

DohoneSDK.prototype.start = function (transaction, params, callback) {
    var notifyUrl = this.notifyUrl

    if (transaction.notifyUrl)
        notifyUrl = transaction.notifyUrl

    params = {
        cmd: 'start',
        rN: transaction.customerName,
        rT: transaction.customerPhoneNumber,
        rE: transaction.customerEmail,
        rI: transaction.ref,
        rH: this.merchantKey,
        rMo: this.getOperatorCodeFromSlug(transaction.operator),
        rOTP: params.OTP,
        rMt: transaction.amount,
        rDvs: transaction.currency,
        source: this.dohoneAppName,
        notifyPage: notifyUrl,
        motif: transaction.reason
    }
    this.request(params, callback)
}

DohoneSDK.prototype.confirmSMS = function (transaction, params, callback, retryOnError) {
    params = {
        cmd: 'cfrmsms',
        rCS: params.code,
        rT: transaction.customerPhoneNumber
    }
    var _this = this
    this.request(params, function (err, dohoneRes) {
        if (err && retryOnError)
            _this.request(params, callback)
        else
            callback(err, dohoneRes)
    })
}

DohoneSDK.prototype.verify = function (transaction, callback) {
    var params = {
        cmd: 'verify',
        rI: transaction.ref,
        rMt: transaction.amount,
        rDvs: transaction.currency,
        idReqDoh: transaction.dohoneRef
    }
    this.request(params, callback)
}

DohoneSDK.prototype.mapNotificationData = function (data) {
    var map = {
        rI: 'ref',
        rMt: 'amount',
        rDvs: 'currency',
        mode: 'operator',
        motif: 'reason',
        idReqDoh: 'dohoneRef',
        rH: 'merchantKey',
        hash: 'hash'
    }
    for(var key in map)
        if (map.hasOwnProperty(key) && data.hasOwnProperty(key))
            data[map[key]] = data[key]

    return data;
}

DohoneSDK.prototype.checkHash = function (notificationData) {
    if (notificationData.merchantKey !== this.merchantKey)
        return false

    var dohoneRef = notificationData.dohoneRef
    var ref = notificationData.ref
    var amount = notificationData.amount
    var hash1 = md5(dohoneRef + ref + amount + this.hashCode)
    var hash2 = md5(dohoneRef + ref + parseInt(amount) + this.hashCode)

    return notificationData.hash === hash1 || notificationData.hash === hash2
}

module.exports = function (merchantKey, dohoneAppName, hashCode, notifyUrl) {
    return new DohoneSDK(merchantKey, dohoneAppName, hashCode, notifyUrl)
}
