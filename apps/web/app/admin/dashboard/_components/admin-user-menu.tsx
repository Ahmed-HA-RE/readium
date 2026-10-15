import type { ReactElement } from 'react';
import Link from 'next/link';
import { FaEdit, FaHome, FaUser } from 'react-icons/fa';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import LogoutAction from '@/components/shared/logout-action';
import { DEFAULT_AVATAR } from '@/lib/constants';
import { getProfilePath } from '@/lib/utils';

const ITEM_CLASS = 'gap-2 px-4 py-2.5 text-base';
const ICON_CLASS = 'text-foreground size-5';

type AdminUserMenuProps = {
  name: string;
  email: string;
  image: string | null | undefined;
  trigger: ReactElement;
};

const AdminUserMenu = ({ name, email, image, trigger }: AdminUserMenuProps) => {
  const links = [
    { href: getProfilePath(name), label: 'My Profile', Icon: FaUser },
    { href: '/new-story', label: 'Write', Icon: FaEdit },
    { href: '/', label: 'Back to Main Page', Icon: FaHome },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={trigger} />
      <DropdownMenuContent className='w-80' align='end'>
        <DropdownMenuGroup>
          <DropdownMenuLabel className='flex items-center gap-4 px-4 py-2.5 font-normal'>
            <Avatar size='lg'>
              <AvatarImage src={image ?? DEFAULT_AVATAR} alt={name} />
              <AvatarFallback>
                <Skeleton className='size-full rounded-full' />
              </AvatarFallback>
            </Avatar>
            <div className='flex min-w-0 flex-1 flex-col items-start'>
              <span className='text-foreground w-full truncate text-lg font-semibold'>
                {name}
              </span>
              <span className='text-muted-foreground w-full truncate text-base'>
                {email}
              </span>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          {links.map(({ href, label, Icon }) => (
            <DropdownMenuItem
              key={href}
              className={ITEM_CLASS}
              render={<Link href={href} />}
            >
              <Icon className={ICON_CLASS} />
              <span>{label}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <LogoutAction
            label='Logout'
            className={ITEM_CLASS}
            iconClassName='size-5'
          />
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AdminUserMenu;
