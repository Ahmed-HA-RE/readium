'use client';

import { BsShieldLock } from 'react-icons/bs';
import { LuFileKey } from 'react-icons/lu';
import { MdOutlineMailLock } from 'react-icons/md';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import VerifyCodeForm from './verify-code-form';
import EmailCodePanel from './email-code-panel';

const TwoFactorTabs = ({ callbackUrl }: { callbackUrl: string }) => (
  <Tabs defaultValue='totp' className='flex flex-col gap-8'>
    <TabsList className='w-full max-sm:[&_svg]:hidden'>
      <TabsTrigger value='totp'>
        <BsShieldLock aria-hidden />
        Authenticator
      </TabsTrigger>
      <TabsTrigger value='otp'>
        <MdOutlineMailLock aria-hidden />
        Email
      </TabsTrigger>
      <TabsTrigger value='backup'>
        <LuFileKey aria-hidden />
        Backup code
      </TabsTrigger>
    </TabsList>

    <TabsContent value='totp'>
      <VerifyCodeForm
        method='totp'
        label='Enter the 6-digit code from your authenticator app'
        callbackUrl={callbackUrl}
      />
    </TabsContent>
    <TabsContent value='otp'>
      <EmailCodePanel callbackUrl={callbackUrl} />
    </TabsContent>
    <TabsContent value='backup'>
      <VerifyCodeForm
        method='backup'
        label='Enter one of your backup codes'
        callbackUrl={callbackUrl}
      />
    </TabsContent>
  </Tabs>
);

export default TwoFactorTabs;
