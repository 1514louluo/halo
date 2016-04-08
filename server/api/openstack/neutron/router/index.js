'use strict';

var async = require('async');
var Base = require('../../base.js');

function Router (app, neutron) {
  this.app = app;
  this.arrService = ['neutron'];
  this.arrServiceObject = ['floatingips', 'subnets', 'ports'];
  Base.call(this, this.arrService, this.arrServiceObject);
}

Router.prototype = {
  makeRouter: function (router, obj) {
    router.floatingip = {}; // customized floatingip.
    obj.floatingips.some(function (fip) {
      obj.ports.some(function (port) {
        if (port.id === fip.port_id && port.device_owner === 'network:router_gateway' && port.device_id === router.id) {
          router.floatingip = fip;
          return true;
        } else {
          return false;
        }
      });
      // return fip.router_id === router.id && (router.floatingip = fip);
    });
    router.subnets = [];
    obj.ports.forEach(function (port) {
      if (port.device_id === router.id && port.device_owner === 'network:router_interface') {
        obj.subnets.forEach(function (subnet) {
          if (subnet.ip_version === 4 && subnet.id === port.fixed_ips[0].subnet_id) {
            router.subnets.push(subnet);
          }
        });
      }
    });
  },
  getRouterList: function (req, res, next) {
    this.token = req.session.user.token;
    this.region = req.headers.region;
    async.parallel(
      [this.__routers.bind(this)].concat(this.arrAsync),
      (err, results) => {
        if (err) {
          this.handleError(err, req, res, next);
        } else {
          var obj = {};
          ['routers'].concat(this.arrServiceObject).forEach( (e, index) => {
            obj[e] = results[index][e];
          });
          this.orderByCreatedTime(obj.routers);
          obj.routers.forEach( (router) => {
            this.makeRouter(router, obj);
          });
          res.json({routers: obj.routers});
        }
      }
    );
  },
  getRouterDetails: function (req, res, next) {
    this.routerId = req.params.routerId;
    this.region = req.headers.region;
    this.token = req.session.user.token;
    async.parallel(
      [this.__routerDetail.bind(this)].concat(this.arrAsync),
      (err, results) => {
        if (err) {
          this.handleError(err, req, res, next);
        } else {
          var obj = {};
          ['router'].concat(this.arrServiceObject).forEach( (e, index) => {
            obj[e] = results[index][e];
          });
          this.makeRouter(obj.router, obj);
          res.json({routers: obj.router});
        }
      }
    );
  },
  initRoutes: function () {
    return this.__initRoutes( () => {
      this.app.get('/api/v1/routers', this.getRouterList.bind(this));
      this.app.get('/api/v1/routers/:routerId', this.getRouterDetails.bind(this));
    });
  }
};
module.exports = function (app, extension) {
  Object.assign(Router.prototype, Base.prototype);
  if (extension) {
    Object.assign(Router.prototype, extension);
  }
  var instance = new Router(app);
  instance.initRoutes();
};