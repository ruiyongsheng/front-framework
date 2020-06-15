### 创建 src 目录分前端目录和 node 端目录

大致目录划分有

```js
├── config
│   ├── htmlAfterWebpackPlugin.js
│   ├── webpack.development.js
│   └── webpack.production.js
├── gulpfile.js
├── package.json
├── postcss.config.js
├── src
│   ├── nodeuii
│   │   ├── app.js
│   │   ├── config
│   │   │   └── index.js
│   │   ├── controllers
│   │   │   ├── ControllerInit.js
│   │   │   └── IndexController.js
│   │   ├── middlewares
│   │   │   └── errHandler.js
│   │   ├── models
│   │   │   └── IndexModel.js
│   │   └── views
│   │       └── index.html
│   └── webapp
│       ├── views
│       │   ├── common
│       │   │   └── layout.html
│       │   └── index
│       │       ├── index-index.entry.js
│       │       └── pages
│       │           └── index.html
│       └── widgets
│           └── header
│               ├── header.html
│               ├── header.js
│               └── header.scss
├── webpack.config.js
└── yarn.lock
```

创建了项目主体后，开始创建自动化构建流程

## 自动化构建流程

工具： **gulp** **gulp-babel** **gulp-watch**

#### 1. npm init -y

#### 2.创建 gulpfile.js，编写自动化流程

```js
const gulp = require('gulp');
const babel = require('gulp-babel');   //  自动化编译es6到es5
const watch = require('gulp-watch');   //  gulp监听文件变化的
const rollup = require('gulp-rollup'); //  做文件清洗的，删除无用代码
const replace = require ('rollup-plugin-replace'); // 文件清洗时进行替换
const gulpSequence = require('gulp-sequence')  //  gulp task 执行顺序
<!--development环境的构建任务,将es6编译成es5,-->
gulp.task('buildenv', function () {
  return watch('./src/nodeuii/**/*.js',
  {
    ignoreInitial: false // 需在第一次文件修改之前执行，也就是调用 watch() 之后立即执行
  }, () => {
    gulp.src('./src/nodeuii/**/*.js')
      .pipe(babel({
        babelrc: false, // 忽略根目录下边的.babelrc文件
        "plugins": [
          [
            "transform-decorators-legacy",
            "transform-es2015-modules-commonjs", {
            "allowTopLevelThis": true
          }]
        ]
    }))
    .pipe(gulp.dest('dist')); // 输出到dist文件夹
  })
});
<!-- production环境的构建任务,将es6编译成es5 -->
gulp.task('buildprod', function () {
  gulp.src('./src/nodeuii/**/*.js')
    .pipe(babel({
      ignore: ['./src/nodeuii/config/*.js'],
      babelrc: false,
      "plugins": [
        ["transform-decorators-legacy",
        "transform-es2015-modules-commonjs", {
          "allowTopLevelThis": true
        }]
      ]
    }))
    .pipe(gulp.dest('dist'));
});
// 开启清洗流，Tree-shaking
gulp.task('buildconfig',  () => {
  gulp.src('./src/nodeuii/**/*.js')
    .pipe(rollup({
      output:{
        format: 'cjs',  // 文件以commonjs的格式输出
      },
      input: './src/nodeuii/config/index.js', // 对指定文件进行rollup
      plugins: [
        replace({
          'process.env.NODE_ENV': JSON.stringify('production') // 通过rollup-plugin-replace插件去替换到文件中的变量 比如
        })
      ]
    }))
    .pipe(gulp.dest('./dist'));
});
let _task = ['buildenv'];
if (process.env.NODE_ENV == 'production') {
  _task = gulpSequence(['buildprod','buildconfig']);
}

gulp.task('default', _task);
```

### Tree-shaking

代码流的清洗
工具： **gulp-rollup** **rollup-plugin-replace** **gulp-sequence**
线上所需肯定需要最简洁的代码，我们用 gulp-rollup 让文件最小化

app.js 文件中的

```
const init = () => {
  if (process.env.NODE_ENV == 'development') {
    const developConfig = {
      port: 8081
    }
    config = _.extend(config, developConfig);
  }
  if (process.env.NODE_ENV == 'production') {
    const prodConfig = {
      port: 8081
    }
    config = _.extend(config, prodConfig);
  }
  return config;
}

export default init();
```

在线上环境就会被清洗成

```
const init = () => {
  {
    const prodConfig = {
      port: 8081
    };
    config = _.extend(config, prodConfig);
  }
  return config;
};

var index = init();

module.exports = index;
```

仔细对照两块代码就会发现，清洗完成之后，就只会留下**生产环境**所需的代码，精简了代码；

### 3. 编写主入口文件 app.js

node 端采用 **koa2 + koa-simple-router + koa-swig + log4js**

