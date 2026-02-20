import nextConfig from "eslint-config-next";

const config = [
  ...nextConfig,
  {
    ignores: ["dev/slackhog/**"],
  },
];

export default config;
