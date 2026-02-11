const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '.env');
const env = {};
if (fs.existsSync(envPath)) {
	fs.readFileSync(envPath, 'utf8')
		.split('\n')
		.filter((line) => line.trim() && !line.startsWith('#'))
		.forEach((line) => {
			const [key, ...rest] = line.split('=');
			env[key.trim()] = rest
				.join('=')
				.trim()
				.replace(/^["']|["']$/g, '');
		});
}

module.exports = {
	apps: [
		{
			name: 'napco-v2',
			script: 'build/index.js',
			env: {
				PORT: 4002,
				HOST: '0.0.0.0',
				BODY_SIZE_LIMIT: '50M',
				...env
			}
		}
	]
};
