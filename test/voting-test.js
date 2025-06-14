const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("UNILORINStudentUnionVoting", function () {
  let contract, owner, registrar, student, candidate;

  beforeEach(async () => {
    const Voting = await ethers.getContractFactory("UNILORINStudentUnionVoting");
    [owner, registrar, student] = await ethers.getSigners();
    contract = await Voting.deploy();
    await contract.deployed();

    await contract.addAuthorizedRegistrar(registrar.address);
  });

  it("should allow registrar to register a student", async () => {
    await contract.connect(registrar).registerStudent(
      student.address,
      "20/55EC001",
      "John Doe",
      "Engineering",
      "Electrical",
      300
    );
    const s = await contract.students(student.address);
    expect(s.isRegistered).to.be.true;
  });

  it("should create an election and allow voting", async () => {
    const now = Math.floor(Date.now() / 1000);
    const start = now + 1;
    const end = start + 3600;

    const positions = ["President"];
    await contract.createElection("2024 Election", "Student Union", start, end, positions);

    const electionId = await contract.getCurrentElectionId();

    await contract.connect(registrar).registerStudent(
      student.address,
      "20/55EC002",
      "Jane Doe",
      "Science",
      "Biology",
      400
    );

    await contract.connect(registrar).registerCandidate(
      electionId,
      "Candidate A",
      "20/55EC002",
      "Science",
      "Biology",
      "President",
      "My manifesto",
      "Qm123"
    );

    const candidateId = await contract.getCurrentCandidateId();

    // Wait until voting starts
    await ethers.provider.send("evm_increaseTime", [2]);
    await ethers.provider.send("evm_mine");

    await contract.connect(student).vote(electionId, candidateId);
    const voted = await contract.hasStudentVotedForPositionView(student.address, electionId, "President");
    expect(voted).to.be.true;
  });
});
