const CopyWebpackPlugin = require('copy-webpack-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
// const TerserPlugin = require('terser-webpack-plugin');

module.exports = {

	mode: 'development',
	entry: './src/lambda.js',
	output: {
		filename: 'index.js',
		libraryTarget: "commonjs",
	},

	target: 'node',
	externals: [
		'aws-sdk',
	],
	// module: {
	// 	rules: [
	// 		{
	// 			test: /\.ts?$/,
	// 			loader: "ts-loader"
	// 		}
	// 	]
	// },
	resolve: {
		extensions: ['.js']
	},
	plugins: [
		new CopyWebpackPlugin({
			patterns: [
				{ from: 'template.yaml' },
                { from: 'src/.env' },
			]
		}),
		new CleanWebpackPlugin(),
	],
	optimization: {
		minimize: false,
	}
};