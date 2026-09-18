import MarketingHome from '@/components/marketing/marketing-home';
import { getCurrentLoggedInUser } from '@/lib/actions/user/getCurrentLoggedInUser';


const HomePage = async () => {
  const session = await getCurrentLoggedInUser();

  if (!session) return <MarketingHome />;

  return (
    <div>
      <h1>Welcome to the Home Page</h1>
    </div>
  );
};

export default HomePage;
