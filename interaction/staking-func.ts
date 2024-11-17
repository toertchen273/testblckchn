import { PublicKey, SystemProgram, Transaction, TransactionInstruction } from "@solana/web3.js";
import * as anchor from '@coral-xyz/anchor'
import { AnchorProvider } from "@coral-xyz/anchor";
import idl from './idl.json'
import { connection } from "./environment"
import { AnchorWallet } from "@solana/wallet-adapter-react";
import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID, getAssociatedTokenAddress, getMint } from "@solana/spl-token";
import { BN } from "bn.js";

// replace the newly created pool address here when new pool is created
export const POOL_ADDR = new PublicKey("F2xPo2zDtw1cGNL6X5G46U5yRQrqwLw6uvs9gd81DEMv");
export const TOKEN_ADDRESS = new PublicKey("BCTJnXmpYpmnozJb2eYykzPnVnV8cSABXXd71iJN8s7t")
const FEE_WALLET = new PublicKey("7LqRw17YaP7AKy1NB6vgFWEGKgL9jcEHejiXrYM78p7H");
const FEE_WALLET_TOKEN_ACCOUNT = getAssociatedTokenAddress(TOKEN_ADDRESS, FEE_WALLET);
export const TOKEN_LAMPORTS: number = 1000000;

export const getProvider = (wallet: AnchorWallet) => {
  const provider = new AnchorProvider(
    connection, wallet, { "preflightCommitment": "processed" },
  );
  return provider;
}

export const getEntryData = async (wallet: AnchorWallet, entryId: PublicKey) => {
  const provider = getProvider(wallet)
  const program = new anchor.Program(idl as anchor.Idl, idl.metadata.address, provider);

  const pools = await program.account.stakeEntry.fetch(entryId);

  return pools
}

export const getAllpools = async (wallet: AnchorWallet) => {
  const provider = getProvider(wallet)
  const program = new anchor.Program(idl as anchor.Idl, idl.metadata.address, provider);

  const pools = await program.account.stakePool.all()

  return pools
}

export const getAllStakeEntries = async (wallet: AnchorWallet) => {
  const provider = getProvider(wallet)
  const program = new anchor.Program(idl as anchor.Idl, idl.metadata.address, provider);
  const entries = await program.account.stakeEntry.all()
  return entries
}

export const getPoolData = async (wallet: AnchorWallet, poolId: PublicKey) => {
  const provider = getProvider(wallet)
  const program = new anchor.Program(idl as anchor.Idl, idl.metadata.address, provider);

  const pool = await program.account.stakePool.fetch(poolId)

  return pool
}

export const getWalletStakes = async (wallet: AnchorWallet) => {
  const provider = getProvider(wallet)
  const program = new anchor.Program(idl as anchor.Idl, idl.metadata.address, provider);

  const stakes = await program.account.stakeEntry.all(
    [
      {
        memcmp: {
          offset: 41,
          bytes: wallet.publicKey.toString(),
        },
      },
    ]
  )

  return stakes
}

export const initStakePool = async (wallet: AnchorWallet, amount: number) => {
  try {
    const provider = getProvider(wallet)
    const program = new anchor.Program(idl as anchor.Idl, idl.metadata.address, provider);
    const stake_pool = PublicKey.findProgramAddressSync(
      [anchor.utils.bytes.utf8.encode("stake-pool")],
      program.programId
    )[0];

    console.log("stake_pool:", stake_pool.toString())

    const poolAta = await getAssociatedTokenAddress(TOKEN_ADDRESS, stake_pool, true)
    const payerAta = await getAssociatedTokenAddress(TOKEN_ADDRESS, wallet.publicKey)

    const poolTx: TransactionInstruction = await program.methods.initPool(
       new anchor.BN(amount),
    ).accounts({
      stakePool: stake_pool,
      poolTokenAccount: poolAta,
      mint: TOKEN_ADDRESS,
      payerTokenAccount: payerAta,
      payer: wallet.publicKey,
      escrowFee: FEE_WALLET,
      escrowTokenAccount: await FEE_WALLET_TOKEN_ACCOUNT,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    }).instruction()

    const transaction = new Transaction().add(poolTx)

    return transaction;
  } catch (e) {
    console.log(e)
  }
}

