import type { Metadata } from 'next';
import { APP_NAME } from '@repo/constants';
import BlogsTable from '../_components/blogs-table';

export const metadata: Metadata = {
  title: 'Manage Blogs',
  description: `Manage the blogs on ${APP_NAME}: search and filter stories, review their stats, and publish, unpublish or delete them.`,
};

const AdminBlogsPage = () => (
  <div className='flex flex-col gap-8'>
    <div className='flex flex-col gap-2'>
      <h1 className='text-3xl font-semibold tracking-tight lg:text-4xl'>
        Blogs
      </h1>
      <p className='text-muted-foreground'>
        Search, filter and moderate every story on the platform.
      </p>
    </div>

    <div className='min-w-0 rounded-xl border'>
      <BlogsTable showControls />
    </div>
  </div>
);

export default AdminBlogsPage;
