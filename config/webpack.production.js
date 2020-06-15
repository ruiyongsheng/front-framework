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
