'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { getQueryClient } from '@/lib/get-query-client';

// Every provider in the app mounts here. `getQueryClient` is called during
// render rather than in state or a ref, so suspending before the provider
// mounts cannot leave the client behind.
const Providers = ({ children }: { children: React.ReactNode }) => {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <NuqsAdapter>
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster position='bottom-right' />
      </NuqsAdapter>
    </QueryClientProvider>
  );
};

export default Providers;
