const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("UNILORINStudentUnionVoting", function () {
  let contract, owner, addr1;

  beforeEach(async () => {
    const Voting = await ethers.getContractFactory("UNILORINStudentUnionVoting");
    [owner, addr1] = await ethers.getSigners();
    contract = await Voting.deploy();
    await contract.deployed();
  });

  it("should deploy correctly", async () => {
    expect(contract.address).to.not.equal(0);
  });

  it("owner can add registrar", async () => {
    await contract.addAuthorizedRegistrar(addr1.address);
    expect(await contract.authorizedRegistrars(addr1.address)).to.equal(true);
  });

  it("non-owner cannot add registrar", async () => {
    await expect(contract.connect(addr1).addAuthorizedRegistrar(addr1.address)).to.be.reverted;
  });

  it("should create election and retrieve positions", async () => {
    const now = Math.floor(Date.now() / 1000);
    await contract.createElection("Test", "Desc", now + 10, now + 1000, ["President", "VP"]);
    const pos = await contract.getAllPositions(0);
    expect(pos[0]).to.equal("President");
  });
});