export const stakeTokens = async (wallet: AnchorWallet, amount: number) => {
  try {
    const provider = getProvider(wallet)
    const program = new anchor.Program(idl as anchor.Idl, idl.metadata.address, provider);
    const pool: any = await getPoolData(wallet, POOL_ADDR);
    const tx: Transaction = new Transaction();

    const stakeEntry = findStakeEntryId(POOL_ADDR, wallet?.publicKey)

    const stakeEntryId = await connection.getAccountInfo(stakeEntry)
    if (stakeEntryId === null) {
      const txn = await initStakePoolEntry(wallet, POOL_ADDR, stakeEntry)
      tx.add(txn)
    }
    const poolAta = await getAssociatedTokenAddress(pool?.mint, POOL_ADDR, true)
    const payerAta = await getAssociatedTokenAddress(pool?.mint, wallet?.publicKey);

    const tokenDetails = await getMint(connection, new PublicKey(TOKEN_ADDRESS))
    let decimals = parseInt('1' + '0'.repeat(tokenDetails.decimals));

    const txn = await program.methods.stakeTokens(new anchor.BN(amount*decimals)).accounts({
      stakePool: POOL_ADDR,
      poolTokenAccount: poolAta,
      stakeEntry: stakeEntry,
      stakeMint: pool?.mint,
      user: wallet.publicKey,
      userTokenAccount: payerAta,
      escrowTokenAccount: await FEE_WALLET_TOKEN_ACCOUNT,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    }).instruction()
    tx.add(txn)
    return tx
  } catch (e) {
    console.log(e)
  }
}

export const unstakeTokens = async (wallet: AnchorWallet, amount: number) => {
  try {
    const provider = getProvider(wallet)
    const program = new anchor.Program(idl as anchor.Idl, idl.metadata.address, provider);
    const pool: any = await getPoolData(wallet, POOL_ADDR);
    const tx: Transaction = new Transaction();
    const stakeEntry = findStakeEntryId(POOL_ADDR, wallet?.publicKey)
    const payerAta = await getAssociatedTokenAddress(pool?.mint, wallet?.publicKey);
    const poolAta = await getAssociatedTokenAddress(pool?.mint, POOL_ADDR, true);
    const txn = await program.methods.unstakeTokens(new anchor.BN(amount * TOKEN_LAMPORTS)).accounts({
      stakePool: POOL_ADDR,
      poolTokenAccount: poolAta,
      stakeEntry: stakeEntry,
      stakeMint: pool?.mint,
      user: wallet.publicKey,
      escrowTokenAccount: await FEE_WALLET_TOKEN_ACCOUNT,
      userTokenAccount: payerAta,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    }).instruction()
    tx.add(txn)
    return tx
  } catch (e) {
    console.log(e)
  }
}

export const claimReward = async (wallet: AnchorWallet) => {
  try {
    const provider = getProvider(wallet)
    const program = new anchor.Program(idl as anchor.Idl, idl.metadata.address, provider);
    const pool: any = await getPoolData(wallet, POOL_ADDR);
    const tx: Transaction = new Transaction();
    const stakeEntry = findStakeEntryId(POOL_ADDR, wallet?.publicKey)
    const payerAta = await getAssociatedTokenAddress(pool?.mint, wallet?.publicKey);
    const poolAta = await getAssociatedTokenAddress(pool?.mint, POOL_ADDR, true);

    const txn = await program.methods.claimTokens().accounts({
      stakePool: POOL_ADDR,
      poolTokenAccount: poolAta,
      stakeEntry: stakeEntry,
      stakeMint: pool?.mint,
      user: wallet.publicKey,
      userTokenAccount: payerAta,
      escrowTokenAccount: await FEE_WALLET_TOKEN_ACCOUNT,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    }).instruction()
    tx.add(txn)
    return tx
  } catch (e) {
    console.log(e)
  }
}


