import type { CurrentUser } from '@repo/types';
import EmailDialog from './email-dialog';
import NameDialog from './name-dialog';
import BioDialog from './bio-dialog';
import WebsiteDialog from './website-dialog';
import AvatarField from './avatar-field';

type AccountSettingsProps = {
  user: Pick<CurrentUser, 'name' | 'email' | 'bio' | 'website'>;
};

const AccountSettings = ({ user }: AccountSettingsProps) => (
  <section className='flex flex-col divide-y pt-2 *:py-5'>
    <EmailDialog email={user.email} username={user.name} />
    <NameDialog name={user.name} />
    <BioDialog bio={user.bio ?? null} />
    <WebsiteDialog website={user.website ?? null} />
    <AvatarField />
  </section>
);

export default AccountSettings;
