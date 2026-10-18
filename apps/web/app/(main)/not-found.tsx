import NotFoundContent from '@/components/not-found-content';

// A `notFound()` from a page under `(main)` keeps this layout, so the site header stays above the 404.
// `h-full` fills the layout's stretched <main>, so the content centers in the space below the header.
const MainNotFound = () => (
  <NotFoundContent className='h-full justify-center' />
);

export default MainNotFound;
