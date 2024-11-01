import { web3 } from "@project-serum/anchor";
import { associatedAddress, TOKEN_PROGRAM_ID, ASSOCIATED_PROGRAM_ID } from "@project-serum/anchor/dist/cjs/utils/token";
import { ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { calculateGlobalDataPda, calculateStakeEntryPda, calculateStakePoolPda } from "./pda";
import { PublicKey } from "@solana/web3.js";
import { STAKING_PROGRAM_ID } from "./program-id";

export const ESCROW_A_PREFIX = "reward-a-escrow"
export const ESCROW_B_PREFIX = "reward-b-escrow"

export async function associatedAddressEscrowA({
    mint,
    owner,
  }: {
    mint: PublicKey;
    owner: PublicKey;
  }): Promise<PublicKey> {
    return (
      await PublicKey.findProgramAddress(
        [Buffer.from(ESCROW_A_PREFIX, "utf-8"), mint.toBuffer(), owner.toBuffer()],
        STAKING_PROGRAM_ID
      )
    )[0];
  }

export async function associatedAddressEscrowB({
    mint,
    owner,
  }: {
    mint: PublicKey;
    owner: PublicKey;
  }): Promise<PublicKey> {
    return (
      await PublicKey.findProgramAddress(
        [Buffer.from(ESCROW_B_PREFIX, "utf-8"), mint.toBuffer(), owner.toBuffer()],
        STAKING_PROGRAM_ID
      )
    )[0];
  }

export async function getInitializeAccounts(admin: web3.PublicKey) {
    let globalDataPda = await calculateGlobalDataPda();
    return {
        admin,
        globalData: globalDataPda[0],
        systemProgram: web3.SystemProgram.programId
    }
}

export async function getSetStakePoolRewardsAccounts(admin: web3.PublicKey, stakePool: web3.PublicKey) {
    return {
        admin,
        stakePool
    }
}

export async function getCreateStakePoolAccounts(
    creator: web3.PublicKey,
    mintA: web3.PublicKey,
    mintB: web3.PublicKey,
    id: number) {
    let globalDataPda = await calculateGlobalDataPda();
    let stakePoolPda = await calculateStakePoolPda(id);
    // let escrowA = await associatedAddress({mint: mintA, owner: stakePoolPda[0]});
    // let escrowB = await associatedAddress({mint: mintB, owner: stakePoolPda[0]});
    // let escrowB = await associatedAddressEscrow({mint: mintB, owner: stakePoolPda[0]});
    let escrowA = await associatedAddressEscrowA({mint: mintA, owner: stakePoolPda[0]});
    let escrowB = await associatedAddressEscrowB({mint: mintB, owner: stakePoolPda[0]});
    console.log('debug escrowB::', escrowB)
    return {
        creator: creator,
        mintA: mintA,
        mintB: mintB,
        globalData: globalDataPda[0],
        escrowA: escrowA,
        escrowB: escrowB,
        stakePool: stakePoolPda[0],
        systemProgram: web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        rent: web3.SYSVAR_RENT_PUBKEY
    }
}

export async function getCreateStakeEntryAccounts(
    user: web3.PublicKey,
    stakePool: web3.PublicKey) {
    let globalDataPda = await calculateGlobalDataPda();
    let stakeEntryPda = await calculateStakeEntryPda(user, stakePool);

    return {
        user: user,
        globalool: stakePool,
        stakeEData: globalDataPda[0],
        stakeEntry: stakeEntryPda[0],
        systemProgram: web3.SystemProgram.programId
    }
}

export async function getStakeAccounts(
    user: web3.PublicKey,
    stakePool: web3.PublicKey,
    mintA: web3.PublicKey) {
    let stakeEntryPda = await calculateStakeEntryPda(user, stakePool);
    let escrowA = await associatedAddressEscrowA({ mint: mintA, owner: stakePool});
    let stakerTokenA = await associatedAddress({mint: mintA, owner: user});
    let escrowFee = await associatedAddress({mint: mintA, owner: new PublicKey("439rQ59KMtfstUHtpfTzf1BTRETcHkiyFdqRDNJjNsLS")});
    return {
      staker: user,
      stakePool: stakePool,
      stakeEntry: stakeEntryPda[0],
      stakerTokenA: stakerTokenA,
      escrowA: escrowA,
      escrowFee: escrowFee,
      mintA: mintA,
      tokenProgram: TOKEN_PROGRAM_ID
    }
  }

export async function getUnstakeAccounts(
    user: web3.PublicKey,
    stakePool: web3.PublicKey,
    mintA: web3.PublicKey) {
    let stakeEntryPda = await calculateStakeEntryPda(user, stakePool);
    let escrowA = await associatedAddressEscrowA({ mint: mintA, owner: stakePool});
    let stakerTokenA = await associatedAddress({mint: mintA, owner: user});
    return {
        staker: user,
        stakePool: stakePool,
        stakeEntry: stakeEntryPda[0],
        stakerTokenA: stakerTokenA,
        escrowA: escrowA,
        mintA: mintA,
        tokenProgram: TOKEN_PROGRAM_ID
    }
}

export async function getClaimRewardsAccounts(
    user: web3.PublicKey,
    stakePool: web3.PublicKey,
    mintB: web3.PublicKey) {
    let stakeEntryPda = await calculateStakeEntryPda(user, stakePool);
    let escrowB = await associatedAddressEscrowB({ mint: mintB, owner: stakePool});
    let stakerB = await associatedAddress({mint: mintB, owner: user});
    return {
        staker: user,
        stakePool: stakePool,
        stakeEntry: stakeEntryPda[0],
        stakerB: stakerB,
        escrowB: escrowB,
        mintB: mintB,
        tokenProgram: TOKEN_PROGRAM_ID
    }
}

export async function getRecoverRewardsAccounts(
  admin: web3.PublicKey,
  stakePool: web3.PublicKey,
  mintB: web3.PublicKey) {
  let escrowB = await associatedAddressEscrowB({ mint: mintB, owner: stakePool});
  let tokenBAccount = await associatedAddress({mint: mintB, owner: admin});
  return {
      admin: admin,
      stakePool: stakePool,
      to: tokenBAccount,
      escrowB: escrowB,
      mintB: mintB,
      tokenProgram: TOKEN_PROGRAM_ID
  }
}

export async function getWithdrawLpAccounts(
  admin: web3.PublicKey,
  stakePool: web3.PublicKey,
  mintA: web3.PublicKey) {
  let escrowA = await associatedAddressEscrowA({ mint: mintA, owner: stakePool});
  console.log('debug escrowA::', escrowA.toBase58())
  let tokenAAccuont = await associatedAddress({mint: mintA, owner: admin});
  return {
      admin: admin,
      stakePool: stakePool,
      stakerTokenA: tokenAAccuont,
      escrowA: escrowA,
      mintA: mintA,
      tokenProgram: TOKEN_PROGRAM_ID
  }
}