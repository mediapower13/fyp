import { useEffect, useState } from "react";
import { getContract } from "../lib/contract";

export default function ResultsPage() {
  const [positions, setPositions] = useState([]);
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const electionId = 1; // Replace with your actual election ID

  useEffect(() => {
    async function loadResults() {
      try {
        const contract = getContract();
        const pos = await contract.getElectionPositions(electionId);
        setPositions(pos);

        const [candidateIds, voteCounts] = await contract.getElectionResults(electionId);

        const dataByPosition = {};

        for (let i = 0; i < candidateIds.length; i++) {
          const candidate = await contract.getCandidate(candidateIds[i]);
          const pos = candidate.position;

          if (!dataByPosition[pos]) dataByPosition[pos] = [];

          dataByPosition[pos].push({
            name: candidate.name,
            votes: voteCounts[i].toNumber(),
            department: candidate.department,
          });
        }

        setResults(dataByPosition);
        setLoading(false);
      } catch (err) {
        setMessage("Error loading results: " + err.message);
        setLoading(false);
      }
    }

    loadResults();
  }, []);

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">📊 Election Results</h1>

      {loading ? (
        <p>Loading results...</p>
      ) : (
        <div className="space-y-6">
          {positions.map((position) => (
            <div key={position}>
              <h2 className="text-xl font-semibold mb-2">{position}</h2>
              <ul className="border p-2 rounded space-y-2">
                {(results[position] || []).map((cand, idx) => (
                  <li
                    key={idx}
                    className="border p-2 rounded flex justify-between items-center"
                  >
                    <div>
                      <p className="font-bold">{cand.name}</p>
                      <p className="text-sm">Dept: {cand.department}</p>
                    </div>
                    <span className="font-semibold text-blue-600">{cand.votes} votes</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {message && <p className="mt-4 text-red-600">{message}</p>}
    </div>
  );
}
