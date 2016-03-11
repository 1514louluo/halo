var storage = require('client/dashboard/cores/storage');

module.exports = {
  getList: function(cb, forced) {
    return storage.getList(['image'], forced).then(function(data) {
      cb(data.image);
    });
  }

};
