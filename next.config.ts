import type { NextConfig } from "next";

const isGitHubPages = process.env.GITHUB_ACTIONS === "true";
const repositoryName = "fourquarters";

const nextConfig: NextConfig = {
  output: "export",
  // Ensure assets and routes resolve correctly on GitHub Pages
  basePath: isGitHubPages ? `/${repositoryName}` : undefined,
  assetPrefix: isGitHubPages ? `/${repositoryName}/` : undefined,
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
