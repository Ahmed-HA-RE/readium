import { Img, Section } from 'react-email';
import { APP_LOGO } from '@repo/assets';

const AppLogo = (): React.ReactNode => (
  <Section className="mb-8">
    <Img src={APP_LOGO} alt="Logo" width={50} className="block mx-auto" />
  </Section>
);

export default AppLogo;
