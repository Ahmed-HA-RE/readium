'use client';

import { useQueryStates } from 'nuqs';
import { IoBookmarks } from 'react-icons/io5';
import { FaComments, FaHeart } from 'react-icons/fa';
import { listsParsers, type ListsTab } from '@/lib/search-params';
import DashboardTabs, {
  type DashboardTab,
} from '@/components/shared/dashboard-tabs';
import MyLikesOrBookmarksList from './my-likes-or-bookmarks-list';
import MyCommentsList from './my-comments-list';

const TABS: DashboardTab[] = [
  { value: 'bookmarks', label: 'Bookmarks', icon: IoBookmarks },
  { value: 'likes', label: 'Likes', icon: FaHeart },
  { value: 'comments', label: 'Comments', icon: FaComments },
];

type ListsTabsProps = {
  viewer: { id: string; name: string };
};

const ListsTabs = ({ viewer }: ListsTabsProps) => {
  const [{ tab }, setParams] = useQueryStates(listsParsers);

  return (
    <DashboardTabs
      tabs={TABS}
      value={tab}
      onValueChange={(next) => setParams({ tab: next as ListsTab, page: null })}
    >
      {tab === 'comments' ? (
        <MyCommentsList viewerName={viewer.name} />
      ) : (
        <MyLikesOrBookmarksList list={tab} viewerId={viewer.id} />
      )}
    </DashboardTabs>
  );
};

export default ListsTabs;
