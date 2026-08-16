import { APP_NAME } from '@repo/constants';
import slugify from 'slugify';
import { v4 as uuidv4 } from 'uuid';

export const generateImageKey = ({
  userId,
  fileName,
}: {
  userId: string;
  fileName: string;
}) => {
  return `${APP_NAME}-${userId}-${uuidv4()}-${fileName}`;
};

export const generateSlug = (title: string) => {
  return `${slugify(title, { lower: true })}-${uuidv4().slice(0, 8)}`;
};
