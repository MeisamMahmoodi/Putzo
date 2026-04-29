import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      cacheTime: 1000 * 60 * 30,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Hide the "Made in Bolt" watermark badge globally
const hideBadgeStyle = `
  a[href*="bolt.new"],
  a[href*="stackblitz.com"],
  div[class*="bolt-badge"],
  div[class*="made-in"],
  [data-testid="bolt-badge"],
  .bolt-badge {
    display: none !important;
    visibility: hidden !important;
    opacity: 0 !important;
    pointer-events: none !important;
  }
`;

export default function RootLayout({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <style dangerouslySetInnerHTML={{ __html: hideBadgeStyle }} />
      {children}
    </QueryClientProvider>
  );
}
