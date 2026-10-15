import { redirect } from 'next/navigation';
import { getCurrentLoggedInUser } from '@/lib/actions/user/getCurrentLoggedInUser';
import AdminShell from './_components/admin-shell';

// Every admin route sits under this layout, so the role is checked once here.
const AdminDashboardLayout = async ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const session = await getCurrentLoggedInUser();
  if (!session || session.user.role !== 'admin') redirect('/');

  const { name, email, image } = session.user;

  return <AdminShell user={{ name, email, image }}>{children}</AdminShell>;
};

export default AdminDashboardLayout;
