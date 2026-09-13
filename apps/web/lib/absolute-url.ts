// Better Auth resolves a relative `callbackURL` against its own baseURL, which is the
// backend — so any URL handed to authClient has to be absolute to reach this site.
export const toAbsoluteUrl = (path: string): string =>
  new URL(path, process.env.NEXT_PUBLIC_SITE_URL).toString();

// `callbackUrl` comes from the query string, so anything pointing off this host is
// dropped — otherwise it is an open redirect once `router.push` runs it.
export const toSafeCallbackUrl = (path: string): string => {
  const site = new URL(process.env.NEXT_PUBLIC_SITE_URL as string);
  const target = new URL(path, site);

  if (target.hostname !== site.hostname) return '/';

  return `${target.pathname}${target.search}${target.hash}`;
};
