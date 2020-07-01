const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = [
  {
    mode: 'production',
    entry: './src/electron.ts',
    target: 'electron-main',
    module: {
      rules: [{
        test: /\.ts$/,
        include: /src/,
        resolve: {
          extensions: ['.ts', '.js']
        },
        use: [{ loader: 'ts-loader' }]
      }]
    },
    output: {
      devtoolModuleFilenameTemplate: '[absolute-resource-path]',
      path: __dirname + '/dist',
      filename: 'electron.js'
    }
  },
  {
    mode: 'production',
    entry: './src/preload.ts',
    target: 'electron-preload',
    module: {
      rules: [{
        test: /\.ts$/,
        include: /src/,
        resolve: {
          extensions: ['.ts', '.js']
        },
        use: [{ loader: 'ts-loader' }]
      }]
    },
    output: {
      path: __dirname + '/dist',
      filename: 'preload.js'
    }
  },
  {
    mode: 'production',
    entry: './src/index.tsx',
    target: 'web',
    devtool: 'source-map',
    performance: {
      hints: false
    },
    module: {
      rules: [{
        test: /\.ts(x?)$/,
        include: /src/,
        resolve: {
          extensions: ['.ts', '.tsx', '.js']
        },
        use: [{ loader: 'ts-loader' }]
      }]
    },
    output: {
      path: __dirname + '/dist',
      filename: 'index.js'
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './src/index.html'
      })
    ]
  }
];