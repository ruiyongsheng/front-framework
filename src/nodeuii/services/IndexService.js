/**
 * @fileoverview 实现IndexModel数据模型
 * @anthors rys@rys.com
 */
 /**
  * indexModel 类，生成一段异步数据
 @class
  */
export default class IndexModel {
  /**
  @constructor
  @param {string} app

  */
  constructor(app) {

  }
  /**
    @returns {promise} 返回异步的处理结果
  */
  getData() {
    return new Promise((resolve,reject) => {
      setTimeout(function () {
        resolve('hello rys');
      },1000)
    })
  }
}