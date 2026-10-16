import { useState } from "react";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseEther, formatEther } from "viem";
import { vaultAbi, erc20Abi, VAULT_ADDRESS, MUSD_ADDRESS } from "../abi";

export default function DepositForm() {
  const { address } = useAccount();
  const [amount, setAmount] = useState("");

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: MUSD_ADDRESS,
    abi: erc20Abi,
    functionName: "allowance",
    args: address ? [address, VAULT_ADDRESS] : undefined,
    query: { enabled: !!address },
  });

  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: MUSD_ADDRESS,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { writeContract: approve, data: approveHash } = useWriteContract();
  const { writeContract: deposit, data: depositHash } = useWriteContract();

  const { isLoading: approving } = useWaitForTransactionReceipt({
    hash: approveHash,
    query: { onSuccess: () => refetchAllowance() },
  });

  const { isLoading: depositing } = useWaitForTransactionReceipt({
    hash: depositHash,
    query: {
      onSuccess: () => {
        setAmount("");
        refetchBalance();
        refetchAllowance();
      },
    },
  });

  const parsed = amount ? parseEther(amount) : 0n;
  const needsApproval = allowance !== undefined && parsed > allowance;

  const handleDeposit = () => {
    if (!address || !amount) return;
    if (needsApproval) {
      approve({
        address: MUSD_ADDRESS,
        abi: erc20Abi,
        functionName: "approve",
        args: [VAULT_ADDRESS, parsed],
      });
    } else {
      deposit({
        address: VAULT_ADDRESS,
        abi: vaultAbi,
        functionName: "deposit",
        args: [parsed, address],
      });
    }
  };

  return (
    <div className="card">
      <h3>Deposit MUSD</h3>
      <input
        type="text"
        placeholder="0.0"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <div className="balance">
        Balance: {balance ? Number(formatEther(balance)).toLocaleString() : "0"} MUSD
      </div>
      <button onClick={handleDeposit} disabled={!amount || approving || depositing}>
        {approving ? "Approving..." : depositing ? "Depositing..." : needsApproval ? "Approve MUSD" : "Deposit"}
      </button>
    </div>
  );
}