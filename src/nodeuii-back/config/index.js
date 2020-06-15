const _  = require('lodash');
const {join} = require('path');

let config = {
  viewDir: join(__dirname, '..', 'views'),
  staticDir: join(__dirname, '..','/assets'),
}

const init = () => {
  if (process.env.NODE_ENV == 'development') {
    const localConfig = {
      port: 8081
    }
    config = _.extend(config,localConfig);
  }
  if (process.env.NODE_ENV == 'production') {
    const proConfig = {
      port: 8081
    }
    config = _.extend(config, proConfig);
  }
  return config;
}

export default init();