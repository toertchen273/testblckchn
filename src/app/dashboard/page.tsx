"use client";

import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import * as web3 from "@solana/web3.js"
import { WalletModalProvider} from "@solana/wallet-adapter-react-ui";
import { FC, ReactNode, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import Dashboard from "./Dashboard"
import { useAutoConnect } from "./AutoConnectProvider";
import { Adapter, WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { UnsafeBurnerWalletAdapter } from "@solana/wallet-adapter-wallets";
import { type SolanaSignInInput } from '@solana/wallet-standard-features';
import { verifySignIn } from '@solana/wallet-standard-util';
import {
    PhantomWalletAdapter,
    SolflareWalletAdapter,
    TrustWalletAdapter,
} from '@solana/wallet-adapter-wallets';

require('@solana/wallet-adapter-react-ui/styles.css');

// export const WalletMultiButtonDynamic = dynamic(
//   async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
//   { ssr: false }
// );

const WalletContextProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const { autoConnect } = useAutoConnect();

  // Can be set to 'devnet', 'testnet', or 'mainnet-beta'
  const network = WalletAdapterNetwork.Devnet;

  // You can also provide a custom RPC endpoint
  const endpoint = useMemo(() => web3.clusterApiUrl(network), [network]);

  const wallets = useMemo(
      () => [
          /**
           * Wallets that implement either of these standards will be available automatically.
           *
           *   - Solana Mobile Stack Mobile Wallet Adapter Protocol
           *     (https://github.com/solana-mobile/mobile-wallet-adapter)
           *   - Solana Wallet Standard
           *     (https://github.com/solana-labs/wallet-standard)
           *
           * If you wish to support a wallet that supports neither of those standards,
           * instantiate its legacy wallet adapter here. Common legacy adapters can be found
           * in the npm package `@solana/wallet-adapter-wallets`.
           */
          new PhantomWalletAdapter(),
          new SolflareWalletAdapter(),
          new TrustWalletAdapter(),
          new UnsafeBurnerWalletAdapter(),
      ],
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [network]
  );


  const autoSignIn = useCallback(async (adapter: Adapter) => {
      if (!('signIn' in adapter)) return true;

      const input: SolanaSignInInput = {
          domain: window.location.host,
          address: adapter.publicKey ? adapter.publicKey.toBase58() : undefined,
          statement: 'Please sign in.',
      };
      const output = await adapter.signIn(input);

      if (!verifySignIn(input, output)) throw new Error('Sign In verification failed!');

      return false;
  }, []);

  return (
      <ConnectionProvider endpoint={endpoint}>
          <WalletProvider wallets={wallets} autoConnect={true}>
                      <WalletModalProvider>{children}</WalletModalProvider>
          </WalletProvider>
      </ConnectionProvider>
  );
};

export default function Home() {

  return (
      <WalletContextProvider >
          <Dashboard />
      </WalletContextProvider>    
   
  );
}
