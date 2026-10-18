/*
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
};

export default nextConfig;
*/
/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: [
    '10.37.163.48',           // Senin bilgisayarının IP'si
    '*.10.37.163.48',         // Gerekirse wildcard (çoğu durumda gerekmez)
    'localhost',
    '127.0.0.1',
    'nonexpansile-agrologic-rossana.ngrok-free.dev'
  ],
};

module.exports = nextConfig;