import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

const IP_HEADERS = ['cf-connecting-ip', 'x-real-ip', 'x-forwarded-for'];

type TrackedRequest = {
  headers?: Record<string, string | string[] | undefined>;
  ip?: string;
};

// Temporary: logs the forwarded headers once per process so we can see which of
// them Render actually sends. Remove once the answer is known.
let headersLogged = false;

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected getTracker(req: TrackedRequest): Promise<string> {
    if (!headersLogged) {
      headersLogged = true;
      console.log(
        '[throttler] forwarded headers:',
        JSON.stringify(req.headers),
      );
    }

    // `x-forwarded-for` is a chain, so take the leftmost entry, which Render
    // documents as the real client. The others carry a single address.
    for (const name of IP_HEADERS) {
      const header = req.headers?.[name];
      const value = Array.isArray(header) ? header[0] : header;
      const ip = value?.split(',')[0]?.trim();
      if (ip) return Promise.resolve(ip);
    }

    // Behind a proxy this is the load balancer, which is one bucket for everyone.
    return Promise.resolve(req.ip ?? 'unknown');
  }
}
