"use client";
import {
  AnchorProvider,
  Program,
  getProvider,
  web3,
} from "@project-serum/anchor";
import { HamburgerMenu } from "./HamburgerMenu";
import Helmet from "react-helmet";
import * as artifacts from "../../../types/staking";
import "../../../public/style.css";
import "../../../public/css/font-icons.css";
import "../../../public/css/animate.css";
import "../../../public/css/magnific-popup.css";
import "../../../public/demos/photographer/css/menu.css";
import "../../../public/demos/photographer/photographer.css";
import "../../../public/dashboardstyle.css";
import {
  ConnectionProvider,
  WalletProvider,
  useAnchorWallet,
  useConnection,
  useWallet,
} from "@solana/wallet-adapter-react";
import {
  WalletModalProvider,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import { useEffect, useRef, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { STAKING_PROGRAM_ID } from "../../../program/program-id";
import {
  createStakeIx,
  createUnstakeIx,
  createClaimRewardsIx,
  setProgram,
  setAdapter,
  createStakeEntryIx,
} from "../../../program/instructions";
import { tokenAmount } from "../../../program/utils";
import { sendTransaction } from "./hooks";
import { AppState } from "./state";
import { getPhantomAdapter } from "./walletAdapter";
import {
  getAccount,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  setAuthority,
  createSetAuthorityInstruction,
  AuthorityType,
} from "@solana/spl-token";
import { render } from "@/render";
import { calculateStakeEntryPda } from "../../../program/pda";
import { PublicKey, sendAndConfirmRawTransaction, Transaction } from "@solana/web3.js";
import { toast } from "react-toastify";
import { connection } from "../../../interaction/environment";
import { claimReward, depositeTokens, getErrorMessageFromFormattedString, getWalletStakes, initStakePool, stakeTokens, TOKEN_ADDRESS, TOKEN_LAMPORTS, unstakeTokens, updateOwner, withdrawTokens } from "../../../interaction/staking-func";
require("@solana/wallet-adapter-react-ui/styles.css");
//import '../public/demos/photographer/css/fonts.css'

export const WalletMultiButtonDynamic = dynamic(
  async () =>
    (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);

export interface ITokenBalance {
  tokenSymbol: string;
  balance: number;
}

export default function Home() {
  const { publicKey, connected } = useWallet();
  const [poolAmount, setPoolAmount] = useState<number>(0)
  const [refetch, setRefetch] = useState<boolean>(false);
  const [withdrawAmount, setWithdrawAmount] = useState<number>(0);
  const [depositeAmount, setDepositeAmount] = useState<number>(0);

  const [newOwner, setNewOwner] = useState<string>("")
  const [newTokenOwner, setNewTokenOwner] = useState<string>("")


  function getProgram({ wallet }: any) {
    const provider = new AnchorProvider(AppState.connection, wallet, {});
    return new Program(artifacts.IDL, STAKING_PROGRAM_ID, provider);     //ABI , ADDRESS, RPC
  }
  const wallet = useAnchorWallet();
  const adapter = useAnchorWallet();


  const [isOpen, setIsOpen] = useState(false);

  const poolInit = async () => {
    try {
      if (!wallet) {
        toast.error("Please connect wallet");
        return
      }

      if (wallet) {
        const tx: Transaction | undefined = await initStakePool(wallet, poolAmount);

        if (!tx) {
          return
        }
        tx.feePayer = wallet.publicKey
        tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash
        const signedTx = await wallet.signTransaction(tx)
        const txId = await sendAndConfirmRawTransaction(connection, signedTx.serialize())
        toast.success("Pool Initialized")
        console.log('signature', txId)
        // setRefetch(!refetch)
      }
    } catch (e: any) {
      console.log(e)
      const error = getErrorMessageFromFormattedString(e.message)
      toast.error(error)
    }
  }

  const withdraw = async () => {
    try {
      if (!wallet) {
        toast.error("Please connect wallet");
        return
      }

      if (wallet) {
        const tx: Transaction | undefined = await withdrawTokens(wallet, withdrawAmount);

        if (!tx) {
          return
        }
        tx.feePayer = wallet.publicKey
        tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash
        const signedTx = await wallet.signTransaction(tx)
        const txId = await sendAndConfirmRawTransaction(connection, signedTx.serialize())
        toast.success("Tokens Withdraw Succesful")
        console.log('signature', txId)
        setRefetch(!refetch)
      }
    } catch (e: any) {
      console.log(e)
      const error = getErrorMessageFromFormattedString(e.message)
      toast.error(error)
    }
  }

  const deposite = async () => {
    try {
      if (!wallet) {
        toast.error("Please connect wallet");
        return
      }

      if (wallet) {
        const tx: Transaction | undefined = await depositeTokens(wallet, depositeAmount);

        if (!tx) {
          return
        }
        tx.feePayer = wallet.publicKey
        tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash
        const signedTx = await wallet.signTransaction(tx)
        const txId = await sendAndConfirmRawTransaction(connection, signedTx.serialize())
        toast.success("Tokens Deposite Succesful")
        console.log('signature', txId)
        setRefetch(!refetch)
      }
    } catch (e: any) {
      console.log(e)
      const error = getErrorMessageFromFormattedString(e.message)
      toast.error(error)
    }
  }

  const transferOwner = async () => {
    try {
      if (!wallet) {
        toast.error("Please connect wallet");
        return
      }
      if (!newOwner) {
        toast.error("Please Enter new owner");
        return
      }
      const key = new PublicKey(newOwner);
      if(!PublicKey.isOnCurve(key.toBytes())){
        toast.error("Please Enter a valid pubkey");
        return
      }
      if (wallet) {
        const tx: Transaction | undefined = await updateOwner(wallet, key);

        if (!tx) {
          return
        }
        tx.feePayer = wallet.publicKey
        tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash
        const signedTx = await wallet.signTransaction(tx)
        const txId = await sendAndConfirmRawTransaction(connection, signedTx.serialize())
        toast.success("Owner Update Succesful")
        console.log('signature', txId)
        setRefetch(!refetch)
      }
    } catch (e: any) {
      console.log(e)
      const error = getErrorMessageFromFormattedString(e.message)
      toast.error(error)
    }
  }


  const transferTokenOwner = async () => {
    try {
      if (!wallet) {
        toast.error("Please connect wallet");
        return
      }

      if (!newTokenOwner) {
        toast.error("Please Enter new owner");
        return
      }
      const key = new PublicKey(newTokenOwner);
      if(!PublicKey.isOnCurve(key.toBytes())){
        toast.error("Please Enter a valid pubkey");
        return
      }
      if (wallet) {
        let tx = new Transaction().add(
          createSetAuthorityInstruction(
            TOKEN_ADDRESS, // mint acocunt || token account
            wallet.publicKey, // current auth
            AuthorityType.MintTokens, // authority type
            new PublicKey(newTokenOwner), // new auth (you can pass `null` to close it)
          ),
        );

        tx.feePayer = wallet.publicKey
        tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash
        const signedTx = await wallet.signTransaction(tx)
        const txId = await sendAndConfirmRawTransaction(connection, signedTx.serialize())
        toast.success("Owner Update Succesful")
        console.log('signature', txId)
        setRefetch(!refetch)
      }
    } catch (e: any) {
      console.log(e)
      const error = getErrorMessageFromFormattedString(e.message)
      toast.error(error)
    }
  }



  useEffect(() => {
    // Hide mobile menu when a link is clicked
    const links = document.querySelectorAll(".mobile-menu a");
    links.forEach((link) => {
      link.addEventListener("click", () => {
        setIsOpen(false);
      });
    });
  }, []);

  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: any) {
      if (
        mobileMenuRef.current &&
        !event.target.matches(".hamburger-menu") &&
        !event.target.matches(".mobile-menu a") &&
        !event.target.matches(".mobile-menu") &&
        !event.target.matches(".hamburger-menu-open")
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);


  return (
    <div id="wrapper" className="clearfix">
      {/* Document Wrapper ============================================= */}
      <div id="wrapper" className="clearfix">
        <WalletMultiButtonDynamic />

        <div>
          <div className="init-pool">
            <input type="number" className="border border-2 border-black p-1 mt-2 rounded" placeholder="0" onChange={(e) => { setPoolAmount(parseFloat(e.target.value)) }} />
            <button
              className="unstake-button p-2 rounded"
              id="unstake"
              onClick={poolInit}
            >
              Pool Initialize
            </button>
          </div>

          <div className="init-pool">
            <input type="number" className="border border-2 border-black p-1 mt-2 rounded" placeholder="0" onChange={(e) => { setWithdrawAmount(parseFloat(e.target.value)) }} />
            <button
              className="unstake-button p-2 rounded"
              id="unstake"
              onClick={withdraw}
            >
              Withdraw Tokens
            </button>
          </div>

          <div className="init-pool">
            <input type="number" className="border border-2 border-black p-1 mt-2 rounded" placeholder="0" onChange={(e) => { setDepositeAmount(parseFloat(e.target.value)) }} />
            <button
              className="unstake-button p-2 rounded"
              id="unstake"
              onClick={deposite}
            >
              Deposite Amount
            </button>
          </div>

          <div className="init-pool">
            <input type="text" className="border border-2 border-black p-1 mt-2 rounded" placeholder="0" onChange={(e) => { setNewOwner(e.target.value) }} />
            <button
              className="unstake-button p-2 rounded"
              id="unstake"
              onClick={transferOwner}
            >
              Transfer Owner
            </button>
          </div>

          {/* <div className="init-pool">
            <input type="text" className="border border-2 border-black p-1 mt-2 rounded" placeholder="0" onChange={(e) => { setNewTokenOwner(e.target.value) }} />
            <button
              className="unstake-button p-2 rounded"
              id="unstake"
              onClick={transferTokenOwner}
            >
              Transfer Token Owner
            </button>
          </div> */}
        </div>
      </div>
      {/* #wrapper end */}
      {/* Go To Top
            ============================================= */}
      <div id="gotoTop" className="icon-angle-up bgcolor"></div>
      {/* Walletscript ========================================== */}{" "}
      {/* External JavaScripts ============================================= */}
      <script src="js/jquery.js"></script>
      <script src="js/plugins.js"></script>
      {/* Photograph Hover Plugin =============================================
       */}
      <script src="demos/writer/js/hover3d.js"></script>
      {/* Menu Open Plugin ============================================= */}
      <script src="demos/photographer/js/menu-easing.js"></script>
      {/* Footer Scripts ============================================= */}
      <script src="js/functions.js"></script>
      <script
        dangerouslySetInnerHTML={{
          __html: `
                  // Hover Script
                  jQuery(".img-hover-wrap").hover3d({
                    selector: ".img-hover-card",
                    shine: false,
                  });
                `,
        }}
      ></script>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/skrollr/0.6.30/skrollr.min.js"></script>
      <script
        dangerouslySetInnerHTML={{
          __html: `
                  !SEMICOLON.Mobile.any() && skrollr.init({forceHeight: false});
                `,
        }}
      ></script>
      {/* HotSpot */}
      <script src="js/jquery.hotspot.js"></script>
      {/* Range Slider */}
      <script src="js/components/rangeslider.min.js"></script>
      <script src="js/plugins.min.js"></script>
      {/* Charts JS ============================================= */}
      <script src="js/chart.js"></script>
      <script src="js/chart-utils.js"></script>
      <script
        dangerouslySetInnerHTML={{
          __html: `jQuery(document).ready(function() {
                  document.addEventListener("DOMContentLoaded", function() {
                  var config = {
                    type: 'doughnut',
                    data: {
                      datasets: [
                        {
                          data: [20, 55, 10, 15],
                          backgroundColor: [
                            window.chartColors.red,
                            window.chartColors.yellow,
                            window.chartColors.green,
                            window.chartColors.blue,
                          ],
                          label: 'Dataset 1',
                        },
                      ],
                      labels: ['Airdrops', 'Verkauf', 'Stakingrewards', 'Team'],
                    },
                    options: {
                      responsive: true,
                      legend: {
                        position: 'top',
                      },
                      title: {
                        display: true,
                        text: '',
                      },
                      animation: {
                        animateScale: true,
                        animateRotate: true,
                      },
                    },
                  };

                  window.onload = function () {
                    var ctx = document.getElementById('chart-0').getContext('2d');
                    window.myDoughnut = new Chart(ctx, config);
                  };

                  document
                    .getElementById('randomizeData')
                    .addEventListener('click', function () {
                      config.data.datasets.forEach(function (dataset) {
                        dataset.data = dataset.data.map(function () {
                          return randomScalingFactor();
                        });
                      });

                      window.myDoughnut.update();
                    });

                  var colorNames = Object.keys(window.chartColors);
                  document
                    .getElementById('addDataset')
                    .addEventListener('click', function () {
                      var newDataset = {
                        backgroundColor: [],
                        data: [],
                        label: 'New dataset ' + config.data.datasets.length,
                      };

                      for (var index = 0; index < config.data.labels.length; ++index) {
                        newDataset.data.push(randomScalingFactor());

                        var colorName = colorNames[index % colorNames.length];
                        var newColor = window.chartColors[colorName];
                        newDataset.backgroundColor.push(newColor);
                      }

                      config.data.datasets.push(newDataset);
                      window.myDoughnut.update();
                    });

                  document.getElementById('addData').addEventListener('click', function () {
                    if (config.data.datasets.length > 0) {
                      config.data.labels.push('data #' + config.data.labels.length);

                      var colorName =
                        colorNames[config.data.datasets[0].data.length % colorNames.length];
                      var newColor = window.chartColors[colorName];

                      config.data.datasets.forEach(function (dataset) {
                        dataset.data.push(randomScalingFactor());
                        dataset.backgroundColor.push(newColor);
                      });

                      window.myDoughnut.update();
                    }
                  });

                  document
                    .getElementById('removeDataset')
                    .addEventListener('click', function () {
                      config.data.datasets.splice(0, 1);
                      window.myDoughnut.update();
                    });

                  document
                    .getElementById('removeData')
                    .addEventListener('click', function () {
                      config.data.labels.splice(-1, 1); // remove the label first

                      config.data.datasets.forEach(function (dataset) {
                        dataset.data.pop();
                        dataset.backgroundColor.pop();
                      });

                      window.myDoughnut.update();
                    });
                  })
                })
                `,
        }}
      ></script>
    </div>
  );
}
