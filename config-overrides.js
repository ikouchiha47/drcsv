const path = require('path');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');

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

	config.resolve.alias = {
		...config.resolve.alias,
		'mathjs': path.resolve(__dirname, 'node_modules/mathjs/lib/browser/math.js'),
		'fraction.js': path.resolve(__dirname, 'node_modules/fraction.js/fraction.js'),
	};

	return config;
};
