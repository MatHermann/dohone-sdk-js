var request = require('request')

var STATUSES = ['OK', 'KO', 'NO', 'ERROR']

function AbstractDohoneSDK(hashCode, notifyUrl) {
    // constants
    this.BASE_URL = null
    this.OPERATORS = null

    // properties
    this.hashCode = hashCode
    this.notifyUrl = notifyUrl
}

AbstractDohoneSDK.prototype.getOperatorCodeFromSlug = function (slug) {
    if (this.OPERATORS.hasOwnProperty(slug))
        return this.OPERATORS[slug];

    return null;
}

AbstractDohoneSDK.prototype.getOperatorSlugFromCode = function (code) {
    for (var key in this.OPERATORS)
        if (this.OPERATORS.hasOwnProperty(key) && this.OPERATORS[key] === code)
            return key

    return null;
}

// Override in subclasses
AbstractDohoneSDK.prototype.parseDohoneResponse = function (res) {
    if (res === '')
        throw new Error("Response body is either empty or contains only whitespaces.")

    var status = res.split(' ')[0]; // First word

    if (STATUSES.indexOf(status) < 0)
        throw new Error("Can't get request status from response body.");

    return {
        status: status,
        fullResponse: res
    }
}

AbstractDohoneSDK.prototype.computeResponse = function (res) {
    res.isSuccess = res.status === 'OK'
    res.hasREF = res.REF && res.REF !== ''

    return res
}

AbstractDohoneSDK.prototype.request = function (params, callback) {
    var _this = this
    var options = {
        url: this.BASE_URL,
        qs: params,
        timeout: 10*60*1000 // 10 minutes
    }
    request(options, function (err, res, body) {
        if (err)
            return callback(err)

        try {
            return callback(null, _this.computeResponse(_this.parseDohoneResponse(body.trim())))
        }
        catch (e) {
            return callback(e)
        }
    })
}

module.exports = AbstractDohoneSDK
exports.STATUSES = STATUSES