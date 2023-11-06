const withTM = require('next-transpile-modules')(['@usecapsule/web-sdk', '@usecapsule/user-management-client']);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true
}

module.exports = withTM(nextConfig);
