# DohoneSDK
[![Latest Version on Packagist][ico-version]][link-npmjs]
[![Total Downloads][ico-downloads]][link-npmjs]  
A NodeJS SDK for easily use Dohone payment API.

## Note
This module let you easily integrate **Dohone payment API** to your application or your web site for every Cameroon mobile payments operators (MTN Mobile Money, Orange Money and Express Union Mobile Money).  

Before you start using this package, it's highly recommended to read documents below.
- [TUTORIAL D’INSTALLATION DE L’API DE PAIEMENT EN LIGNE POUR APPLICATIONS MOBILES][link-dohone-doc-mobile]
- [TUTORIAL D’INSTALLATION DE L’API DE PAIEMENT EN LIGNE][link-dohone-doc-web]
- [TUTORIAL D’INSTALLATION DE L’API DE TRANSFERTS AUTOMATIQUES (PAYOUT)][link-dohone-doc-payout]

## Table of contents
* [1. Requirements](#1-requirements)
* [2. Installation](#2-installation)
* [3. Payin requests (collect payments)](#3-payin-requests-collect-payments)
    * [3.1. Create a DohoneSDK object](#31-create-a-dohonesdk-object)
    * [3.2. Make a &laquo; COTATION &raquo; command](#32-make-a--cotation--command)
    * [3.3. Make a &laquo; START &raquo; command](#33-make-a--start--command)
    * [3.4. Make a &laquo; CFRMSMS &raquo; command](#34-make-a--crfmsms--command)
    * [3.5. Make a &laquo; VERIFY &raquo; command](#35-make-a--verify--command)
    * [3.6. Handle Dohone's notifications](#36-handle-dohones-notifications)
* [4. Payout requests (refund customer or withdraw money)](#4-payout-requests-refund-customer-or-withdraw-money)
    * [4.1. Create a DohonePayoutSDK object](#41-create-a-dohonepayoutsdk-object)
    * [4.2. Make a &laquo; COTATION &raquo; command](#42-make-a--cotation--command)
    * [4.3. Make a transfer](#43-make-a-transfer)
    * [4.4. Handle Dohone's payout notifications](#44-handle-dohones-payout-notifications)

## 1. Requirements
There is no specific requirements for this package.

## 2. Installation
``` bash
$ npm install dohone-sdk
```

## 3. Payin requests (collect payments)
### 3.1. Create a DohoneSDK object
You can find [DohoneSDK class here][link-dohone-sdk].
``` js
var dohone = require('dohone-sdk');

// constants
var merchantKey = '...'; // your dohone merchant key (required)
var appName = '...'; // the name by which your application is recognized at Dohone
var hashCode = '...'; // your dohone hash code (only if you handle dohone notifications in your system)
var notifyUrl = '...'; // default notification URL for incoming payments

var dohoneSdk = dohone.payin(merchantKey, appName, hashCode, notifyUrl);

// ...
```
### 3.2. Make a &laquo; COTATION &raquo; command
``` js
// ...

/**
 * transaction is a JSON object with following properties
 *   - amount: number
 *   - currency: 'XAF', 'EUR' or 'USD'
 * params is a JSON object with following properties
 *   - mode: 0, 1, 2, 3 or 4 (exact as levelFeeds in Dohone docs)
 */
var transaction = {
    amount: 1000,
    currency: 'XAF'
};
var params = {
    mode: 0
};
dohoneSdk.quote(transaction, params, function (err, dohoneRes) {
    if (err) {
        // handle request error here
    }
    else if (dohoneRes.isSuccess) {
        // use dohoneRes.message here
    }
    else {
        // Dohone error, check dohoneRes.message
    }
});

// ...
```

### 3.3. Make a &laquo; START &raquo; command
``` js
// ...

/**
 * transaction is a JSON object with following properties
 *   - ref: string (unique transaction reference in your system)
 *   - amount: number
 *   - currency: 'XAF', 'EUR' or 'USD'
 *   - operator: 'DOHONE_OM', 'DOHONE_MOMO', 'DOHONE_EU', 'DOHONE_TRANSFER'
 *   - customerPhoneNumber: string
 *   - customerName: string
 *   - customerEmail: string
 *   - reason: string
 *   - notifyUrl: string (notification URL for this transaction)
 * params is a JSON object with following properties
 *   - OTP: number (payment code in case of Orange Money)
 */
var transaction = {
    ref: '146eb9e4-fad1-4214-a8ed-9e5316ef2fad',
    amount: 1000,
    currency: 'XAF',
    operator: 'DOHONE_OM', // Orange Money
    customerPhoneNumber: '699999999'
};
var params = {
    OTP: '452132' // provided by user
};
dohoneSdk.start(transaction, params, function (err, dohoneRes) {
    if (err) {
        // handle request error here
    }
    else if (dohoneRes.isSuccess) {
        if (dohoneRes.needCFRMSMS) {
            // must make a CFRMSMS command
        }
        else if (dohoneRes.hasREF) {
            // successful transaction
            // dohoneRes.REF is transaction reference
        }
        else {
            // unknown response, check dohoneRes.message
        }
    }
    else {
        // Dohone error, check dohoneRes.message
    }
});

// ...
```

### 3.4. Make a &laquo; CRFMSMS &raquo; command
``` js
// ...

/**
 * transaction is a JSON object with following properties
 *   - customerPhoneNumber: string
 * params is a JSON object with following properties
 *   - code: string (Dohone authorization code)
 */
var transaction = {
    customerPhoneNumber: '699999999'
};
var params = {
    code: 'A123' // provided by user
};
dohoneSdk.confirmSMS(transaction, params, function (err, dohoneRes) {
    if (err) {
        // handle request error here
    }
    else if (dohoneRes.isSuccess) {
        if (dohoneRes.needCFRMSMS) {
            // invalid code, make a CFRMSMS command again
        }
        else if (dohoneRes.hasREF) {
            // successful transaction
            // dohoneRes.REF is transaction reference
        }
        else {
            // error, check dohoneRes.message
        }
    }
    else {
        // Dohone error, check dohoneRes.message
    }
});

// ...
``` 
> #### Bonus tip
> We have noticed that the **CFRMSMS** command often returns an empty answer,
> it is sometimes necessary to make several attempts before getting a good answer.
> For this, we have provided a fourth optional parameter to the confirmSMS() method that defines the maximum number of attempts to be made, its default value is 1.
> ``` js
> // for example, if you want to allow five attempts
> dohoneSdk.confirmSMS(transaction, params, callback, 5);
> ```

### 3.5. Make a &laquo; VERIFY &raquo; command
``` js
// ...

/**
 * transaction is a JSON object with following properties
 *   - ref: string (unique transaction reference in your system)
 *   - dohoneRef: string (Dohone transaction reference)
 *   - amount: number
 *   - currency: 'XAF', 'EUR' or 'USD'
 */
var transaction = {
    ref: '146eb9e4-fad1-4214-a8ed-9e5316ef2fad',
    dohoneRef: '123456789',
    amount: 1000,
    currency: 'XAF'
};
dohoneSdk.start(transaction, function (err, dohoneRes) {
    if (err) {
        // handle request error here
    }
    else if (dohoneRes.isSuccess) {
        // recognized transaction
    }
    else {
        // unknown transaction
    }
});

// ...
```

### 3.6. Handle Dohone's notifications
``` js
// ...

/**
 * data must contain request parameters sent by Dohone
 */
// For example, if you are using Express framework, then
var data = request.query;

// After that, map data using
data = dohoneSdk.mapNotificationData(data);

// Check request integrity using your hashCode
if (dohoneSdk.checkHash(data)) {
    dohoneSdk.verify(data, function (err, dohoneRes) {
        if (err){
            // handle request error here
        }
        if (dohoneRes.isSuccess) {
            // everything is OK, do what you want with data
        }
        else {
            // unrecognized transaction, you can ignore the request or do something else
        }
    });
}
else {
    // bad signature, you can ignore the request or do something else
}

// ...
```

## 4. Payout requests (refund customer or withdraw money)
Need this ? [Contact me][link-author], I will fill this content for FREE.
### 4.1. Create a DohonePayoutSDK object
You can find [DohonePayoutSDK class here][link-dohone-payout-sdk].
``` js


// ...
```
### 4.2. Make a &laquo; COTATION &raquo; command
``` js
// ...



// ...
```

### 4.3. Make a transfer
``` js
// ...



// ...
```

### 4.4. Handle Dohone's payout notifications
``` js
// ...



// ...
```

## Credits
- [mathermann][link-author]

[ico-version]: https://img.shields.io/npm/v/dohone-sdk
[ico-downloads]: https://img.shields.io/npm/dt/dohone-sdk

[link-npmjs]: https://www.npmjs.com/package/dohone-sdk

[link-author]: mailto:wkouogangkamdem@gmail.com

[link-dohone-sdk]: src/DohoneSDK.js
[link-dohone-payout-sdk]: src/DohonePayoutSDK.js

[link-dohone-doc-mobile]: https://www.my-dohone.com/dohone/site/modules/pagesExtra/api/1/tuto-api-mobile.pdf
[link-dohone-doc-web]: https://www.my-dohone.com/dohone/site/modules/pagesExtra/api/1/tuto-api-dohone.pdf
[link-dohone-doc-payout]: https://www.my-dohone.com/dohone/site/modules/pagesExtra/api/1/tuto-api-payout.pdf
