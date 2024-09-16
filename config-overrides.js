const path = require('path');

module.exports = function override(config, env) {
	// Add custom Webpack configurations here

	config.resolve.alias = {
		...config.resolve.alias,
		'mathjs': path.resolve(__dirname, 'node_modules/mathjs/lib/browser/math.js'),
		'fraction.js': path.resolve(__dirname, 'node_modules/fraction.js/fraction.js'),
	};

	return config;
};
