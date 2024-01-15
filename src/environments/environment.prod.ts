import urlJoin from 'url-join';

export const environment = {
  production: true,
  coreServiceUrl: urlJoin(window.location.origin, window.location.pathname, 'core'),
  fileServiceUrl: urlJoin(window.location.origin, window.location.pathname, 'file'),
};
