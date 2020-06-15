const argv = require('yargs-parser')(process.argv.slice(2))
const merge = require('webpack-merge')
const glob = require('glob')
const files = glob.sync('./src/webapp/views/**/*.entry.js')

const _mode = argv.mode || 'development'
const _modeflag = _mode === 'production'
const _mergeConfig = require(`./config/webpack.${_mode}.js`)

const { join } = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const htmlAfterWebpackPlugin = require('./config/htmlAfterWebpackPlugin.js')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const CleanWebpackPlugin = require('clean-webpack-plugin')

let _entry = {} //webpack公用的入口
let _plugins = [] //webpack公用插件
for (let item of files) {
  //index-index.entry.js   -> index.index.js
  if (/.+\/([a-zA-Z]+-[a-zA-Z]+)(\.entry\.js$)/g.test(item)) {
    const entrykey = RegExp.$1
    // console.log(entrykey);
    _entry[entrykey] = item
    //dist外层文件夹名字 template内部html名字
    const [dist, template] = entrykey.split('-')
    _plugins.push(
      new HtmlWebpackPlugin({
        filename: `../views/${dist}/pages/${template}.html`,
        template: `src/webapp/views/${dist}/pages/${template}.html`,
        minify: {
          collapseWhitespace: _modeflag,
          removeAttributeQuotes: _modeflag
        },
        inject: false
      })
    )
  }
}
let webpackConfig = {
  entry: _entry,
  output: {
    path: join(__dirname, './dist/assets'),
    publicPath: '/',
    filename: 'scripts/[name].boudle.js'
  },
  module: {
    rules: [
      {
        test: /\.(sa|sc|c)ss$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          'postcss-loader',
          'sass-loader'
        ]
      }
    ]
  },
  watch: !_modeflag,
  watchOptions: {
    ignored: /node_modules/,
    aggregateTimeout: 300,
    poll: 1
  },
  optimization: {
    splitChunks: {
      chunks: 'async',
      minSize: 30000,
      maxSize: 0,
      minChunks: 1,
      maxAsyncRequests: 6,
      maxInitialRequests: 4,
      automaticNameDelimiter: '~',
      cacheGroups: {
        commons: {
          chunks: 'initial',
          minChunks: 2,
          minSize: 0,
          name: 'conmons'
        }
      }
    },
    runtimeChunk: {
      name: 'runtime'
    }
  },
  plugins: [
    ..._plugins,
    new CleanWebpackPlugin({}),
    new MiniCssExtractPlugin({
      filename: 'styles/[name].[hash:5].css'
    }),
    new htmlAfterWebpackPlugin({ options: '' })
  ]
}
module.exports = merge(webpackConfig, _mergeConfig)
