import { Program, Provider, web3 } from "@project-serum/anchor";
import { WmpStaking } from "../../../types/staking";
import { CustomWalletAdapter } from "./walletAdapter";
import { AnchorWallet } from "@solana/wallet-adapter-react";

export interface ITokenBalance {
    tokenSymbol: string,
    balance: number
}

export interface IStakeEntryData {
    stakeBalance: number,
    rewards: number,
    rewardsPerTokenPaid: number,
    timestamp: Date
}

export interface IStakePoolData {
    xWmpEscrow: web3.PublicKey,
    balance: number,
    timestamp: Date
}

export interface IAppState {
    provider: Provider,
    adapter: CustomWalletAdapter | AnchorWallet | undefined,
    connection: web3.Connection,
    program: Program<WmpStaking>,
    walletConnected: boolean,
    tokenABalance: ITokenBalance,
    tokenBBalance: ITokenBalance,
    stakeEntryData: IStakeEntryData,
    tokenAAddress: web3.PublicKey,
    tokenBAddress: web3.PublicKey,
    stakePoolAddress: web3.PublicKey,
    stakeEntryAddress: web3.PublicKey,
    stakePoolData: IStakePoolData
}

export let AppState = {
    tokenAAddress: new web3.PublicKey("AdaEUjSPakTbCMDZeyBw76qBrod8YGUad3t4dVmkmGHz"),
    tokenBAddress: new web3.PublicKey("AdaEUjSPakTbCMDZeyBw76qBrod8YGUad3t4dVmkmGHz"),
    stakePoolAddress: new web3.PublicKey("BFCbiFLZUCWESpgdZf9zmsgzhaWSCbdWVJtDRYvnWo4T"),
    // connection: new web3.Connection("https://rpc.shyft.to?api_key=6qgEDmJbmOqBsbXq"),
    connection: new web3.Connection("https://divine-nameless-snow.solana-mainnet.quiknode.pro/cbf3ffcb19633575cc0d278031b1c28c7e538633")
} as IAppState;