```js
import Koa from 'koa' // koa 2.x
import router from 'koa-simple-router'
import render from 'koa-swig';
import log4js from "log4js";
import controllerInit from './controllers/ControllerInit';
import config from './config'
import errorHander from './middlewares/errHandler';

const app = new Koa();
<!--   Koa静态文件指定中间件Koa-static  -->
const serve = require('koa-static');
<!--   co模块能够将异步以同步形式操作  -->
const co = require('co');
<!--  处理view层的文件   -->
app.context.render = co.wrap(render({
  root: config.viewDir,
  autoescape: true,
  varControls:["[[","]]"], // 设置以 [[]] 的形式去读取变量，理同 Vue的 {{ }}
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
```

注释：

```
koa：面向node.js的表现型HTTP中间件框架，使Web应用程序和API更加令人愉快地编写
koa-static：Koa静态文件指定中间件Koa-static
co：基于生成器的nodejs和浏览器的控制流程良好性，使用promises，可以让您以非常好的方式编写非阻塞代码
koa-swig: 基于Swig的Koa视图渲染，支持标签，过滤器和扩展。
koa 2x 在使用koa-swig渲染页面时，搭配co模块使用
log4js：日志管理
cross-env: 设置环境变量
```

### swig 的介绍: swig 是 JS 模板引擎

使用 **extends** 和 **block** 来实现模板继承 layout.html

1.  layout.html 算是公共页面主体

```
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{% block title %}{% endblock  %}</title>
    {% block head %}{% endblock  %}
</head>
<body>
    {% block content %}{% endblock  %}
</body>
</html>
```

2. index.html
   include 模板 包含一个模板到当前位置，这个模板将使用当前上下文

```html
{% extends '../common/layout.html' %} {% block title %} 首页 {% endblock %} {%
block content %} {% include "../../widgets/header/header.html" %} {% endblock %}
```

node 端测试完成之后，开始编写前端自动化构建

### 4. 编写 webpack.config.js

```js
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
```

### 5. 编写 webpack.development.js(开发环境)

```js
const CopyWebpackPlugin = require('copy-webpack-plugin')
const path = require('path')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
module.exports = {
  plugins: [
    //views 里面的layout.html
    new CopyWebpackPlugin([
      {
        from: path.join(__dirname, '../src/webapp/views/common/layout.html'),
        to: '../views/common/layout.html'
      }
    ]),
    new CopyWebpackPlugin(
      [
        {
          from: path.join(__dirname, '../src/webapp/widgets/'),
          to: '../widgets'
        }
      ],
      {
        copyUnmodified: true,
        ignore: ['*.js', '*.css']
      }
    ),
    new MiniCssExtractPlugin({
      filename: 'styles/[name].css'
    })
  ]
}
```

### 6. 编写 webpack.production.js (生产环境)

```js
const CopyWebpackPlugin = require('copy-webpack-plugin')
const minify = require('html-minifier').minify
const path = require('path')
module.exports = {
  output: {
    filename: 'scripts/[name].[hash:5].bundle.js'
  },
  plugins: [
    //views 里面的layout.html
    new CopyWebpackPlugin([
      {
        from: path.join(
          __dirname,
          '../' + 'src/webapp/views/common/layout.html'
        ),
        to: '../views/common/layout.html',
        transform (content, path) {
          return minify(content.toString('utf-8'), {
            collapseWhitespace: true
          })
        }
      }
    ]),
    new CopyWebpackPlugin(
      [
        {
          from: path.join(__dirname, '../' + 'src/webapp/widgets/'),
          to: '../widgets',
          transform (content, path) {
            return minify(content.toString('utf-8'), {
              collapseWhitespace: true
            })
          }
        }
      ],
      {
        copyUnmodified: true,
        ignore: ['*.js', '*.css']
      }
    )
  ]
}
```

### 7. 编写自定义 webpack-plugin => htmlAfterWebpackPlugin.js（对打包后的文件进行处理）

```js
const pluginName = 'htmlAfterWebpackPlugin'
const assetsHelp = data => {
  let css = [],
    js = []
  const dir = {
    js: item => `<script src="${item}"></script>`,
    css: item => `<link rel="stylesheet" href="${item}"/>`
  }
  for (let jsitem of data.js) {
    js.push(dir.js(jsitem))
  }
  for (let cssitem of data.css) {
    css.push(dir.css(cssitem))
  }
  return {
    css,
    js
  }
}
<!--查看 html-webpack-plugin v3的文档，v4文档对应不同的hooks -->
class htmlAfterWebpackPlugin {
  apply (compiler) {
    compiler.hooks.compilation.tap(pluginName, compilation => {
      compilation.hooks.htmlWebpackPluginBeforeHtmlProcessing.tap(
        pluginName,
        htmlPluginData => {
          let _html = htmlPluginData.html
          const result = assetsHelp(htmlPluginData.assets)
          console.log(result)
          //使用cheerio vue ssr,根据自己的模版设置插入不同的位置
          _html = _html.replace('<!--injectcss-->', result.css.join(''))
          _html = _html.replace('<!--injectjs-->', result.js.join(''))
          htmlPluginData.html = _html
        }
      )
    })
  }
}
module.exports = htmlAfterWebpackPlugin
```

