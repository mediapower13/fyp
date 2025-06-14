// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract UNILORINStudentUnionVoting is Ownable, ReentrancyGuard {
    struct Student {
        string matricNumber;
        string fullName;
        string faculty;
        string department;
        uint256 level;
        bool isRegistered;
        bool isEligible;
    }

    struct Candidate {
        uint256 candidateId;
        string name;
        string matricNumber;
        string faculty;
        string department;
        string position;
        string manifesto;
        string imageHash;
        uint256 voteCount;
        uint256 electionId;
        bool isActive;
    }

    struct Election {
        uint256 electionId;
        string title;
        string description;
        uint256 startTime;
        uint256 endTime;
        bool isActive;
        bool resultsPublished;
        string[] positions;
    }

    struct VoteRecord {
        address voter;
        uint256 candidateId;
        uint256 electionId;
        string position;
        uint256 timestamp;
    }

    uint256 public electionCount;
    uint256 public candidateCount;

    mapping(address => Student) public students;
    mapping(string => address) public matricToAddress;
    mapping(uint256 => Candidate) public candidates;
    mapping(uint256 => Election) public elections;
    mapping(uint256 => mapping(string => uint256[])) public positionCandidates;
    mapping(address => mapping(uint256 => mapping(string => bool))) public hasVoted;
    mapping(uint256 => VoteRecord[]) public electionVotes;
    mapping(address => bool) public authorizedRegistrars;

    event StudentRegistered(address indexed student, string matricNumber);
    event CandidateRegistered(uint256 indexed candidateId, string name, string position);
    event ElectionCreated(uint256 indexed electionId, string title);
    event VoteCast(address indexed voter, uint256 indexed candidateId, string position);
    event ResultsPublished(uint256 indexed electionId);

    modifier onlyRegisteredStudent() {
        require(students[msg.sender].isRegistered, "Not registered");
        require(students[msg.sender].isEligible, "Not eligible");
        _;
    }

    modifier onlyAuthorizedRegistrar() {
        require(authorizedRegistrars[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }

    constructor() {
        authorizedRegistrars[msg.sender] = true;
    }

    function addAuthorizedRegistrar(address _registrar) external onlyOwner {
        authorizedRegistrars[_registrar] = true;
    }

    function registerStudent(
        address studentAddress,
        string memory matric,
        string memory name,
        string memory faculty,
        string memory dept,
        uint256 level
    ) external onlyAuthorizedRegistrar {
        require(!students[studentAddress].isRegistered, "Already registered");
        students[studentAddress] = Student(matric, name, faculty, dept, level, true, level >= 200);
        matricToAddress[matric] = studentAddress;
        emit StudentRegistered(studentAddress, matric);
    }

    function createElection(
        string memory title,
        string memory desc,
        uint256 start,
        uint256 end,
        string[] memory positions
    ) external onlyOwner returns (uint256) {
        require(start > block.timestamp && end > start, "Invalid timing");
        electionCount++;
        elections[electionCount] = Election(electionCount, title, desc, start, end, true, false, positions);
        emit ElectionCreated(electionCount, title);
        return electionCount;
    }

    function registerCandidate(
        uint256 electionId,
        string memory name,
        string memory matric,
        string memory faculty,
        string memory dept,
        string memory position,
        string memory manifesto,
        string memory imageHash
    ) external onlyAuthorizedRegistrar {
        require(matricToAddress[matric] != address(0), "Student must be registered");
        candidateCount++;
        candidates[candidateCount] = Candidate(candidateCount, name, matric, faculty, dept, position, manifesto, imageHash, 0, electionId, true);
        positionCandidates[electionId][position].push(candidateCount);
        emit CandidateRegistered(candidateCount, name, position);
    }

    function vote(uint256 electionId, uint256 candidateId) external onlyRegisteredStudent {
        Candidate storage c = candidates[candidateId];
        require(c.isActive && c.electionId == electionId, "Invalid candidate");
        require(!hasVoted[msg.sender][electionId][c.position], "Already voted for this position");

        c.voteCount++;
        hasVoted[msg.sender][electionId][c.position] = true;
        electionVotes[electionId].push(VoteRecord(msg.sender, candidateId, electionId, c.position, block.timestamp));

        emit VoteCast(msg.sender, candidateId, c.position);
    }

    function publishResults(uint256 electionId) external onlyOwner {
        elections[electionId].resultsPublished = true;
        emit ResultsPublished(electionId);
    }

        function getResults(uint256 electionId, string memory position) external view returns (uint256[] memory ids, uint256[] memory votes) {
            uint256[] memory posIds = positionCandidates[electionId][position];
            ids = new uint256[](posIds.length);
            votes = new uint256[](posIds.length);
            for (uint256 i = 0; i < posIds.length; i++) {
                ids[i] = posIds[i];
                votes[i] = candidates[posIds[i]].voteCount;
            }
        }
    }