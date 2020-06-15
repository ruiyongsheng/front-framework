import IndexController from './IndexController';
const controllerInit = {
  getAllRouters(app,router) {
    app.use(router(_ => {
      _.get('/', IndexController.IndexAction())
    }))
  }
}
export default controllerInit;