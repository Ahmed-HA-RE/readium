import React from 'react';
import { Text } from 'react-email';

const ExpireToken = ({ content }: { content: string }): React.ReactNode => {
  return <Text className="text-sm text-gray-400 mt-6 mb-0">{content}</Text>;
};

export default ExpireToken;
