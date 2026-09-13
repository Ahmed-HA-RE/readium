'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { getQueryClient } from '@/lib/get-query-client';

// Every provider in the app mounts here. `getQueryClient` is called during
// render rather than in state or a ref, so suspending before the provider
// mounts cannot leave the client behind.
const Providers = ({ children }: { children: React.ReactNode }) => {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster position='bottom-right' />
    </QueryClientProvider>
  );
};

export default Providers;
