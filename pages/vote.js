import { useEffect, useState } from "react";
import WalletConnect from "../Components/WalletConnect";
import { getContract } from "../lib/contract";

export default function VotePage() {
  const [positions, setPositions] = useState([]);
  const [candidatesByPosition, setCandidatesByPosition] = useState({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const electionId = 1; // Replace with your actual election ID

  useEffect(() => {
    async function loadCandidates() {
      try {
        const contract = getContract();
        const pos = await contract.getElectionPositions(electionId);
        setPositions(pos);

        const allCandidates = {};

        for (let position of pos) {
          const candidateIds = await contract.getCandidatesByPosition(electionId, position);
          const details = [];

          for (let id of candidateIds) {
            const data = await contract.getCandidate(id);
            details.push({ ...data, candidateId: id });
          }

          allCandidates[position] = details;
        }

        setCandidatesByPosition(allCandidates);
        setLoading(false);
      } catch (err) {
        setMessage("Error loading data: " + err.message);
        setLoading(false);
      }
    }

    loadCandidates();
  }, []);

  async function handleVote(candidateId) {
    setMessage("Casting vote...");
    try {
      const contract = getContract();
      const tx = await contract.vote(electionId, candidateId);
      await tx.wait();
      setMessage("✅ Vote cast successfully!");
    } catch (err) {
      setMessage("❌ Vote failed: " + err.message);
    }
  }

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">🗳️ Vote in the Election</h1>
      <WalletConnect />

      {loading ? (
        <p>Loading candidates...</p>
      ) : (
        <div className="space-y-6">
          {positions.map((position) => (
            <div key={position}>
              <h2 className="text-xl font-semibold">{position}</h2>
              {candidatesByPosition[position].length === 0 ? (
                <p>No candidates yet.</p>
              ) : (
                <ul className="border p-2 rounded space-y-2">
                  {candidatesByPosition[position].map((cand, index) => (
                    <li key={index} className="border p-3 rounded shadow">
                      <p className="font-bold">{cand.name}</p>
                      <p className="text-sm">{cand.manifesto}</p>
                      <p className="text-xs">Dept: {cand.department}</p>
                      <button
                        onClick={() => handleVote(cand.candidateId)}
                        className="mt-2 px-3 py-1 bg-blue-600 text-white rounded"
                      >
                        Vote
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      {message && <p className="mt-4 text-green-600">{message}</p>}
    </div>
  );
}
