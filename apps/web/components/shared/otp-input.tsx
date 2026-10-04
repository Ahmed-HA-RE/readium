'use client';

import { REGEXP_ONLY_DIGITS, REGEXP_ONLY_DIGITS_AND_CHARS } from 'input-otp';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from '@/components/ui/input-otp';

const GROUP_CLASS =
  'gap-1 lg:gap-3 *:data-[slot=input-otp-slot]:size-9 *:data-[slot=input-otp-slot]:lg:size-12.5 *:data-[slot=input-otp-slot]:rounded-lg *:data-[slot=input-otp-slot]:border *:data-[slot=input-otp-slot]:lg:text-2xl *:data-[slot=input-otp-slot]:text-base';

type OtpInputProps = {
  value: string;
  onChange: (value: string) => void;
  // Backup codes mix letters and digits; authenticator and email codes are digits only. Backup codes may contain letters.
  allowLetters?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  id?: string;
  'aria-labelledby'?: string;
};

const OtpInput = ({
  value,
  onChange,
  allowLetters = false,
  disabled,
  invalid,
  id,
  'aria-labelledby': ariaLabelledBy,
}: OtpInputProps) => (
  <InputOTP
    id={id}
    aria-labelledby={ariaLabelledBy}
    maxLength={6}
    value={value}
    onChange={onChange}
    pattern={allowLetters ? REGEXP_ONLY_DIGITS_AND_CHARS : REGEXP_ONLY_DIGITS}
    inputMode={allowLetters ? 'text' : 'numeric'}
    autoComplete='one-time-code'
    disabled={disabled}
    aria-invalid={invalid}
  >
    <InputOTPGroup className={GROUP_CLASS}>
      {[0, 1, 2].map((index) => (
        <InputOTPSlot
          key={index}
          index={index}
          aria-invalid={invalid}
          className=''
        />
      ))}
    </InputOTPGroup>
    <InputOTPSeparator className='mx-2' />
    <InputOTPGroup className={GROUP_CLASS}>
      {[3, 4, 5].map((index) => (
        <InputOTPSlot key={index} index={index} aria-invalid={invalid} />
      ))}
    </InputOTPGroup>
  </InputOTP>
);

export default OtpInput;
