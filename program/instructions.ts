import { Program, web3 } from "@project-serum/anchor";
import * as anchor from "@project-serum/anchor";
import { WmpStaking } from "../types/staking";
import { getClaimRewardsAccounts, getCreateStakeEntryAccounts, getCreateStakePoolAccounts, getInitializeAccounts, getRecoverRewardsAccounts, getSetStakePoolRewardsAccounts, getStakeAccounts, getUnstakeAccounts, getWithdrawLpAccounts } from "./accounts";
import { getNextId } from "./state";
import { tokenAmount } from "./utils";
import { AnchorWallet } from "@solana/wallet-adapter-react";

export let program: Program<WmpStaking>;
export let adapter: AnchorWallet | undefined;
export function setProgram(stakingProgram: Program<WmpStaking>) {
  program = stakingProgram;
}

export function setAdapter(_adapter: AnchorWallet | undefined) {
  adapter = _adapter;
}
export async function initialize(admin: web3.Signer) {
  let accounts = await getInitializeAccounts(admin.publicKey);
  const tx = await program.methods
    .initialize()
    .accounts(accounts)
    .signers([admin])
    .rpc({skipPreflight: true});

    await program.provider.connection.confirmTransaction(tx);
}

export async function createStakePool(creator: web3.Signer, mintA: web3.PublicKey, mintB: web3.PublicKey) {
    let id = await getNextId();
    let accounts = await getCreateStakePoolAccounts(creator.publicKey, mintA, mintB, id ?? 0);
    console.log('accounts:', accounts);
    console.log('program:', program);
    const tx = await program.methods
      .createStakePool()
      .accounts(accounts)
      .signers([creator])
      .rpc();

    await program.provider.connection.confirmTransaction(tx);
    return accounts.stakePool;
}

export async function setStakePoolRewards(stakePool: web3.PublicKey, admin: web3.Signer, rewardsPerSecond: anchor.BN) {
  let accounts = await getSetStakePoolRewardsAccounts(admin.publicKey, stakePool);
  const tx = await program.methods
    .setStakePoolRewards(rewardsPerSecond)
    .accounts(accounts)
    .signers([admin])
    .rpc();

  await program.provider.connection.confirmTransaction(tx);
  return stakePool;
}

export async function createStakeEntry(staker: web3.Signer, stakePool: web3.PublicKey) {
  let accounts = await getCreateStakeEntryAccounts(staker.publicKey, stakePool);
  const tx = await program.methods
    .createStakeEntry()
    .accounts(accounts)
    .signers([staker])
    .rpc();

  await program.provider.connection.confirmTransaction(tx);
  return accounts.stakeEntry;
}

export async function createStakeEntryIx(staker: web3.PublicKey, stakePool: web3.PublicKey) {
  let accounts = await getCreateStakeEntryAccounts(staker, stakePool);
  const ix = await program.methods
    .createStakeEntry()
    .accounts(accounts)
    .signers([])
    .instruction();

  return ix;
}

// export async function stake(
//   staker: web3.Signer, 
//   mintA: web3.PublicKey, 
//   amount: anchor.BN, 
//   stakePool: web3.PublicKey, 
//   stakeEntry?: web3.PublicKey) {

//   if (stakeEntry) {
//     stakeEntry = await createStakeEntry(staker, stakePool);
//   }
  
//   let accounts = await getStakeAccounts(staker.publicKey, stakePool, mintA);

//   const tx = await program.methods
//     .stake(amount)
//     .accounts(accounts)
//     .signers([staker])
//     .rpc();

//   await program.provider.connection.confirmTransaction(tx);

//   return accounts.stakeEntry;
// }

export async function createStakeIx(
  staker: web3.PublicKey, 
  mintA: web3.PublicKey, 
  amount: anchor.BN, 
  stakePool: web3.PublicKey) {

  let accounts = await getStakeAccounts(staker, stakePool, mintA);
    console.log("debug program", program)
  const ix = await program.methods
    .stake(amount)
    .accounts(accounts)
    .signers([])
    .instruction();

  return ix;
}

export async function createUnstakeIx(
  staker: web3.PublicKey, 
  mintA: web3.PublicKey, 
  amount: anchor.BN, 
  stakePool: web3.PublicKey) {

  let accounts = await getUnstakeAccounts(staker, stakePool, mintA);

  const ix = await program.methods
    .unstake(amount)
    .accounts(accounts)
    .signers([])
    .instruction();

  return ix;
}

export async function createClaimRewardsIx(
  staker: web3.PublicKey, 
  mintB: web3.PublicKey,
  stakePool: web3.PublicKey) {

  let accounts = await getClaimRewardsAccounts(staker, stakePool, mintB);

  const ix = await program.methods
    .claimRewards()
    .accounts(accounts)
    .signers([])
    .instruction();

  return ix;
}

export async function recoverStakePoolRewards(
  admin: web3.Signer, 
  recoverAmount: anchor.BN,
  mintB: web3.PublicKey,
  stakePool: web3.PublicKey) {

  let accounts = await getRecoverRewardsAccounts(admin.publicKey, stakePool, mintB);

  const tx = await program.methods
    .recoverStakePoolRewards(recoverAmount)
    .accounts(accounts)
    .signers([admin])
    .rpc();

  await program.provider.connection.confirmTransaction(tx);
}

export async function withdrawStakePoolLp(
  admin: web3.Signer, 
  withdrawAmount: anchor.BN,
  mintA: web3.PublicKey,
  stakePool: web3.PublicKey) {

  let accounts = await getWithdrawLpAccounts(admin.publicKey, stakePool, mintA);

  const tx = await program.methods
    .withdrawStakePoolLp(withdrawAmount)
    .accounts(accounts)
    .signers([admin])
    .rpc();

  await program.provider.connection.confirmTransaction(tx);
}