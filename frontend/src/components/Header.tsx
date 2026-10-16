import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function Header() {
  return (
    <header className="header">
      <div className="logo">Mezo Flow</div>
      <ConnectButton />
    </header>
  );
}