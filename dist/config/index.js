'use strict';

const _  = require('lodash');
const {join} = require('path');

let config = {
  viewDir: join(__dirname, '..', 'views'),
  staticDir: join(__dirname, '..','/assets'),
};

const init = () => {
  {
    const proConfig = {
      port: 8081
    };
    config = _.extend(config, proConfig);
  }
  return config;
};

var index = init();

module.exports = index;
