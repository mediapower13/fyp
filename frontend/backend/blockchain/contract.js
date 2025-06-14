const Web3 = require('web3');
const contractABI = [/* paste ABI here */];
const contractAddress = "0xYourContractAddress";

const web3 = new Web3("https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID");

const contractInstance = new web3.eth.Contract(contractABI, contractAddress);

module.exports = { contractInstance };
