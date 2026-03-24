'use client';

import * as React from 'react';
import '@rainbow-me/rainbowkit/styles.css';
import {
  getDefaultConfig,
  RainbowKitProvider,
  darkTheme,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';

// RainbowKit requires a free Project ID from WalletConnect
// For now, we will use a public testing ID, but you should get your own
// at https://cloud.walletconnect.com for your final hackathon submission!
const projectId = '98d4e6be851f855fabf51324d0a43e9d'; 

const config = getDefaultConfig({
  appName: 'AgentPay Network',
  projectId: projectId,
  chains: [baseSepolia],
  ssr: true, // Required for Next.js App Router
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {/* We use darkTheme and pass our electric blue accent color */}
        <RainbowKitProvider theme={darkTheme({ accentColor: '#2563eb' })}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}