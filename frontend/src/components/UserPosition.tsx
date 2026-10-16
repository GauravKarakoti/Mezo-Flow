import { useAccount, useReadContract } from "wagmi";
import { formatEther } from "viem";
import { vaultAbi, VAULT_ADDRESS } from "../abi";

export default function UserPosition() {
  const { address, isConnected } = useAccount();

  const { data: shares } = useReadContract({
    address: VAULT_ADDRESS,
    abi: vaultAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: assets } = useReadContract({
    address: VAULT_ADDRESS,
    abi: vaultAbi,
    functionName: "convertToAssets",
    args: shares ? [shares] : undefined,
    query: { enabled: !!shares },
  });

  if (!isConnected) return null;

  return (
    <section className="position">
      <h2>Your Position</h2>
      <div className="position-row">
        <span>Shares</span>
        <span>{shares ? Number(formatEther(shares)).toLocaleString() : "0"} mzFLOW-MUSD</span>
      </div>
      <div className="position-row">
        <span>Value</span>
        <span>{assets ? Number(formatEther(assets)).toLocaleString() : "0"} MUSD</span>
      </div>
    </section>
  );
}