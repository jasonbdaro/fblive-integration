/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
	publicRuntimeConfig: {
		APP_NAME: 'Dropbox Integration',
    API_URI: process.env.NEXT_PUBLIC_API_URI,
    APP_URL: process.env.APP_URL,
	},
	serverRuntimeConfig: {
		APP_NAME: 'Dropbox Integration',
    API_URI: process.env.NEXT_PUBLIC_API_URI,
    APP_URL: process.env.APP_URL,
	},
}

module.exports = nextConfig
