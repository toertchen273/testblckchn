import { AnchorProvider, Program, web3 } from "@project-serum/anchor";
import { AppState } from "./state";
import { CustomWalletAdapter, getPhantomAdapter } from "./walletAdapter";
import * as artifacts from "../../../types/staking";
import { STAKING_PROGRAM_ID } from "../../../program/program-id";
import { calculateStakeEntryPda } from "../../../program/pda";
import { createClaimRewardsIx, createStakeEntryIx, createStakeIx, createUnstakeIx, setProgram } from "../../../program/instructions";
import { tokenAmount } from "../../../program/utils";
import { createAssociatedTokenAccountInstruction, getAssociatedTokenAddress } from "@solana/spl-token";
import { AnchorWallet, useAnchorWallet } from "@solana/wallet-adapter-react";

// async function initialize() {
//     let adapter = getPhantomAdapter();
//     await adapter?.connect();
    
//     if(adapter && AppState) {
//         let provider = new AnchorProvider(AppState.connection, AppState.adapter, {commitment: "confirmed"});
        
//         AppState.adapter = adapter;
//         AppState.provider = provider;
//         AppState.program = new Program<artifacts.WmpStaking>(artifacts.IDL, STAKING_PROGRAM_ID, provider);
//         AppState.walletConnected = true;
//         setProgram(AppState.program);
//     }
// }

// export async function stakeHandler() {
//     let amount = parseFloat((document.querySelector("#stake input") as HTMLInputElement).value);
//     let [stakeEntryAddress, _] = await calculateStakeEntryPda(AppState.adapter.publicKey, AppState.stakePoolAddress);
//     let stakeEntry = await AppState.program.account.stakeEntry.fetchNullable(stakeEntryAddress);
//     let tx = new web3.Transaction();
//     if (stakeEntry == null) {
//         let stakeEntryIx = await createStakeEntryIx(AppState.adapter.publicKey, AppState.stakePoolAddress);
//         tx.add(stakeEntryIx);
//     }

//     let stakeIx = await createStakeIx(AppState.adapter.publicKey, AppState.tokenAAddress, tokenAmount(amount), AppState.stakePoolAddress);
//     tx.add(stakeIx);

//     let hash = await sendTransaction(tx);
//     await AppState.connection.confirmTransaction(hash);

//     render();
// }

// export async function unstakeHandler() {
//     let amount = parseFloat((document.querySelector("#unstake input") as HTMLInputElement).value);

//     let unstakeIx = await createUnstakeIx(AppState.adapter.publicKey, AppState.tokenAAddress, tokenAmount(amount), AppState.stakePoolAddress);
//     let tx = new web3.Transaction().add(unstakeIx);

//     let hash = await sendTransaction(tx);
//     await AppState.connection.confirmTransaction(hash);

//     // render();
// }

// export async function getRewardsHandler() {
//     let tx = new web3.Transaction();
//     if (!AppState.tokenBBalance) {
//         let associatedAddress = await getAssociatedTokenAddress(AppState.tokenBAddress, AppState.adapter.publicKey);
//         let ix = createAssociatedTokenAccountInstruction(AppState.adapter.publicKey, associatedAddress, AppState.adapter.publicKey, AppState.tokenBAddress);
//         tx.add(ix);
//     }

//     let ix = await createClaimRewardsIx(AppState.adapter.publicKey, AppState.tokenBAddress, AppState.stakePoolAddress);
//     tx.add(ix);

//     let hash = await sendTransaction(tx);
//     await AppState.connection.confirmTransaction(hash);

//     // render();
// }



export async function sendTransaction(transaction: web3.Transaction, owner: web3.PublicKey, adapter: AnchorWallet, connection: web3.Connection): Promise<string> {
    transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    transaction.feePayer = adapter.publicKey;

    let tx = await adapter.signTransaction(transaction);
    return await connection.sendRawTransaction(tx.serialize(), {skipPreflight: true});
}
