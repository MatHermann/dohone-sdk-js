var AbstractDohoneSDK = require('./AbstractDohoneSDK')
var md5 = require('md5')

function DohonePayoutSDK(dohoneAccount, hashCode, notifyUrl) {
    AbstractDohoneSDK.call(this, hashCode, notifyUrl)

    this.dohoneAccount = dohoneAccount
    this.BASE_URL = 'https://www.my-dohone.com/dohone/transfert'
    this.OPERATORS = {
        'DOHONE_MOMO': 5, // MTN Mobile Money
        'DOHONE_OM': 6,   // Orange Money
        'DOHONE_EU': 3,   // Express Union Mobile Money
        'DOHONE_TRANSFER': 1 // Dohone Account Transfer
    }
}

DohonePayoutSDK.prototype = Object.create(AbstractDohoneSDK.prototype)
DohonePayoutSDK.prototype.constructor = DohonePayoutSDK

DohonePayoutSDK.prototype.parseDohoneResponse = function (res) {
    // If response is a float number, add 'OK / ' before
    if (res.match(/^[+-]?[0-9]*.?[0-9]+$/))
        res = 'OK / ' + res

    var response = Object.getPrototypeOf(DohonePayoutSDK.prototype).parseDohoneResponse(res)

    var message = res.substr(res.indexOf('/') + 2)

    response.message = message

    if (response.isSuccess)
        response.REF = message

    return response
}

DohonePayoutSDK.prototype.quote = function (transaction, callback) {
    var params = {
        cmd: 'cotation',
        amount: transaction.amount,
        devise: transaction.currency,
        mode: this.getOperatorCodeFromSlug(transaction.operator)
    }
    this.request(params, callback)
}

DohonePayoutSDK.prototype.transfer = function (transaction, callback) {
    var account = this.dohoneAccount
    var mode = this.getOperatorCodeFromSlug(transaction.operator)
    var amount = transaction.amount
    var devise = transaction.currency
    var transID = transaction.ref
    var hash = md5(account + mode + amount + devise + transID + this.hashCode)
    var notifyUrl = this.notifyUrl

    if (transaction.notifyUrl)
        notifyUrl = transaction.notifyUrl

    var params = {
        account: account,
        destination: transaction.customerPhoneNumber,
        mode: mode,
        amount: amount,
        devise: devise,
        nameDest: transaction.customerName,
        ville: transaction.customerCity,
        pays: transaction.customerCountry,
        transID: transID,
        hash: hash,
        notifyUrl: notifyUrl
    }

    this.request(params, callback)
}

DohonePayoutSDK.prototype.mapNotificationData = function (data) {
    var map = {
        transID: 'ref',
        amount: 'amount',
        devise: 'currency',
        mode: 'operator',
        status: 'status',
        nameDest: 'customerName',
        destination: 'customerPhoneNumber',
        withdrawal_mode: 'withdrawalMode'
    }
    for(var key in map)
        if (map.hasOwnProperty(key) && data.hasOwnProperty(key))
            data[map[key]] = data[key]

    return data;
}

module.exports = function (dohoneAccount, hashCode, notifyUrl) {
    return new DohonePayoutSDK(dohoneAccount, hashCode, notifyUrl)
}
