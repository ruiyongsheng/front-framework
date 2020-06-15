"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _IndexModel = require("../models/IndexModel");

var _IndexModel2 = _interopRequireDefault(_IndexModel);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const indexController = {
  IndexAction() {
    return async (ctx, next) => {
      const indexModel = new _IndexModel2.default();
      const res = await indexModel.getData();
      ctx.body = await ctx.render('index/pages/index', {
        data: res
      });
    };
  }

};
exports.default = indexController;