### 8. 打包项目，运行

```
yarn client:dev
yarn start:dev
```

访问: **http://localhost:8081**

![](https://user-gold-cdn.xitu.io/2020/6/15/172b805314ef8273?w=1496&h=436&f=png&s=74632)

### 注释：

```
yargs-parser: Yargs通过解析参数和生成优雅的用户界面来帮助您构建交互式命令行工具

package.json:
    "scripts": {
        "start:dev": "cross-env NODE_ENV=development supervisor ./dist/app.js",
        "build:dev": "gulp",
        "build:prod": "cross-env NODE_ENV=production gulp",
        "docs": "jsdoc ./src/nodeuii/**/*.js -d ./docs/jsdocs",
        "client:dev": "webpack --mode development",
        "client:prod": "webpack --mode production"
      },

webpack.config.js:
    var argv = require('yargs-parser')(process.argv.slice(2));
    console.log(argv.mode)   // development or production

webpack-merge: 合并对象
    很多时候，我们都需要针对不同的环境进行不用的操作。
    webpack.common.js  // 不管是生产环境还是开发环境都会用到的公用部分
    webpack.product.js  //  生产环境所需代码
    webpack.dev.js   //  开发环境所需代码
    glob: 通过星号等 shell 所用的模式匹配文件。
        var glob = require("glob")；
        // options 可选
        glob("**/*.js", options, function (er, files) {
          // files 是一个文件名数组。
          // 如果设置了选项 `nonull` 并且没有找到匹配，则 files 是 ["**/*.js"]
          // er 是一个错误对象或 null。
        })
```

对于多文件，重复文件配置
得实现自动获取到需要配置的文件，并且在一个循环里面调用;
eg: 使用 glob 模块来获取文件

```js
// 引入glob
var glob = require('glob')
// 同步读取src目录下所有的html文件
var files = glob.sync('./src/*.html')
var entry = {}
var plugins = []
//循环将文件
files.forEach(function (item, i) {
  //item类似：./src/index.html
  var htmlName = item.slice(item.lastIndexOf('/') + 1)
  //最后生成的文件名只需要最后面的名字index.html
  var name = htmlName.split('.')[0]
  //添加到entry入口，并指定生成文件的目录
  entry['page/' + name + '/' + name] = './src/js/' + name + '.js'
  //生成htmlWebpackPlugin实例
  plugins.push(
    new htmlWebpackPlugin({
      template: item,
      filename: htmlName,
      chunks: ['page/' + name + '/' + name]
    })
  )
})

module.exports = {
  entry: entry,
  output: {
    filename: '[name].[chunkhash].js',
    path: path.resolve(__dirname, 'dist')
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader'
        }
      }
    ]
  },
  plugins: plugins
}
//  使用glob.sync来读取文件并进行循环操作，原本需要手动操作的部分，循环已经帮我们处理好了。
```

#### 生成 jsdocs

```
"docs": "jsdoc ./src/nodeuii/**/*.js -d   ./docs/jsdocs"
```

#### 源码地址链接：

[初探前端架构](https://github.com/ruiyongsheng/front-framework)

参考文档：

1. [lodash 中文文档](https://www.lodashjs.com/)；
   Lodash 是一个一致性、模块化、高性能的 JavaScript 实用工具库。
2. [jsdoc 介绍](https://github.com/jsdoc/jsdoc)
   JSDoc 是一个根据 javascript 文件中注释信息，生成 JavaScript 应用程序或库、模块的 API 文档 的工具
3. [cross-env 介绍](https://blog.csdn.net/qq_26927285/article/details/78105510) 运行跨平台设置和使用环境变量的脚本
4. [rollup 模块打包](https://www.cnblogs.com/vajoy/p/5518442.html)；实现代码的清洗
5. [rollup 中文文档](http://www.tensweets.com/article/5bf0ed1733ee9a05197f0bbf)
6. [co 源码分析](http://zhangxiang958.github.io/2018/02/25/co%20%E6%BA%90%E7%A0%81%E5%89%96%E6%9E%90/)
7. [log4js 完全讲解](https://juejin.im/post/57b962af7db2a200542a0fb3)
8. [yargs-parser](https://www.npmjs.com/package/yargs-parser)
9. [webpack-merge 的使用](https://www.cnblogs.com/zhengrunlin/p/7575118.html)
10. [Node glob 语法](https://github.com/isLishude/blog/issues/63)
11. [copy-webpack-plugin](https://www.npmjs.com/package/copy-webpack-plugin)
12. [html-webpack-plugin 详解](https://www.cnblogs.com/wonyun/p/6030090.html)
13. [extract-text-webpack-plugin](https://www.npmjs.com/package/extract-text-webpack-plugin)
14. [html-minifier](https://www.npmjs.com/package/html-minifier)；
