var webpack = require('webpack')

const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
  entry: __dirname + '/main.js',
  output: {
    filename: 'bundle.js',
	path: __dirname + '/dist',
	publicPath: '/ecir2019/'
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
    }),
	new HtmlWebpackPlugin({
		template: __dirname + '/index.html',
		filename: './index.html',
		hash: true /* cache busting */
	})
  ]
}
