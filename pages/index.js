import { useEffect, useState } from "react";
import WalletConnect from "../Components/WalletConnect";
import { getContract } from "../lib/contract";

export default function Home() {
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchPositions() {
    try {
      const contract = getContract();
      const pos = await contract.getAllPositions(0); // fetch for election ID 0
      setPositions(pos);
    } catch (err) {
      console.error("Error fetching positions:", err.message);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchPositions();
  }, []);

  return (
    <div className="p-4">
      <h1>UNILORIN Student Union Election</h1>
      <WalletConnect />
      <h2>Available Positions</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul>
          {positions.map((pos, i) => <li key={i}>{pos}</li>)}
        </ul>
      )}
    </div>
  );
}