export const withdrawTokens = async (wallet: AnchorWallet, amount: number ) => {
  try {
    const provider = getProvider(wallet)
    const program = new anchor.Program(idl as anchor.Idl, idl.metadata.address, provider);
    const pool: any = await getPoolData(wallet, POOL_ADDR);

    const tx: Transaction = new Transaction();
    const payerAta = await getAssociatedTokenAddress(pool?.mint, wallet?.publicKey);
    const poolAta = await getAssociatedTokenAddress(pool?.mint, POOL_ADDR, true);

    const txn = await program.methods.withdrawTokens(
      new BN(amount),
    ).accounts({
      stakePool: POOL_ADDR,
      poolTokenAccount: poolAta,
      stakeMint: pool?.mint,
      user: wallet.publicKey,
      userTokenAccount: payerAta,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    }).instruction()
    tx.add(txn)
    return tx
  } catch (e) {
    console.log(e)
  }
}

export const depositeTokens = async (wallet: AnchorWallet, amount: number ) => {
  try {
    const provider = getProvider(wallet)
    const program = new anchor.Program(idl as anchor.Idl, idl.metadata.address, provider);
    const pool: any = await getPoolData(wallet, POOL_ADDR);

    const tx: Transaction = new Transaction();
    const payerAta = await getAssociatedTokenAddress(pool?.mint, wallet?.publicKey);
    const poolAta = await getAssociatedTokenAddress(pool?.mint, POOL_ADDR, true);

    const txn = await program.methods.depositeTokens(
      new anchor.BN(amount*TOKEN_LAMPORTS),
    ).accounts({
      stakePool: POOL_ADDR,
      poolTokenAccount: poolAta,
      stakeMint: pool?.mint,
      user: wallet.publicKey,
      userTokenAccount: payerAta,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    }).instruction()
    tx.add(txn)
    return tx
  } catch (e) {
    console.log(e)
  }
}

export const updateOwner = async (wallet: AnchorWallet, newOwner: PublicKey ) => {
  try {
    const provider = getProvider(wallet)
    const program = new anchor.Program(idl as anchor.Idl, idl.metadata.address, provider);

    const tx: Transaction = new Transaction();

    const txn = await program.methods.transferOwner(
      newOwner
    ).accounts({
      stakePool: POOL_ADDR,
      user: wallet.publicKey,
      systemProgram: SystemProgram.programId,
    }).instruction()
    tx.add(txn)
    return tx
  } catch (e) {
    console.log(e)
  }
}

export const initStakePoolEntry = async (wallet: AnchorWallet, poolId: PublicKey, stakeEntryId: PublicKey) => {

  const provider = getProvider(wallet)
  const program = new anchor.Program(idl as anchor.Idl, idl.metadata.address, provider);

  const txn: TransactionInstruction = await program.methods.initEntry().accounts({
    stakeEntry: stakeEntryId,
    stakePool: poolId,
    payer: wallet.publicKey,
    systemProgram: SystemProgram.programId,
  }).instruction();

  return txn

}

export const STAKE_ENTRY_SEED = "stake-entry";
export const findStakeEntryId = (
  stakePoolId: PublicKey,
  user: PublicKey,
): PublicKey => {
  return PublicKey.findProgramAddressSync(
    [
      anchor.utils.bytes.utf8.encode(STAKE_ENTRY_SEED),
      stakePoolId.toBuffer(),
      user.toBuffer()
    ],
    new PublicKey(idl.metadata.address),
  )[0];
};

export const getErrorMessageFromFormattedString = (errorString: string) => {
  const match = errorString.match(/custom program error: 0x([0-9a-fA-F]+)/);

  if (match && match[1]) {
    const hexErrorCode = match[1];
    const errorCode = parseInt(hexErrorCode, 16);
    console.log(errorCode)
    let errorMessage = "";
    if (errorCode === 1 || errorCode === 3012) {
      errorMessage = "Not Enough Balance in Wallet";
    } else {
      errorMessage = getErrorMessage(errorCode);
    }

    return errorMessage || "Error message not found for the provided error code";
  } else {
    return errorString;
  }
}

function getErrorMessage(errorCode: number) {
  const errorCodes = idl.errors;
  const error = errorCodes.find(err => err.code === errorCode);
  return error ? error.msg : "Unknown error code";
}
