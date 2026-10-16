import { network } from "hardhat";

async function main() {
  const { ethers } = await network.connect();
  const impl = "0x92d12f0a60906b39d81acd9bf8977b6c824cd98c";
  const hex = (await ethers.provider.getCode(impl)).slice(2);
  const b = Buffer.from(hex, "hex");

  // walk opcodes, skipping PUSH data, collect PUSH4 values
  const sels = new Set<string>();
  for (let i = 0; i < b.length; ) {
    const op = b[i];
    if (op >= 0x60 && op <= 0x7f) {
      const n = op - 0x5f;
      if (n === 4) sels.add("0x" + b.subarray(i + 1, i + 5).toString("hex"));
      i += 1 + n;
    } else i += 1;
  }
  // keep only plausible dispatcher selectors (skip tiny values)
  const list = [...sels].filter((s) => parseInt(s, 16) > 0xffff);
  console.log("candidate selectors:", list.length);

  const url =
    "https://api.openchain.xyz/signature-database/v1/lookup?filter=true&function=" +
    list.join(",");
  const res = await fetch(url);
  const data: any = await res.json();
  const found = data?.result?.function ?? {};

  for (const s of list) {
    const names = (found[s] ?? []).map((x: any) => x.name).join(" | ");
    console.log(s, names || "(unknown)");
  }
}
main();