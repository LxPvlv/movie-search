const path = require('path')
const HTMLWebpackPlugin = require('html-webpack-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const TerserJSPlugin = require('terser-webpack-plugin')
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin')
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')

module.exports = (env, argv) => {
  const isDev = argv.mode === 'development'
  const isProd = !isDev

  const optimization = () => {
    const config = {
      splitChunks: {
        chunks: 'all',
      },
    }

    if (isProd) {
      config.minimizer = [
        new TerserJSPlugin({}),
        new OptimizeCSSAssetsPlugin({}),
      ]
    }

    return config
  }

  const filename = ext => (isDev ? `[name].${ext}` : `[name].[hash].${ext}`)

  const jsLoaders = () => {
    const loaders = [
      {
        loader: 'babel-loader',
        options: {
          presets: [
            [
              '@babel/preset-env',
              {
                corejs: '3',
                useBuiltIns: 'usage',
              },
            ],
          ],
          plugins: [
            ['@babel/plugin-proposal-class-properties', { loose: true }],
          ],
        },
      },
    ]

    if (isDev) loaders.push('eslint-loader')

    return loaders
  }

  const plugins = () => {
    const base = [
      new HTMLWebpackPlugin({
        template: './index.html',
        minify: {
          collapseWhitespace: isProd,
        },
      }),
      new CleanWebpackPlugin(),
      new CopyWebpackPlugin([
        {
          from: path.resolve(__dirname, './src/favicon.ico'),
          to: path.resolve(__dirname, 'dist'),
        },
        {
          from: path.resolve(__dirname, './src/assets'),
          to: path.resolve(__dirname, 'dist/assets'),
        },
      ]),
      new MiniCssExtractPlugin({
        filename: filename('css'),
      }),
    ]

    if (process.env.WEBPACK_BUNDLE_ANALYZE === 'analyze') {
      base.push(new BundleAnalyzerPlugin())
    }

    return base
  }

  return {
    context: path.resolve(__dirname, 'src'),
    mode: 'development',
    entry: {
      main: './index.js',
    },
    output: {
      filename: filename('js'),
      path: path.resolve(__dirname, 'dist'),
    },
    optimization: optimization(),
    devServer: {
      port: 5000,
      hot: isDev,
    },
    devtool: isDev ? 'source-map' : '',
    plugins: plugins(),
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: jsLoaders(),
        },
        {
          test: /\.s[ac]ss$/,
          use: [
            {
              loader: MiniCssExtractPlugin.loader,
              options: {
                hmr: isDev,
                reloadAll: true,
              },
            },
            'css-loader',
            'sass-loader',
          ],
        },
        {
          test: /\.(png|jpg|svg|gif)$/,
          use: [{ loader: 'file-loader' }],
        },
        {
          test: /\.(ttf|woff|woff2|eot)$/,
          use: ['file-loader'],
        },
      ],
    },
  }
}
