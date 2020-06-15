import Koa from 'koa' // koa 2.x
import config from './config'
import log4js from "log4js";
import errorHander from './middlewares/errHandler';
import render from 'koa-swig';

const app = new Koa();
const serve = require('koa-static');
const co = require('co');

import { asClass, createContainer } from 'awilix'
import { loadControllers, scopePerRequest } from 'awilix-koa'
// ioc控制反转的容器
const container = createContainer()
app.use(scopePerRequest(container))
// The `TodosService` lives in services/TodosService
// 装载所有的services到controller  完成利用切面的注入
container.loadModules([__dirname + 'services/*.js'], {
  // we want `TodosService` to be registered as `todosService`.
  formatName: 'camelCase',
  resolverOptions: {
    // We want instances to be scoped to the Koa request.
    // We need to set that up.
    lifetime: Lifetime.SCOPED
  }
})

app.context.render = co.wrap(render({
  root: config.viewDir,
  autoescape: true,
  cache: 'memory', // disable, set to false
  varControls:["[[","]]"],
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
app.use(loadControllers(__dirname + 'controllers/*.js', { cwd: __dirname }))
// 静态资源管理
app.use(serve(config.staticDir))

app.listen(config.port,() => {
  console.log(`app is listening on ${config.port}`)
})