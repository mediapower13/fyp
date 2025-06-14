export const CONTRACT_ADDRESS = ""; // Replace with your deployed contract address

export const CONTRACT_ABI = [
  // Create Election function
  {
    "inputs": [
      { "internalType": "string", "name": "title", "type": "string" },
      { "internalType": "string", "name": "description", "type": "string" },
      { "internalType": "uint256", "name": "startTimestamp", "type": "uint256" },
      { "internalType": "uint256", "name": "endTimestamp", "type": "uint256" },
      { "internalType": "string[]", "name": "positions", "type": "string[]" }
    ],
    "name": "createElection",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  
  // Add Authorized Registrar function
  {
    "inputs": [
      { "internalType": "address", "name": "registrar", "type": "address" }
    ],
    "name": "addAuthorizedRegistrar",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },

  // Get Election Results function
  {
    "inputs": [
      { "internalType": "uint256", "name": "electionId", "type": "uint256" }
    ],
    "name": "getElectionResults",
    "outputs": [
      { "internalType": "string[]", "name": "", "type": "string[]" },
      { "internalType": "string[]", "name": "", "type": "string[]" }
    ],
    "stateMutability": "view",
    "type": "function"
  },

  // Fetch all elections
  {
    "inputs": [],
    "name": "getAllElections",
    "outputs": [
      {
        "components": [
          { "internalType": "uint256", "name": "id", "type": "uint256" },
          { "internalType": "string", "name": "title", "type": "string" },
          { "internalType": "string", "name": "description", "type": "string" },
          { "internalType": "uint256", "name": "startTimestamp", "type": "uint256" },
          { "internalType": "uint256", "name": "endTimestamp", "type": "uint256" },
          { "internalType": "string[]", "name": "positions", "type": "string[]" }
        ],
        "internalType": "struct Election[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },

  // Vote in an election
  {
    "inputs": [
      { "internalType": "uint256", "name": "electionId", "type": "uint256" },
      { "internalType": "string[]", "name": "choices", "type": "string[]" }
    ],
    "name": "vote",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },

  // Events
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "electionId", "type": "uint256" },
      { "indexed": false, "internalType": "string", "name": "title", "type": "string" }
    ],
    "name": "ElectionCreated",
    "type": "event"
  }
];

// Remove the old export
// export const UNILORINStudentUnionVotingABI = [...];