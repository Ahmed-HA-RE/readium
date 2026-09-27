'use client';

import { useQueryStates } from 'nuqs';
import { LuGlobe, LuGlobeLock } from 'react-icons/lu';
import { MyBlogsStatus } from '@repo/types';
import { myStoriesParsers } from '@/lib/search-params';
import { useMyBlogs } from '@/hooks/blogs';
import DashboardTabs from '@/components/shared/dashboard-tabs';

type StoriesTabsProps = {
  children: React.ReactNode;
};

const StoriesTabs = ({ children }: StoriesTabsProps) => {
  const [params, setParams] = useQueryStates(myStoriesParsers);
  const { data } = useMyBlogs(params, { enabled: false });

  const tabs = [
    {
      value: MyBlogsStatus.DRAFT,
      label: 'Drafts',
      icon: LuGlobeLock,
      count: data?.counts.draft,
    },
    {
      value: MyBlogsStatus.PUBLISHED,
      label: 'Published',
      icon: LuGlobe,
      count: data?.counts.published,
    },
  ];

  return (
    <DashboardTabs
      tabs={tabs}
      value={params.status}
      isCountPending={!data}
      onValueChange={(status) =>
        setParams({
          status: status as MyBlogsStatus,
          search: null,
          sort: null,
          page: null,
        })
      }
    >
      {children}
    </DashboardTabs>
  );
};

export default StoriesTabs;
