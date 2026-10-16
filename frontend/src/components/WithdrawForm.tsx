import { useState, useEffect } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
} from "wagmi";
import { parseEther } from "viem";
import { vaultAbi, VAULT_ADDRESS } from "../abi";

export default function WithdrawForm() {
  const { address } = useAccount();
  const [amount, setAmount] = useState("");

  const { writeContract, data: hash } = useWriteContract();
  const { isLoading, isSuccess } = useWaitForTransactionReceipt({ hash });

  const { refetch: refetchShares } = useReadContract({
    address: VAULT_ADDRESS,
    abi: vaultAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  useEffect(() => {
    if (isSuccess) {
      setAmount("");
      refetchShares();
    }
  }, [isSuccess, refetchShares]);

  const handleWithdraw = () => {
    if (!address || !amount) return;
    writeContract({
      address: VAULT_ADDRESS,
      abi: vaultAbi,
      functionName: "withdraw",
      args: [parseEther(amount), address, address],
    });
  };

  return (
    <div className="card">
      <h3>Withdraw MUSD</h3>
      <input
        type="text"
        placeholder="0.0"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <button onClick={handleWithdraw} disabled={!amount || isLoading}>
        {isLoading ? "Withdrawing..." : "Withdraw"}
      </button>
      <div className="hint">
        Withdrawals return MUSD to your wallet from the savings vault.
      </div>
    </div>
  );
}