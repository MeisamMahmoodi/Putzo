import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useAsyncError,
  useLocation,
  useRouteError,
} from 'react-router';

import { useButton } from '@react-aria/button';
import {
  type CSSProperties,
  Component,
  type FC,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import './global.css';
import { toPng } from 'html-to-image';
import { useNavigate } from 'react-router';
import { serializeError } from 'serialize-error';
import { Toaster, toast } from 'sonner';
import type { Route } from './+types/root';

export const links = () => [];

function InternalErrorBoundary({ error: errorArg }: Route.ErrorBoundaryProps) {
  const routeError = useRouteError();
  const asyncError = useAsyncError();
  const error = errorArg ?? asyncError ?? routeError;
  const [isOpen, setIsOpen] = useState(false);
  const shouldScale = typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  const scaleFactor = shouldScale ? 1.02 : 1;
  const copyButtonTextClass = shouldScale ? 'text-sm' : 'text-xs';
  const copyButtonPaddingClass = shouldScale ? 'px-[10px] py-[5px]' : 'px-[6px] py-[3px]';
  const postCountRef = useRef(0);
  const lastPostTimeRef = useRef(0);
  const lastErrorKeyRef = useRef<string | null>(null);
  const MAX_ERROR_POSTS_PER_ERROR = 5;
  const THROTTLE_MS = 1000;

  useEffect(() => {
    const serialized = serializeError(error);
    const errorKey = JSON.stringify(serialized);
    if (errorKey !== lastErrorKeyRef.current) {
      lastErrorKeyRef.current = errorKey;
      postCountRef.current = 0;
    }
    if (postCountRef.current >= MAX_ERROR_POSTS_PER_ERROR) return;
    const now = Date.now();
    const timeSinceLastPost = now - lastPostTimeRef.current;
    const post = () => {
      if (postCountRef.current >= MAX_ERROR_POSTS_PER_ERROR) return;
      postCountRef.current += 1;
      lastPostTimeRef.current = Date.now();
      window.parent.postMessage({ type: 'sandbox:error:detected', error: serialized }, '*');
    };
    if (timeSinceLastPost < THROTTLE_MS) {
      const timer = setTimeout(post, THROTTLE_MS - timeSinceLastPost);
      return () => clearTimeout(timer);
    }
    post();
  }, [error]);

  useEffect(() => {
    const animateTimer = setTimeout(() => setIsOpen(true), 100);
    return () => clearTimeout(animateTimer);
  }, []);

  const { buttonProps: copyButtonProps } = useButton(
    {
      onPress: useCallback(() => {
        navigator.clipboard.writeText(JSON.stringify(serializeError(error)));
        toast.custom(() => <div>Copied!</div>, { id: 'copy-error-success', duration: 3000 });
      }, [error, shouldScale]),
    },
    useRef<HTMLButtonElement>(null)
  );

  function isInIframe() {
    try { return window.parent !== window; } catch { return true; }
  }

  return (
    <>
      {!isInIframe() && (
        <div className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 max-w-md z-50 transition-all duration-500 ease-out ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`} style={{ width: '75vw' }}>
          <div className="bg-[#18191B] text-[#F2F2F2] rounded-lg p-4 shadow-lg w-full">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-[#F2F2F2] rounded-full flex items-center justify-center">
                  <span className="text-black text-[1.125rem] leading-none">!</span>
                </div>
              </div>
              <div className="flex flex-col gap-2 flex-1">
                <div className="flex flex-col gap-1">
                  <p className="font-light text-[#F2F2F2] text-sm">App Error Detected</p>
                  <p className="text-[#959697] text-sm font-light">An error occurred while using your app.</p>
                </div>
                <button className={`flex flex-row items-center justify-center gap-[4px] outline-none transition-colors rounded-[8px] border-[1px] bg-[#2C2D2F] hover:bg-[#414243] border-[#414243] text-white ${copyButtonTextClass} ${copyButtonPaddingClass} w-fit`} type="button" {...copyButtonProps}>
                  Copy error
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

type ErrorBoundaryProps = { children: React.ReactNode };
type ErrorBoundaryState = { hasError: boolean; error: unknown | null };

class ErrorBoundaryWrapper extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };
  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { hasError: true, error };
  }
  componentDidCatch(error: unknown, info: unknown) { console.error(error, info); }
  render() {
    if (this.state.hasError) return <InternalErrorBoundary error={this.state.error} params={{}} />;
    return this.props.children;
  }
}

function LoaderWrapper({ loader }: { loader: () => React.ReactNode }) {
  return <>{loader()}</>;
}

export const ClientOnly: React.FC<{ loader: () => React.ReactNode }> = ({ loader }) => {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => { setIsMounted(true); }, []);
  return (
    <ErrorBoundaryWrapper>
      {isMounted ? <LoaderWrapper loader={loader} /> : null}
    </ErrorBoundaryWrapper>
  );
};

const waitForScreenshotReady = async () => {
  const images = Array.from(document.images);
  await Promise.all([
    'fonts' in document ? document.fonts.ready : Promise.resolve(),
    ...images.map((img) => new Promise((resolve) => {
      img.crossOrigin = 'anonymous';
      if (img.complete) { resolve(true); return; }
      img.onload = () => resolve(true);
      img.onerror = () => resolve(true);
    })),
  ]);
  await new Promise((resolve) => setTimeout(resolve, 250));
};

export const useHandleScreenshotRequest = () => {
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.data.type === 'sandbox:web:screenshot:request') {
        try {
          await waitForScreenshotReady();
          const width = window.innerWidth;
          const height = Math.floor(width / (16 / 9));
          const dataUrl = await toPng(document.body, { cacheBust: true, skipFonts: false, width, height, style: { width: `${width}px`, height: `${height}px`, margin: '0' } });
          window.parent.postMessage({ type: 'sandbox:web:screenshot:response', dataUrl }, '*');
        } catch (error) {
          window.parent.postMessage({ type: 'sandbox:web:screenshot:error', error: error instanceof Error ? error.message : String(error) }, '*');
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);
};

export function Layout({ children }: { children: ReactNode }) {
  useHandleScreenshotRequest();
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location?.pathname;
  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'sandbox:navigation') navigate(event.data.pathname);
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [navigate]);

  useEffect(() => {
    if (pathname) window.parent.postMessage({ type: 'sandbox:web:navigation', pathname }, '*');
  }, [pathname]);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <ClientOnly loader={() => children} />
        <Toaster position={isMobile ? 'top-center' : 'bottom-right'} />
        <ScrollRestoration />
        <Scripts />
        <script src="https://kit.fontawesome.com/2c15cc0cc7.js" crossOrigin="anonymous" async />
      </body>
    </html>
  );
}

export const ErrorBoundary = InternalErrorBoundary;

export default function App() {
  return <Outlet />;
}