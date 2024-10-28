use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    program_error::ProgramError,
    pubkey::Pubkey,
    program_pack::{Pack, Sealed},
    program::invoke,
    sysvar::{clock::Clock, Sysvar},
};

use spl_token::state::Account as TokenAccount;
use std::convert::TryInto;

const ACCEPTED_TOKEN_MINT: &str = "AdaEUjSPakTbCMDZeyBw76qBrod8YGUad3t4dVmkmGHz";
const ADMIN_ADDRESS: &str = "439rQ59KMtfstUHtpfTzf1BTRETcHkiyFdqRDNJjNsLS";
const SECONDS_IN_A_DAY: u64 = 24 * 60 * 60;

#[derive(Clone, Debug, Default, PartialEq)]
pub struct StakingInfo {
    pub amount: u64,
    pub start_time: u64,
    pub rewards: u64,
    pub monthly_rate: f64,
    pub last_claim_time: u64,
    pub pending_amount: u64,
    pub stake_ready_time: u64,
    pub unstake_ready_time: u64,
    pub claim_ready_time: u64,
    pub auto_stake_rewards: bool,
}

impl Sealed for StakingInfo {}
impl Pack for StakingInfo {
    const LEN: usize = 73;

    fn pack_into_slice(&self, dst: &mut [u8]) {
        let amount = self.amount.to_le_bytes();
        let start_time = self.start_time.to_le_bytes();
        let rewards = self.rewards.to_le_bytes();
        let monthly_rate = self.monthly_rate.to_le_bytes();
        let last_claim_time = self.last_claim_time.to_le_bytes();
        let pending_amount = self.pending_amount.to_le_bytes();
        let stake_ready_time = self.stake_ready_time.to_le_bytes();
        let unstake_ready_time = self.unstake_ready_time.to_le_bytes();
        let claim_ready_time = self.claim_ready_time.to_le_bytes();
        let auto_stake_rewards = self.auto_stake_rewards as u8;

        dst[0..8].copy_from_slice(&amount);
        dst[8..16].copy_from_slice(&start_time);
        dst[16..24].copy_from_slice(&rewards);
        dst[24..32].copy_from_slice(&monthly_rate);
        dst[32..40].copy_from_slice(&last_claim_time);
        dst[40..48].copy_from_slice(&pending_amount);
        dst[48..56].copy_from_slice(&stake_ready_time);
        dst[56..64].copy_from_slice(&unstake_ready_time);
        dst[64..72].copy_from_slice(&claim_ready_time);
        dst[72] = auto_stake_rewards;
    }

    fn unpack_from_slice(src: &[u8]) -> Result<Self, ProgramError> {
        let amount = u64::from_le_bytes(src[0..8].try_into().unwrap());
        let start_time = u64::from_le_bytes(src[8..16].try_into().unwrap());
        let rewards = u64::from_le_bytes(src[16..24].try_into().unwrap());
        let monthly_rate = f64::from_le_bytes(src[24..32].try_into().unwrap());
        let last_claim_time = u64::from_le_bytes(src[32..40].try_into().unwrap());
        let pending_amount = u64::from_le_bytes(src[40..48].try_into().unwrap());
        let stake_ready_time = u64::from_le_bytes(src[48..56].try_into().unwrap());
        let unstake_ready_time = u64::from_le_bytes(src[56..64].try_into().unwrap());
        let claim_ready_time = u64::from_le_bytes(src[64..72].try_into().unwrap());
        let auto_stake_rewards = src[72] != 0;

        Ok(StakingInfo {
            amount,
            start_time,
            rewards,
            monthly_rate,
            last_claim_time,
            pending_amount,
            stake_ready_time,
            unstake_ready_time,
            claim_ready_time,
            auto_stake_rewards,
        })
    }
}

entrypoint!(process_instruction);

fn process_instruction(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let (instruction, amount) = instruction_data.split_first().ok_or(ProgramError::InvalidInstructionData)?;
    match instruction {
        0 => stake(accounts, u64::from_le_bytes(amount.try_into().unwrap())),
        1 => unstake(accounts, u64::from_le_bytes(amount.try_into().unwrap())),
        2 => claim(accounts),
        3 => distribute_rewards(accounts),
        4 => update_monthly_rate(accounts, f64::from_le_bytes(amount.try_into().unwrap())),
        5 => set_auto_stake_rewards(accounts, amount[0] != 0),
        _ => Err(ProgramError::InvalidInstructionData),
    }
}

