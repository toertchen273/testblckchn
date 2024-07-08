import { program } from "../program/instructions";
import { fromTokenAmount } from "../program/utils";
import { loadState } from "./loadState";
import { AppState } from "./state";
import { WmpStaking } from "../target/types/wmp_staking";

export async function render() {
    console.log('debug app AppState.adapter', AppState.adapter)
    await loadState();
    console.log('debug after loadState')
    renderInternal();
}

function renderInternal() {
    console.log("debug renderInternal 1  ")
    showStakingUi();
    showTokenAData();
    // showTokenBData();  
    if (AppState.stakeEntryData.stakeBalance > 0) {
        showRewardsCalculationWidget();
        showMonthlyRewardsCalculationWidget();
        showDailylyRewardsCalculationWidget();
        showWeeklyRewardsCalculationWidget();
        showYearlyRewardsCalculationWidget();
        show24hRewardsCalculationWidget();

    }
}

function showConnectWallet() {
    (document.querySelector("#connect-wallet") as HTMLElement).style.display = "block";
    (document.querySelector("#wallet-connected") as HTMLElement).style.display = "none";
}

function showStakingUi() {
    (document.querySelector("#wallet-connected") as HTMLElement).style.display = "block";
    console.log("debug stakeEntryData", AppState.stakeEntryData)
    if (AppState.stakeEntryData) {
        (document.querySelector("#stake-amount") as HTMLDataElement).textContent = AppState.stakeEntryData.stakeBalance.toFixed(2) + " ";
        (document.querySelector("#claimed-rewards") as HTMLDataElement).textContent = AppState.stakeEntryData.claimedReward.toFixed(2) + " ";
        // (document.querySelector("#rewards-amount") as HTMLDataElement).textContent = AppState.stakeEntryData.rewards + " xWMP";
        // (document.querySelector("#b-escrow") as HTMLDataElement).textContent = AppState.stakePoolData.xWmpEscrow.toBase58();
    }
}

function showTokenAData() {
    if (AppState.tokenABalance) {
        (document.querySelector("#a-amount") as HTMLDataElement).textContent = AppState.tokenABalance.balance.toFixed(2) + "  ";
    }
}

function showTokenBData() {
    if (AppState.tokenBBalance) {
        (document.querySelector("#b-amount") as HTMLDataElement).textContent = AppState.tokenBBalance.balance.toFixed(2) + "  ";
    }
}

function showRewardsCalculationWidget() {
    setInterval(async () => {
        let rewards = await calcEstimatedRewards();
        (document.querySelector("#estimated-rewards") as HTMLDataElement).textContent = rewards?.toFixed(2) + " ";
    }, 5000);
}



function show24hRewardsCalculationWidget() {
    if (AppState.tokenABalance) {
        (document.querySelector("#estimated-rewards-24h") as HTMLDataElement).textContent = ((AppState.stakeEntryData.stakeBalance ?? 0) * 0.00398).toFixed(2) + "  ";
    }
}

function showMonthlyRewardsCalculationWidget() {
    if (AppState.stakeEntryData.stakeBalance) {
        (document.querySelector("#monthly-a-amount") as HTMLDataElement).textContent = ((AppState.stakeEntryData.stakeBalance ?? 0) * 0.1196).toFixed(2) + "  ";
}
}

function showDailylyRewardsCalculationWidget() {
    if (AppState.stakeEntryData.stakeBalance) {
        (document.querySelector("#daily-a-amount") as HTMLDataElement).textContent = ((AppState.stakeEntryData.stakeBalance ?? 0) * 0.00398).toFixed(2) + "  ";
}
}

function showWeeklyRewardsCalculationWidget() {
    if (AppState.stakeEntryData.stakeBalance) {
        (document.querySelector("#weekly-a-amount") as HTMLDataElement).textContent = ((AppState.stakeEntryData.stakeBalance ?? 0) * 0.0279).toFixed(2) + "  ";
}
}

function showYearlyRewardsCalculationWidget() {
    if (AppState.stakeEntryData.stakeBalance) {
        (document.querySelector("#yearly-a-amount") as HTMLDataElement).textContent = ((AppState.stakeEntryData.stakeBalance ?? 0) * 1.4511).toFixed(2) + "  ";
}
}

async function calcEstimatedRewards() {
    let stakePoolData = await program.account.stakePool.fetchNullable(AppState.stakePoolAddress);
    let stakeEntryData = await program.account.stakeEntry.fetchNullable(AppState.stakeEntryAddress);
    console.log("debug:rewardperToken", stakeEntryData?.rewardsPerTokenPaid.toString())

    if (stakePoolData && stakeEntryData) {
        let interval = (Date.now() / 1e3) - stakePoolData.lastUpdateTimestamp.toNumber();
        let rewardsPerToken = fromTokenAmount(stakePoolData.rewardsPerTokenStored) +
            (interval * 461419 / 100000 / 100000000);
        // (interval * fromTokenAmount(stakePoolData.rewardsPerSecond) / fromTokenAmount(stakePoolData.balance));
       
        let rewards = fromTokenAmount(stakeEntryData.rewards) + (rewardsPerToken - fromTokenAmount(stakeEntryData.rewardsPerTokenPaid)) * fromTokenAmount(stakeEntryData.balance);

        return rewards;
    }
}





