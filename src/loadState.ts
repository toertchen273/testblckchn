import { web3 } from "@project-serum/anchor";
import { getAccount, getAssociatedTokenAddress } from "@solana/spl-token";
import { calculateStakeEntryPda } from "../program/pda";
import { AppState, IStakeEntryData, IStakePoolData, ITokenBalance } from "./state";
import { adapter, program } from "../program/instructions";
import App from "next/app";

export async function loadState() {
   
    await fetchStakePoolData();
    
    await fetchTokenAData();
    await fetchTokenBData();

    await fetchStakeEntryData();
} 

async function fetchTokenAData() {
    if(adapter?.publicKey){
        let data = await getTokenAccountNullable(AppState.tokenAAddress, adapter?.publicKey);
       if (!data) return;
        AppState.tokenABalance = {
            tokenSymbol: "WMP",
            balance: Number(data.amount) / 1e6
        } as ITokenBalance;
    }
}

async function fetchTokenBData() {
    if(adapter?.publicKey){
        let data = await getTokenAccountNullable(AppState.tokenBAddress, adapter.publicKey);
        if (!data) return;
        AppState.tokenBBalance = {
            tokenSymbol: "xWMP",
            balance: Number(data.amount) / 1e6
        } as ITokenBalance;
    }
}

async function fetchStakePoolData() {
    let stakePoolData = await program.account.stakePool.fetchNullable(AppState.stakePoolAddress);
    if(stakePoolData) {
        AppState.stakePoolData = {
            xWmpEscrow: stakePoolData?.escrowB,
            balance: stakePoolData.balance.toNumber() / 1e6,
            timestamp: new Date(stakePoolData.lastUpdateTimestamp.toNumber() * 1000)
        } as IStakePoolData;
      
    }
}


async function fetchStakeEntryData() {
    console.log("debug fetchStakeEntryData", AppState)
    if(adapter?.publicKey) {
        let [stakeEntryAddress, _] = await calculateStakeEntryPda(adapter.publicKey, AppState.stakePoolAddress);
        let stakeEntryData = await program.account.stakeEntry.fetchNullable(stakeEntryAddress);
        console.log('debug stakeEntryData::', stakeEntryData?.rewardsPerTokenPaid.toNumber())
        if (stakeEntryData == null) return;
    
        AppState.stakeEntryAddress = stakeEntryAddress;``
        console.log("debug:claimedreward", stakeEntryData.claimed.toString())
        AppState.stakeEntryData = {
            stakeBalance: stakeEntryData.balance.toNumber() / 1e6,
            rewards: stakeEntryData.rewards.toNumber() / 1e6,
            rewardsPerTokenPaid: stakeEntryData.rewardsPerTokenPaid.toNumber() / 1e6,
            claimedReward: stakeEntryData.claimed.toNumber() / 1e6            
        } as IStakeEntryData;
        console.log(AppState.stakeEntryData);
    }
}

async function getTokenAccountNullable(mint: web3.PublicKey, owner: web3.PublicKey) {
    let associatedAddress = await getAssociatedTokenAddress(mint, owner);
    try {
        let data = await getAccount(AppState.connection, associatedAddress);
        return data;
    } catch {}
    return null;
}