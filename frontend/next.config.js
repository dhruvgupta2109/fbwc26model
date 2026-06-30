const { PHASE_DEVELOPMENT_SERVER } = require('next/constants');

function normalizeBasePath(path) {
  if (!path || path === '/') return '';
  return `/${path.replace(/^\/+|\/+$/g, '')}`;
}

function productionBasePath() {
  const configuredBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? process.env.BASE_PATH;
  if (configuredBasePath !== undefined) return normalizeBasePath(configuredBasePath);

  const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? '';
  if (process.env.GITHUB_ACTIONS === 'true' && repositoryName && !repositoryName.endsWith('.github.io')) {
    return `/${repositoryName}`;
  }

  return '';
}

/** @type {import('next').NextConfig} */
module.exports = (phase) => {
  const basePath = phase === PHASE_DEVELOPMENT_SERVER ? '' : productionBasePath();

  return {
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
};
