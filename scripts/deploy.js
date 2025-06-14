const fs = require("fs");
const { ethers, network } = require("hardhat"); // ✅ Correct way with hardhat-toolbox

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const Contract = await ethers.getContractFactory("UNILORINStudentUnionVoting");
  const contract = await Contract.deploy();
  await contract.deployed();

  console.log("Contract deployed to:", contract.address);

  // Add registrars
  const registrars = [
    "0x742d35Cc6635C0532925a3b8D5c6Cf8c65CAd14B",
    "0x9BE4aF5b9d7d8e1c0e3f9f8d7c6B5a4936251848"
  ];

  for (const addr of registrars) {
    try {
      const tx = await contract.addAuthorizedRegistrar(addr);
      await tx.wait();
      console.log("Added registrar:", addr);
    } catch (err) {
      console.error("Error adding registrar:", err.message);
    }
  }

  // Create sample election
  const now = Math.floor(Date.now() / 1000);
  const start = now + 86400;
  const end = start + 604800;
  const positions = ["President", "Vice President", "Secretary General"];

  const createTx = await contract.createElection(
    "UNILORIN Election 2024/2025",
    "Executive elections for student union",
    start,
    end,
    positions
  );
  const receipt = await createTx.wait();
  const electionId = receipt.events.find(e => e.event === "ElectionCreated").args.electionId;

  console.log("Created sample election:", electionId.toString());

  const data = {
    contractAddress: contract.address,
    network: network.name,
    deployer: deployer.address,
    electionId: electionId.toString(),
  };

  if (!fs.existsSync("deployments")) fs.mkdirSync("deployments");
  fs.writeFileSync(`deployments/deployment-${network.name}.json`, JSON.stringify(data, null, 2));
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exit(1);
});
