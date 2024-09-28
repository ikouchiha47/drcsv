const path = require('path');

const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = function override(config, env) {
	// Add custom Webpack configurations here
	// config.resolve.fallback = {
	// 	...config.resolve.fallback,
	// 	fs: require.resolve('browserify-fs'),
	// 	path: require.resolve('path-browserify'),
	// 	crypto: require.resolve('crypto-browserify'),
	// 	stream: require.resolve("stream-browserify"),
	// 	buffer: require.resolve('buffer/'),
	// 	util: require.resolve('util/'),
	// };

	config.plugins = [
		...config.plugins,
		new NodePolyfillPlugin(),
	];

	config.plugins = config.plugins.filter(
		plugin => !(plugin instanceof HtmlWebpackPlugin)
	);

	// Add HtmlWebpackPlugin instances for multiple HTML pages
	config.plugins.push(
		new HtmlWebpackPlugin({
			inject: true,
			template: path.resolve(__dirname, 'public/index.html'),
			filename: 'index.html',
			chunks: ['main'],  // Entry for index.html
		}),
		new HtmlWebpackPlugin({
			inject: true,
			template: path.resolve(__dirname, 'public/faq.html'),
			filename: 'faq.html',
			chunks: ['faq'],  // Entry for faq.html
		})
	);

	config.entry = {
		main: path.resolve(__dirname, 'src/index.js'),  // Entry for index.html
		faq: path.resolve(__dirname, 'src/index.faq.js'),     // Entry for faq.html
	};
	config.output = {
		path: path.resolve(__dirname, 'build'),
		filename: 'static/js/[name].bundle.js',  // Create separate bundles for each entry point
	};

	config.resolve.alias = {
		...config.resolve.alias,
		'mathjs': path.resolve(__dirname, 'node_modules/mathjs/lib/browser/math.js'),
		'fraction.js': path.resolve(__dirname, 'node_modules/fraction.js/fraction.js'),
	};

	return config;
};
