var webpack = require('webpack')

module.exports = {
  entry: __dirname + '/main.js',
  output: {
    filename: 'bundle.js'
  },
  module: {
    rules: [
        { test: /\.vue$/, use: 'vue-loader' }
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: '"production"'
      }
    })
  ]
}
