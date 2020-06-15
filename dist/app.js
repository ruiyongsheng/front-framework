"use strict";

var _ControllerInit = require("./controllers/ControllerInit");

var _ControllerInit2 = _interopRequireDefault(_ControllerInit);

var _config = require("./config");

var _config2 = _interopRequireDefault(_config);

var _log4js = require("log4js");

var _log4js2 = _interopRequireDefault(_log4js);

var _errHandler = require("./middlewares/errHandler");

var _errHandler2 = _interopRequireDefault(_errHandler);

var _koaSwig = require("koa-swig");

var _koaSwig2 = _interopRequireDefault(_koaSwig);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const Koa = require('koa'); // koa 2.x


const router = require('koa-simple-router');

const app = new Koa();

const serve = require('koa-static');

const co = require('co');

app.context.render = co.wrap((0, _koaSwig2.default)({
  root: _config2.default.viewDir,
  autoescape: true,
  cache: 'memory',
  // disable, set to false
  varControls: ["[[", "]]"],
  ext: 'html'
}));

_log4js2.default.configure({
  appenders: {
    cheese: {
      type: "file",
      filename: "./logs/rys.log"
    }
  },
  categories: {
    default: {
      appenders: ["cheese"],
      level: "error"
    }
  }
}); // 处理错误的中心


const logger = _log4js2.default.getLogger("cheese");

_errHandler2.default.error(app, logger); // 集中处理所有的路由


_ControllerInit2.default.getAllRouters(app, router); // 静态资源管理


app.use(serve(_config2.default.staticDir));
app.listen(_config2.default.port, () => {
  console.log(`app is listening on ${_config2.default.port}`);
});