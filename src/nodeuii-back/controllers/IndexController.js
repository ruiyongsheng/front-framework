import IndexModel from '../models/IndexModel'
const indexController = {
  IndexAction () {
    return async (ctx, next) => {
      const indexModel = new IndexModel();
      const res = await indexModel.getData();
      ctx.body = await ctx.render('index/pages/index', {
        data: res
      });
    }
  }
}

export default indexController;