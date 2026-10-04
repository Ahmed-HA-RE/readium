import PlansHeader from './_components/plans-header';

// Standalone layout: the plans page skips the app header and sidebar.
const PlansLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className='flex min-h-svh flex-col'>
      <PlansHeader />
      <main className='flex-1'>{children}</main>
    </div>
  );
};

export default PlansLayout;
