import axios from 'axios';
import { API_URL } from '@/lib/constants';

// The session is an httpOnly cookie, so there is no token to attach as a header —
// `withCredentials` is the axios spelling of fetch's `credentials: 'include'`.
// It only does anything in the browser: server-side callers must still forward the
// cookie header by hand, since Node has no cookie jar to send from.
export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});
