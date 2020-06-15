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
