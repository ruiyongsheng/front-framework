const Koa = require('koa') // koa 2.x
const router = require('koa-simple-router')
import controllerInit from './controllers/ControllerInit';
import config from './config'
import log4js from "log4js";
import errorHander from './middlewares/errHandler';
import render from 'koa-swig';

const app = new Koa();
const serve = require('koa-static');
const co = require('co');

app.context.render = co.wrap(render({
  root: config.viewDir,
  autoescape: true,
  varControls:["[[","]]"],
  cache: 'memory', // disable, set to false
  ext: 'html',
}));

log4js.configure({
  appenders: { cheese: { type: "file", filename: "./logs/rys.log" } },
  categories: { default: { appenders: ["cheese"], level: "error" } }
});
// 处理错误的中心
const logger = log4js.getLogger("cheese");
errorHander.error(app,logger);
// 集中处理所有的路由
controllerInit.getAllRouters(app,router);
// 静态资源管理
app.use(serve(config.staticDir))

app.listen(config.port,() => {
  console.log(`app is listening on ${config.port}`)
})