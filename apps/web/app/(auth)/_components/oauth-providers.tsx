import { Marker, MarkerContent } from '@/components/ui/marker';
import OAuthButton from './oauth-button';

interface OAuthProvidersProps {
  callbackUrl: string;
  // Off by default so sign-up, which renders this too, shows no badge.
  showLastUsed?: boolean;
}

const OAuthProviders = ({
  callbackUrl,
  showLastUsed = false,
}: OAuthProvidersProps) => {
  return (
    <div className='flex flex-col gap-5'>
      <div className='grid grid-cols-2 gap-3'>
        <OAuthButton
          provider='google'
          callbackUrl={callbackUrl}
          showLastUsed={showLastUsed}
        />
        <OAuthButton
          provider='github'
          callbackUrl={callbackUrl}
          showLastUsed={showLastUsed}
        />
      </div>
      <Marker variant='separator'>
        <MarkerContent>OR</MarkerContent>
      </Marker>
    </div>
  );
};

export default OAuthProviders;
