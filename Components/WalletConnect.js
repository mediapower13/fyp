import { useState, useEffect } from "react";

export default function WalletConnect() {
  const [account, setAccount] = useState("");

  useEffect(() => {
    if (typeof window.ethereum !== "undefined") {
      window.ethereum.on("accountsChanged", accounts => {
        setAccount(accounts[0]);
      });
    }
  }, []);

  async function connectWallet() {
    if (typeof window.ethereum === "undefined") return alert("Please install MetaMask!");
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    setAccount(accounts[0]);
  }

  return (
    <div className="mb-4">
      <button onClick={connectWallet}>
        {account ? `Connected: ${account.slice(0, 6)}...${account.slice(-4)}` : "Connect Wallet"}
      </button>
    </div>
  );
}
