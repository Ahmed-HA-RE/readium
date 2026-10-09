import { Button } from 'react-email';

interface EmailButtonProps {
  url: string;
  content?: string;
  className?: string;
  variant?: 'default' | 'secondary' | 'destructive';
}

const variantStyles = {
  default: {
    backgroundImage: 'linear-gradient(135deg, #7450f8 0%, #9e4af8 100%)',
  },
  secondary: { backgroundColor: '#111827' },
  destructive: { backgroundColor: '#dc2626' },
};

const EmailButton = ({
  url,
  content,
  className,
  variant = 'default',
}: EmailButtonProps): React.ReactNode => {
  return (
    <Button
      href={url}
      className={`inline-block px-[20px] py-[12px] rounded-[8px] text-white ${className ?? ''}`}
      style={variantStyles[variant]}
    >
      {content ?? 'Confirm Email'}
    </Button>
  );
};

export default EmailButton;
