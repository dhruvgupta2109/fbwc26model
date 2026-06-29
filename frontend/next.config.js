const configuredBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? process.env.BASE_PATH;
const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? '';
const githubPagesBasePath =
  process.env.GITHUB_ACTIONS === 'true' && repositoryName && !repositoryName.endsWith('.github.io') ? `/${repositoryName}` : '';
const basePath = normalizeBasePath(configuredBasePath ?? githubPagesBasePath);

function normalizeBasePath(path) {
  if (!path || path === '/') return '';
  return `/${path.replace(/^\/+|\/+$/g, '')}`;
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath
  },
  images: {
    unoptimized: true
  },
  trailingSlash: true
};

module.exports = nextConfig;
