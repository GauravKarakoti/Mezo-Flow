import { ConnectButton } from "@rainbow-me/rainbowkit";
import Header from "./components/Header";
import VaultStats from "./components/VaultStats";
import UserPosition from "./components/UserPosition";
import DepositForm from "./components/DepositForm";
import WithdrawForm from "./components/WithdrawForm";

export default function App() {
  return (
    <div className="app">
      <Header />
      <main className="container">
        <section className="hero">
          <h1>Mezo Flow</h1>
          <p>Auto-compounding MUSD vault. Deposit once, earn yield, withdraw anytime.</p>
          <ConnectButton />
        </section>

        <VaultStats />

        <div className="grid">
          <DepositForm />
          <WithdrawForm />
        </div>

        <UserPosition />
      </main>
    </div>
  );
}