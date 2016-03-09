/**
 * distributed united-storage used as cache
 * 当收到消息，通知storage更新数据，当数据更新后，通知具体的module更新
 */

var RSVP = require('rsvp');
var Promise = RSVP.Promise;
var msgEvent = require('client/dashboard/cores/msg_event');

var instance = require('../modules/instance/cache');
var image = require('../modules/image/cache');
var port = require('../modules/port/cache');

function Storage() {
  var that = this;
  this.cache = [];
  msgEvent.on('message', function(data) {
    console.log('msg: ', data);
    that.getList([data.resource_type], true).then(function() {
      msgEvent.emit('dataChange', data);
    });

  });
}

Storage.prototype = {
  getList: function(typeList, forced) {
    var that = this,
      promises = {};

    typeList.forEach((type) => {
      if (!forced) {
        if (that.cache[type]) {
          promises[type] = new Promise(function(resolve, reject) {
            resolve(that.cache[type]);
          });
          return;
        }
      }

      promises[type] = that['get' + type[0].toUpperCase() + type.slice(1) + 'List']().then(function(data) {
        that.cache[type] = data;
        return data;
      });

    });

    return RSVP.hash(promises);
  }

};

Object.assign(Storage.prototype, instance, image, port);

module.exports = new Storage();