fn stake(
    accounts: &[AccountInfo],
    amount: u64,
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();

    let user_account = next_account_info(accounts_iter)?;
    let user_token_account = next_account_info(accounts_iter)?;
    let staking_account = next_account_info(accounts_iter)?;
    let token_program = next_account_info(accounts_iter)?;
    let token_mint_account = next_account_info(accounts_iter)?;
    let clock_sysvar = next_account_info(accounts_iter)?;

    if token_mint_account.key.to_string() != ACCEPTED_TOKEN_MINT {
        return Err(ProgramError::InvalidAccountData);
    }

    let user_token_state: TokenAccount = TokenAccount::unpack(&user_token_account.data.borrow())?;
    if &user_token_state.mint != token_mint_account.key {
        return Err(ProgramError::InvalidAccountData);
    }

    let transfer_instruction = spl_token::instruction::transfer(
        token_program.key,
        user_token_account.key,
        staking_account.key,
        user_account.key,
        &[],
        amount,
    )?;
    invoke(
        &transfer_instruction,
        &[
            user_token_account.clone(),
            staking_account.clone(),
            user_account.clone(),
            token_program.clone(),
        ],
    )?;

    let mut staking_info = if staking_account.data_is_empty() {
        StakingInfo {
            amount: 0,
            start_time: 0,
            rewards: 0,
            monthly_rate: 11.96,
            last_claim_time: 0,
            pending_amount: amount,
            stake_ready_time: current_timestamp(clock_sysvar)? + SECONDS_IN_A_DAY,
            unstake_ready_time: 0,
            claim_ready_time: 0,
            auto_stake_rewards: false,
        }
    } else {
        StakingInfo::unpack_from_slice(&staking_account.data.borrow())?
    };

    staking_info.pending_amount += amount;
    staking_info.stake_ready_time = current_timestamp(clock_sysvar)? + SECONDS_IN_A_DAY;

    StakingInfo::pack_into_slice(&staking_info, &mut staking_account.data.borrow_mut());

    Ok(())
}

fn unstake(
    accounts: &[AccountInfo],
    amount: u64,
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();

    let user_account = next_account_info(accounts_iter)?;
    let user_token_account = next_account_info(accounts_iter)?;
    let staking_account = next_account_info(accounts_iter)?;
    let token_program = next_account_info(accounts_iter)?;
    let clock_sysvar = next_account_info(accounts_iter)?;

    let mut staking_info = StakingInfo::unpack_from_slice(&staking_account.data.borrow())?;
    let current_time = current_timestamp(clock_sysvar)?;

    if staking_info.unstake_ready_time == 0 || current_time < staking_info.unstake_ready_time {
        return Err(ProgramError::Custom(1));
    }

    if staking_info.amount < amount {
        return Err(ProgramError::InsufficientFunds);
    }

    staking_info.rewards += calculate_rewards(staking_info.amount, staking_info.start_time, staking_info.monthly_rate, clock_sysvar)?;
    staking_info.amount -= amount;
    staking_info.unstake_ready_time = current_timestamp(clock_sysvar)? + SECONDS_IN_A_DAY;

    StakingInfo::pack_into_slice(&staking_info, &mut staking_account.data.borrow_mut());

    let transfer_instruction = spl_token::instruction::transfer(
        token_program.key,
        staking_account.key,
        user_token_account.key,
        user_account.key,
        &[],
        amount,
    )?;
    invoke(
        &transfer_instruction,
        &[
            staking_account.clone(),
            user_token_account.clone(),
            user_account.clone(),
            token_program.clone(),
        ],
    )?;

    Ok(())
}

