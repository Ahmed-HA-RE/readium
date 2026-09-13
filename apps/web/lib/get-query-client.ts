import {
  defaultShouldDehydrateQuery,
  isServer,
  QueryClient,
} from '@tanstack/react-query';

const makeQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        // A non-zero staleTime stops the client refetching everything the
        // server just prefetched the moment it hydrates.
        staleTime: 60 * 1000,
      },
      dehydrate: {
        // Pending queries are dehydrated too, so a prefetch that is still in
        // flight streams to the client instead of being dropped.
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) || query.state.status === 'pending',
      },
    },
  });

let browserQueryClient: QueryClient | undefined;

/**
 * The server gets a fresh client per request so no cache is shared between
 * users; the browser reuses one so a re-render during suspense does not throw
 * the cache away.
 */
export const getQueryClient = () => {
  if (isServer) return makeQueryClient();

  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
};
