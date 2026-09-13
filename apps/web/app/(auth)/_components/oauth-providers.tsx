import { Marker, MarkerContent } from '@/components/ui/marker';
import OAuthButton from './oauth-button';

const OAuthProviders = ({ callbackUrl }: { callbackUrl: string }) => {
  return (
    <div className='flex flex-col gap-5'>
      <div className='grid grid-cols-2 gap-3'>
        <OAuthButton provider='google' callbackUrl={callbackUrl} />
        <OAuthButton provider='github' callbackUrl={callbackUrl} />
      </div>
      <Marker variant='separator'>
        <MarkerContent>OR</MarkerContent>
      </Marker>
    </div>
  );
};

export default OAuthProviders;