fn claim(
    accounts: &[AccountInfo],
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();

    let user_account = next_account_info(accounts_iter)?;
    let user_token_account = next_account_info(accounts_iter)?;
    let staking_account = next_account_info(accounts_iter)?;
    let token_program = next_account_info(accounts_iter)?;
    let clock_sysvar = next_account_info(accounts_iter)?;

    let mut staking_info = StakingInfo::unpack_from_slice(&staking_account.data.borrow())?;
    let current_time = current_timestamp(clock_sysvar)?;

    if staking_info.claim_ready_time == 0 || current_time < staking_info.claim_ready_time {
        return Err(ProgramError::Custom(2));
    }

    let rewards = staking_info.rewards;
    staking_info.rewards = 0;
    staking_info.claim_ready_time = current_timestamp(clock_sysvar)? + SECONDS_IN_A_DAY;

    StakingInfo::pack_into_slice(&staking_info, &mut staking_account.data.borrow_mut());

    let transfer_instruction = spl_token::instruction::transfer(
        token_program.key,
        staking_account.key,
        user_token_account.key,
        user_account.key,
        &[],
        rewards,
    )?;
    invoke(
        &transfer_instruction,
        &[
            staking_account.clone(),
            user_token_account.clone(),
            user_account.clone(),
            token_program.clone(),
        ],
    )?;

    Ok(())
}

fn distribute_rewards(
    accounts: &[AccountInfo],
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();

    let staking_account = next_account_info(accounts_iter)?;
    let clock_sysvar = next_account_info(accounts_iter)?;
    let user_account = next_account_info(accounts_iter)?;
    let user_token_account = next_account_info(accounts_iter)?;
    let token_program = next_account_info(accounts_iter)?;

    let mut staking_info = StakingInfo::unpack_from_slice(&staking_account.data.borrow())?;
    let current_time = current_timestamp(clock_sysvar)?;

    if current_time - staking_info.last_claim_time < SECONDS_IN_A_DAY {
        return Err(ProgramError::Custom(3));
    }

    staking_info.rewards += calculate_rewards(staking_info.amount, staking_info.start_time, staking_info.monthly_rate, clock_sysvar)?;
    staking_info.last_claim_time = current_time;

    if staking_info.auto_stake_rewards {
        staking_info.amount += staking_info.rewards;
        staking_info.rewards = 0;
    } else {
        // Transfer rewards to user account
        let transfer_instruction = spl_token::instruction::transfer(
            token_program.key,
            staking_account.key,
            user_token_account.key,
            user_account.key,
            &[],
            staking_info.rewards,
        )?;
        invoke(
            &transfer_instruction,
            &[
                staking_account.clone(),
                user_token_account.clone(),
                user_account.clone(),
                token_program.clone(),
            ],
        )?;
    }

    StakingInfo::pack_into_slice(&staking_info, &mut staking_account.data.borrow_mut());

    Ok(())
}

fn set_auto_stake_rewards(
    accounts: &[AccountInfo],
    auto_stake: bool,
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();

    let user_account = next_account_info(accounts_iter)?;
    let staking_account = next_account_info(accounts_iter)?;

    let mut staking_info = StakingInfo::unpack_from_slice(&staking_account.data.borrow())?;

    if staking_account.owner != user_account.key {
        return Err(ProgramError::IllegalOwner);
    }

    staking_info.auto_stake_rewards = auto_stake;
    StakingInfo::pack_into_slice(&staking_info, &mut staking_account.data.borrow_mut());

    Ok(())
}

fn update_monthly_rate(
    accounts: &[AccountInfo],
    new_rate: f64,
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();

    let admin_account = next_account_info(accounts_iter)?;
    let staking_account = next_account_info(accounts_iter)?;

    if admin_account.key.to_string() != ADMIN_ADDRESS {
        return Err(ProgramError::InvalidAccountData);
    }

    let mut staking_info = StakingInfo::unpack_from_slice(&staking_account.data.borrow())?;
    staking_info.monthly_rate = new_rate;

    StakingInfo::pack_into_slice(&staking_info, &mut staking_account.data.borrow_mut());

    Ok(())
}

fn calculate_rewards(amount: u64, start_time: u64, monthly_rate: f64, clock_sysvar: &AccountInfo) -> Result<u64, ProgramError> {
    const SECONDS_IN_MONTH: u64 = 30 * 24 * 60 * 60;
    let current_time = current_timestamp(clock_sysvar)?;
    let elapsed_time = current_time - start_time;

    let monthly_rewards = amount as f64 * (monthly_rate / 100.0);
    let rewards_per_second = monthly_rewards / SECONDS_IN_MONTH as f64;
    Ok((rewards_per_second * elapsed_time as f64) as u64)
}

fn current_timestamp(clock_sysvar: &AccountInfo) -> Result<u64, ProgramError> {
    let clock = Clock::from_account_info(clock_sysvar)?;
    Ok(clock.unix_timestamp as u64)
}
