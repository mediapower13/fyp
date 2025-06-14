import { useState } from "react";
import WalletConnect from "../Components/WalletConnect";
import { getContract } from "../lib/contract";

const [student, setStudent] = useState({
  address: "",
  matricNumber: "",
  fullName: "",
  faculty: "",
  department: "",
  level: ""
});


export default function AdminPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [positions, setPositions] = useState([""]);
  const [student, setStudent] = useState({});
  const [message, setMessage] = useState("");

  async function handleCreateElection(e) {
    e.preventDefault();
    setMessage("Creating election...");

    try {
      const contract = getContract();
      const pos = positions.filter((p) => p.trim() !== "");
      const startUnix = Math.floor(new Date(startTime).getTime() / 1000);
      const endUnix = Math.floor(new Date(endTime).getTime() / 1000);

      const tx = await contract.createElection(title, description, startUnix, endUnix, pos);
      await tx.wait();

      setMessage("✅ Election created successfully!");
    } catch (err) {
      console.error(err.message);
      setMessage("❌ Error: " + err.message);
    }
  }

  function handlePositionChange(index, value) {
    const updated = [...positions];
    updated[index] = value;
    setPositions(updated);
  }

  function addPositionField() {
    setPositions([...positions, ""]);
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">🧑‍💼 Admin Dashboard</h1>
      <WalletConnect />

      <form onSubmit={handleCreateElection} className="space-y-4">
        <div>
          <label>Title:</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="border px-2 py-1 w-full"
          />
        </div>

        <div>
          <label>Description:</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="border px-2 py-1 w-full"
          />
        </div>

        <div>
          <label>Start Time:</label>
          <input
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
            className="border px-2 py-1 w-full"
          />
        </div>

        <div>
          <label>End Time:</label>
          <input
            type="datetime-local"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            required
            className="border px-2 py-1 w-full"
          />
        </div>

        <div>
          <label>Positions:</label>
          {positions.map((pos, index) => (
            <input
              key={index}
              value={pos}
              onChange={(e) => handlePositionChange(index, e.target.value)}
              placeholder={`Position ${index + 1}`}
              className="border px-2 py-1 w-full mb-2"
            />
          ))}
          <button type="button" onClick={addPositionField} className="text-blue-600 text-sm">
            + Add Another Position
          </button>
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Create Election
        </button>
      </form>
      {message && <p className="mt-4 text-green-600">{message}</p>}

      <hr className="my-8" />
      <h2 className="text-xl font-semibold mb-4">👨‍🎓 Register Student</h2>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setMessage("Registering student...");

          try {
            const contract = getContract();
            const tx = await contract.registerStudent(
              student.address,
              student.matricNumber,
              student.fullName,
              student.faculty,
              student.department,
              parseInt(student.level)
            );
            await tx.wait();
            setMessage("✅ Student registered successfully!");
          } catch (err) {
            setMessage("❌ Error registering student: " + err.message);
          }
        }}
        className="space-y-4"
      >
        {["address", "matricNumber", "fullName", "faculty", "department", "level"].map((field) => (
          <div key={field}>
            <label className="capitalize">{field}:</label>
            <input
              type={field === "level" ? "number" : "text"}
              required
              value={student[field] || ""}
              onChange={(e) => setStudent({ ...student, [field]: e.target.value })}
              className="border px-2 py-1 w-full"
            />
          </div>
        ))}

        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">
          Register Student
        </button>
      </form>
    </div>
  );
}
