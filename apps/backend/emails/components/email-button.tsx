import { Button } from 'react-email';

interface EmailButtonProps {
  url: string;
  content?: string;
  className?: string;
}

const EmailButton = ({
  url,
  content,
  className,
}: EmailButtonProps): React.ReactNode => {
  return (
    <Button
      href={url}
      className={`inline-block px-[20px] py-[12px] rounded-[8px] text-white ${className}`}
      style={{
        backgroundImage: 'linear-gradient(135deg, #7450f8 0%, #9e4af8 100%)',
      }}
    >
      {content ?? 'Confirm Email'}
    </Button>
  );
};

export default EmailButton;
