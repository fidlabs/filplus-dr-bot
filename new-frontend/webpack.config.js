const webpack = require('webpack');
// const NodePolyfillPlugin = require("node-polyfill-webpack-plugin")
const stdLibBrowser = require('node-stdlib-browser');
const {
    NodeProtocolUrlPlugin
} = require('node-stdlib-browser/helpers/webpack/plugin');

module.exports = function (webpackEnv) {
    return {
        context: __dirname,
        entry: './src/index.tsx',
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    use: {
                        loader: 'babel-loader',
                        options: {
                            presets: ['@babel/preset-env','@babel/react'],
                            plugins: ['@babel/proposal-class-properties', '@babel/plugin-proposal-object-rest-spread', '@babel/plugin-syntax-dynamic-import']
                        }
                    },
                    exclude: /node_modules/,
                },
            ],
        },
        resolve: {
            extensions: ['.tsx', '.ts', '.js'],
            alias: stdLibBrowser,
            fallback: {
                "assert": require.resolve("assert"),
                "stream": require.resolve("stream"),
                "buffer": require.resolve('buffer/'),
            }
        },
        plugins: [
            new NodeProtocolUrlPlugin(),
            new webpack.ProvidePlugin({
                process: stdLibBrowser.process,
                Buffer: [stdLibBrowser.buffer, 'Buffer']
            })
        ],
    }
}