import { useState } from "react";

interface HamburgerMenuProps {
  navItems: Array<{ href: string; title: string }>;
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const HamburgerMenu = ({
  navItems,
  isOpen,
  setIsOpen,
}: HamburgerMenuProps) => {
  return (
   <>
     {/* Hamburger icon */}
     <button
       onClick={() => setIsOpen(!isOpen)}
       className={`hamburger-menu ${isOpen ? "open hamburger-menu-open" : ""}`}
     >
       <div></div>
       <div></div>
       <div></div>
     </button>
     {/* Mobile nav menu */}
     <nav className={`mobile-menu ${isOpen ? "open" : ""}`}>
       <ul>
         {navItems.map(({ href, title }, index) =>
           title === "ALLES ÜBER UNS" ? (
             <li className="sub-menu" key={index}>
               <div>{title}</div>
             </li>
           ) : (
             <li key={index}>
               <a href={href}>{title}</a>
             </li>
           )
         )}
       </ul>
     </nav>
   </>
  );
};