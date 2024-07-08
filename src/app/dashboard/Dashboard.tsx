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
} from "@solana/spl-token";
import { render } from "@/render";
import { calculateStakeEntryPda } from "../../../program/pda";
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
  
  function getProgram({ wallet }: any) {
    const provider = new AnchorProvider(AppState.connection, wallet, {});
    return new Program(artifacts.IDL, STAKING_PROGRAM_ID, provider);     //ABI , ADDRESS, RPC
  }
  const wallet = useAnchorWallet();
  const adapter = useAnchorWallet();

  // const program = new Program<artifacts.WmpStaking>(artifacts.IDL, STAKING_PROGRAM_ID);
  const stakeIBIT = async () => {
    const program = getProgram({ wallet });
    let amount = parseFloat(
      (document.getElementById("stake_input") as HTMLInputElement).value
    );
    console.log("debug tokenAAddress", AppState.stakePoolAddress.toBase58())
    if (adapter && publicKey && wallet) {
      let [stakeEntryAddress, _] = await calculateStakeEntryPda(publicKey, AppState.stakePoolAddress);
      let stakeEntry = await program.account.stakeEntry.fetchNullable(stakeEntryAddress);
      let tx = new web3.Transaction();
      if (stakeEntry == null) {
          let stakeEntryIx = await createStakeEntryIx(publicKey, AppState.stakePoolAddress);
          tx.add(stakeEntryIx);
      }
    let stakeIx = await createStakeIx(
        publicKey,
        AppState.tokenAAddress,
        tokenAmount(amount),
        AppState.stakePoolAddress
      );
      tx.add(stakeIx);
      let hash = await sendTransaction(tx, publicKey, adapter, AppState.connection);
      await AppState.connection.confirmTransaction(hash);
      render();
    }
  };

  const unstakeIBIT = async () => {
    let amount = parseFloat(
      (document.getElementById("unstake_input") as HTMLInputElement).value
    );
    if (adapter && publicKey && wallet) {
      let tx = new web3.Transaction();
      let unstakeIx = await createUnstakeIx(
        publicKey,
        AppState.tokenAAddress,
        tokenAmount(amount),
        AppState. stakePoolAddress
      );
      tx.add(unstakeIx);
      let hash = await sendTransaction(tx, publicKey, adapter, AppState.connection);
      await AppState.connection.confirmTransaction(hash);
      render();
    }
  };

  const getRewards = async () => {
    let tx = new web3.Transaction();
    console.log("debug tokenbalance", AppState.tokenBBalance, AppState.tokenABalance)
    // if (!AppState.tokenBBalance && publicKey) {
    //   let associatedAddress = await getAssociatedTokenAddress(
    //     AppState.tokenBAddress,
    //     publicKey
    //   );
    //   let ix = createAssociatedTokenAccountInstruction(
    //     publicKey,
    //     associatedAddress,
    //     publicKey,
    //     AppState.tokenBAddress
    //   );
    //   tx.add(ix);
    // }
    if (adapter && publicKey && wallet) {
      let ix = await createClaimRewardsIx(
        publicKey,
        AppState.tokenBAddress,
        AppState.stakePoolAddress
      );
      tx.add(ix);

      let hash = await sendTransaction(tx, publicKey, adapter, AppState.connection);
      await AppState.connection.confirmTransaction(hash);
      render();
    }
  };

  //  useEffect(() => {
  //   AppState.adapter = adapter;
  //  }, [adapter])

  useEffect(() => {
    if (connected) {
      const program = getProgram({ wallet });
      setProgram(program);
      setAdapter(adapter);
      console.log("debug set adapter", adapter);
      render();
    }
  }, [connected]);

  const navItems = [
    {
      href: "/index.html",
      title: "IBIT TOKEN",
    },
    {
      href: "#",
      title: "ALLES ÜBER UNS",
    },
    {
      href: "/index.html#socialmedia",
      title: "\u00A0\u00A0\u00A0\u00A0Unsere sozialen Medien",
    },
    {
      href: "/roadmap.html#tokenomicsrmpage",
      title: "\u00A0\u00A0\u00A0\u00A0Tokenomics",
    },
    {
      href: "/wallet.html#walletpart",
      title: "\u00A0\u00A0\u00A0\u00A0Wallets",
    },
    {
      href: "/WPIBIT.pdf",
      title: "\u00A0\u00A0\u00A0\u00A0Unser Whitepaper",
    },
    {
      href: "/index.html#airdrops",
      title: "\u00A0\u00A0\u00A0\u00A0Airdrops",
    },
    {
      href: "/wallet.html",
      title: "\u00A0\u00A0\u00A0\u00A0IBIT Token staken",
    },
    {
      href: "/roadmap.html#roadmaprmpage",
      title: "ROADMAP",
    },
    {
      href: "/index.html#faqibit",
      title: "FAQS",
    },
    {
      href: "contact.html",
      title: "KONTAKT",
    },
  ];

  const [isOpen, setIsOpen] = useState(false);

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
      <Helmet>
        <meta httpEquiv="content-type" content="text/html; charset=utf-8" />
        <meta name="author" content="BRT" />
        <meta
          name="description"
          content="Developed to represent all of BlackRock's financial instruments in cryptocurrencies and to make them seamlessly accessible to every crypto user."
        />
        <link rel="shortcut icon" href="favicon.ico" type="image/x-icon" />

        {/* Stylesheets
              ============================================= */}
        {/* <link
          href="https://fonts.googleapis.com/css?family=Poppins:300,400,400i,500,600,700"
          rel="stylesheet"
          type="text/css"
        /> */}
        <link rel="stylesheet" href="css/bootstrap.css" type="text/css" />
        <link rel="stylesheet" href="/style.css" type="text/css" />
        <link rel="stylesheet" href="css/dark.css" type="text/css" />

        <link rel="stylesheet" href="css/font-icons.css" type="text/css" />
        <link
          rel="stylesheet"
          href="one-page/css/et-line.css"
          type="text/css"
        />
        <link rel="stylesheet" href="css/animate.css" type="text/css" />
        <link rel="stylesheet" href="css/magnific-popup.css" type="text/css" />

        <link
          rel="stylesheet"
          type="text/css"
          href="demos/photographer/css/menu.css"
        />

        <link rel="stylesheet" href="css/responsive.css" type="text/css" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        {/* Photographer Specific Stylesheet */}
        <link
          rel="stylesheet"
          href="demos/photographer/photographer.css"
          type="text/css"
        />
        <link rel="stylesheet" href="dashboardstyle.css" />
        {/* Photographer Specific Fonts */}
        <link
          rel="stylesheet"
          href="demos/photographer/css/fonts.css"
          type="text/css"
        />
        {/* / */}

        {/* Photographer Specific Color */}
        <link
          rel="stylesheet"
          href="css/colors.php?color=e41c34"
          type="text/css"
        />

        {/* JS Scripts for Walletintegration */}
        <script src="https://unpkg.com/@solana/web3.js@latest/dist/web3.min.js"></script>
        <script src="https://unpkg.com/@solana/wallet-adapter-wallets@latest/dist/wallet-adapter-wallets.umd.js"></script>
        <script src="https://unpkg.com/@solana/wallet-adapter-base@latest/dist/wallet-adapter-base.umd.js"></script>

        {/* Document Title
              ============================================= */}
        <title>BlackRock Token</title>
      </Helmet>
      {/* Document Wrapper ============================================= */}
      <div id="wrapper" className="clearfix">
        <header id="header" className="floating-header header-size-md">
          <div id="header-wrap">
            <div ref={mobileMenuRef}>
              <HamburgerMenu
                navItems={navItems}
                isOpen={isOpen}
                setIsOpen={setIsOpen}
              />
            </div>
            <div className="container">
              <div className="header-row">
                {/* Logo ============================================= */}
                <div id="logo">
                  <a href="/index.html/" style={{ color: "#000" }}>
                    {" "}
                    BlackRock Token{" "}
                  </a>
                </div>
                {/* #logo end */}

                <div className="header-misc">
                  <div className="wallet-info">
                    {/* <button
                            id="connect-wallet"
                            className="stake-button button button-rounded ms-3"
                          >
                            Wallet verbinden
                          </button> */}

                    <WalletMultiButtonDynamic />
                  </div>
                </div>

                {/* Primary Navigation
                      ============================================= */}
                <nav className="primary-menu with-arrows">
                  <ul className="menu-container">
                    <li className="menu-item">
                      <a className="menu-link" href="index.html">
                        <div>IBIT Token</div>
                      </a>
                    </li>
                    <li className="menu-item mega-menu current">
                      <div className="menu-link">
                        <div>Alles über uns</div>
                      </div>
                      <div className="mega-menu-content mega-menu-style-2 px-0">
                        <div className="container">
                          <div className="row">
                            <a
                              href="index.html#socialmedia"
                              className="mega-menu-column sub-menu-container col-lg-4 border-bottom h-bg-light py-4"
                            >
                              <div className="feature-box">
                                <div className="fbox-icon mb-2">
                                  <img
                                    src="demos/seo/images/icons/seo.svg"
                                    alt="Feature Icon"
                                    className="bg-transparent rounded-0"
                                  />
                                </div>
                                <div className="fbox-content">
                                  <h3 className="text-transform-none ls-0">
                                    Unsere sozialen Medien
                                  </h3>
                                  <p>Hier findest du unsere sozialen Medien.</p>
                                </div>
                              </div>
                            </a>
                            <a
                              href="roadmap.html#tokenomicsrmpage"
                              className="mega-menu-column sub-menu-container col-lg-4 border-bottom h-bg-light py-4"
                            >
                              <div className="feature-box">
                                <div className="fbox-icon mb-2">
                                  <img
                                    src="demos/seo/images/icons/social.svg"
                                    alt="Feature Icon"
                                    className="bg-transparent rounded-0"
                                  />
                                </div>
                                <div className="fbox-content">
                                  <h3 className="text-transform-none ls-0">
                                    Tokenomics
                                  </h3>
                                  <p>Hier findest du unsere Tokenomics.</p>
                                </div>
                              </div>
                            </a>
                            <a
                              href="wallet.html#walletpart"
                              className="mega-menu-column sub-menu-container col-lg-4 border-bottom h-bg-light py-4"
                            >
                              <div className="feature-box">
                                <div className="fbox-icon mb-2">
                                  <img
                                    src="demos/seo/images/icons/adword.svg"
                                    alt="Feature Icon"
                                    className="bg-transparent rounded-0"
                                  />
                                </div>
                                <div className="fbox-content">
                                  <h3 className="text-transform-none ls-0">
                                    Wallets
                                  </h3>
                                  <p>Entdecke hier eine Liste an n Wallets.</p>
                                </div>
                              </div>
                            </a>
                            <a
                              href="WPIBIT.pdf"
                              className="mega-menu-column sub-menu-container col-lg-4 border-bottom h-bg-light py-4"
                            >
                              <div className="feature-box">
                                <div className="fbox-icon mb-2">
                                  <img
                                    src="demos/seo/images/icons/experience.svg"
                                    alt="Feature Icon"
                                    className="bg-transparent rounded-0"
                                  />
                                </div>
                                <div className="fbox-content">
                                  <h3 className="text-transform-none ls-0">
                                    Unser Whitepaper
                                  </h3>
                                  <p>
                                    Hier kannst du das Whitepaper downloaden und
                                    lesen.
                                  </p>
                                </div>
                              </div>
                            </a>
                            <a
                              href="index.html#airdrops"
                              className="mega-menu-column sub-menu-container col-lg-4 border-bottom h-bg-light py-4"
                            >
                              <div className="feature-box">
                                <div className="fbox-icon mb-2">
                                  <img
                                    src="demos/seo/images/icons/analysis.svg"
                                    alt="Feature Icon"
                                    className="bg-transparent rounded-0"
                                  />
                                </div>
                                <div className="fbox-content">
                                  <h3 className="text-transform-none ls-0">
                                    Airdrops
                                  </h3>
                                  <p>
                                    Berechne wie viel du durch Airdrops
                                    verdienen kannst.
                                  </p>
                                </div>
                              </div>
                            </a>
                            <a
                              href="wallet.html"
                              className="mega-menu-column sub-menu-container col-lg-4 border-bottom h-bg-light py-4"
                            >
                              <div className="feature-box">
                                <div className="fbox-icon mb-2">
                                  <img
                                    src="demos/seo/images/icons/content_marketing.svg"
                                    alt="Feature Icon"
                                    className="bg-transparent rounded-0"
                                  />
                                </div>
                                <div className="fbox-content">
                                  <h3 className="text-transform-none ls-0">
                                    IBIT Token staken
                                  </h3>
                                  <p>
                                    Entdecke das Stakingdashboard und nimm hier
                                    einfach über unsere Website am Staking teil.
                                  </p>
                                </div>
                              </div>
                            </a>
                          </div>
                        </div>
                      </div>
                    </li>
                    <li className="menu-item">
                      <a
                        className="menu-link"
                        href="roadmap.html#roadmaprmpage"
                      >
                        <div>Roadmap</div>
                      </a>
                    </li>
                    <li className="menu-item">
                      <a className="menu-link" href="index.html#faqibit">
                        <div>FAQs</div>
                      </a>
                    </li>
                    <li className="menu-item">
                      <a className="menu-link" href="contact.html">
                        <div>Kontakt</div>
                      </a>
                    </li>
                  </ul>
                </nav>

                <form
                  className="top-search-form"
                  action="search.html"
                  method="get"
                >
                  <input
                    type="text"
                    name="q"
                    className="form-control"
                    value=""
                    placeholder="Wonach suchst du?"
                    autoComplete="off"
                  />
                </form>
              </div>
            </div>
          </div>
          <div className="header-wrap-clone"></div>
        </header>
        {/* #header end */}
        {/* Slider
            ============================================= */}
        <section
          id="slider"
          className="slider-element full-screen clearfix"
          style={{
            background:
              "url('demos/photographer/images/dots-1.png') 100% 0 no-repeat",
            backgroundSize: "60% auto",
          }}
        >
          <div className="main-content" id="wallet-connected">
            <div className="stats">
              <div className="stat-item" id="stake-entry-data">
                <p>Total staked</p>
                <h3>
                  <span id="stake-amount"></span> IBIT
                </h3>
              </div>
              <div className="stat-item">
                <p>Available</p>
                <h3>
                  <span id="estimated-rewards"></span> IBIT
                </h3>
              </div>
              <div className="stat-item">
                <p>Total rewards</p>
                <h3>
                  <span id="claimed-rewards"></span>IBIT
                </h3>
              </div>
              <div className="stat-item">
                <p>24h Rewards</p>
                <h3>
                  <span id="estimated-rewards-24h"></span> IBIT
                </h3>
              </div>
            </div>
            <div className="action-buttons">
              <div className="action-button-wrap">
                <input type="number" id="stake_input" />
                <button className="stake-button" id="stake" onClick={stakeIBIT}>
                  Stake
                </button>
              </div>
              <div className="action-button-wrap">
                <input type="number" id="unstake_input" />
                <button
                  className="unstake-button"
                  id="unstake"
                  onClick={unstakeIBIT}
                >
                  Unstake
                </button>
              </div>
              <div className="action-button-wrap">
                <button
                  className="stake-button"
                  id="claimrewards"
                  onClick={getRewards}
                >
                  Rewards auszahlen
                </button>
              </div>
            </div>
            <div className="wallet-info">
              <div className="chart-container">
                <div className="statistics-container">
                  <div className="statitem">
                    <h3>Momentane monatliche Returns</h3>
                    <p id="current-monthly-return">
                      11.96% | <span id="monthly-a-amount"></span> IBIT
                    </p>
                  </div>
                  <div className="statitem">
                    <h3>voraussichtliche tägliche Returns</h3>
                    <p id="expected-daily-return">
                      0.398% | <span id="daily-a-amount"></span> IBIT
                    </p>
                  </div>
                  <div className="statitem">
                    <h3>voraussichtliche wöchentliche Returns</h3>
                    <p id="expected-weekly-return">
                      2.79% | <span id="weekly-a-amount"></span> IBIT
                    </p>
                  </div>
                  <div className="statitem">
                    <h3>voraussichtliche jährliche Returns</h3>
                    <p id="expected-yearly-return">
                      145.11% | <span id="yearly-a-amount"></span> IBIT
                    </p>
                  </div>
                  <div className="statitem" id="token-a-data">
                    <h3>verfügbare Token in deiner Wallet</h3>
                    <p id="expected-monthly-return">
                      <span id="a-amount"></span> IBIT
                    </p>
                  </div>
                  <div className="statitem">
                    <h3>automatisiertes Restake</h3>
                    <p id="expected-monthly-return">not activated</p>
                  </div>
                </div>
              </div>
              <div className="transaction-history">
                <h3>Transaktionshistorie</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Datum</th>
                      <th>Typ</th>
                      <th>Betrag</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="date"></td>
                      <td></td>
                      <td></td>
                    </tr>
                    <tr>
                      <td className="date"></td>
                      <td></td>
                      <td></td>
                    </tr>
                    <tr>
                      <td className="date"></td>
                      <td></td>
                      <td></td>
                    </tr>
                    <tr>
                      <td className="date"></td>
                      <td> </td>
                      <td> </td>
                    </tr>
                    <tr>
                      <td className="date"></td>
                      <td> </td>
                      <td> </td>
                    </tr>
                    <tr>
                      <td className="date"></td>
                      <td> </td>
                      <td> </td>
                    </tr>
                    <tr>
                      <td className="date"></td>
                      <td> </td>
                      <td> </td>
                    </tr>
                    <tr>
                      <td className="date"></td>
                      <td> </td>
                      <td> </td>
                    </tr>
                    <tr>
                      <td className="date"></td>
                      <td> </td>
                      <td> </td>
                    </tr>
                    <tr>
                      <td className="date"></td>
                      <td> </td>
                      <td> </td>
                    </tr>
                    <tr>
                      <td className="date"></td>
                      <td> </td>
                      <td> </td>
                    </tr>
                    <tr>
                      <td className="date"></td>
                      <td> </td>
                      <td> </td>
                    </tr>
                    <tr>
                      <td className="date"></td>
                      <td> </td>
                      <td> </td>
                    </tr>
                    <tr>
                      <td className="date"></td>
                      <td> </td>
                      <td> </td>
                    </tr>
                    <tr>
                      <td className="date"></td>
                      <td> </td>
                      <td> </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
        {/* #Slider End */}
        {/* Footer ============================================= */}
        <footer id="footer" className="no-border clearfix">
          {/* Copyrights ============================================= */}
          <div id="copyrights" style={{ background: "#111" }}>
            <div className="container">
              <div className="w-100 text-center mt-4">
                <p className="mb-3" style={{ color: "#fff" }}>
                  2024. All Rights Reserved.
                </p>
                <a
                  href="https://twitter.com/TokenBlack80107"
                  target="_blank"
                  className="social-icon inline-block si-small border-0 text-white-50 rounded-circle h-bg-x-twitter"
                >
                  <i className="fa-brands fa-x-twitter"></i>
                  <i className="fa-brands fa-x-twitter"></i>
                </a>
                <a
                  href="https://www.instagram.com/blackrocktoken"
                  target="_blank"
                  className="social-icon inline-block si-small border-0 text-white-50 rounded-circle h-bg-instagram"
                >
                  <i className="bi-instagram"></i>
                  <i className="bi-instagram"></i>
                </a>
                <a
                  href="mailto:info@blackrock-token.io"
                  className="social-icon inline-block si-small border-0 text-white-50 rounded-circle h-bg-google"
                >
                  <i className="bi-envelope"></i>
                  <i className="bi-envelope"></i>
                </a>
              </div>
            </div>
          </div>
          {/* #copyrights end */}
        </footer>
        {/* #footer end */}
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