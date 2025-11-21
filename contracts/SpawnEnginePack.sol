// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/*
    SpawnEngine — Pack NFT with Pyth Entropy randomness
    ---------------------------------------------------
    FULLY UPDATED VERSION

    Features:
    - Add card types
    - Mint NFT packs
    - Request randomness via Pyth Entropy
    - Finalize randomness and assign card type
    - Uses OpenZeppelin v5 (_requireOwned)
*/

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

// ⭐ Pyth Entropy Interface
import "@pythnetwork/entropy-sdk-solidity/IEntropy.sol";

contract SpawnEnginePack is ERC721, Ownable {

    // -----------------------------------------
    // STATE
    // -----------------------------------------
    uint256 public nextTokenId = 1;

    IEntropy public entropy;

    struct CardType {
        string name;
        uint256 rarity;
        string metadataURI;
    }

    mapping(uint256 => CardType) public cardTypes;
    uint256 public cardTypeCount;

    // packId → requestId
    mapping(uint256 => uint256) public requestForToken;

    // tokenId → assigned cardType
    mapping(uint256 => uint256) public assignedType;

    // -----------------------------------------
    // EVENTS
    // -----------------------------------------
    event CardTypeAdded(uint256 indexed id, string name, uint256 rarity);

    event PackOpened(
        address indexed opener,
        uint256 indexed tokenId,
        uint256 requestId
    );

    event PackFinalized(
        uint256 indexed tokenId,
        uint256 cardTypeId,
        uint256 randomness
    );

    // -----------------------------------------
    // CONSTRUCTOR
    // -----------------------------------------
    constructor(address entropyAddress)
        ERC721("SpawnEngine Pack", "SPAWNPACK")
        Ownable(msg.sender)
    {
        entropy = IEntropy(entropyAddress);
    }

    // -----------------------------------------
    // ADMIN: Add card types
    // -----------------------------------------
    function addCardType(
        string memory _name,
        uint256 _rarity,
        string memory _metadataURI
    ) external onlyOwner {
        cardTypeCount++;
        cardTypes[cardTypeCount] =
            CardType(_name, _rarity, _metadataURI);

        emit CardTypeAdded(cardTypeCount, _name, _rarity);
    }

    // -----------------------------------------
    // USER: Open pack → mint NFT + request randomness
    // -----------------------------------------
    function openPack() external returns (uint256 tokenId, uint256 requestId) {
        require(cardTypeCount > 0, "No card types");

        tokenId = nextTokenId++;
        _mint(msg.sender, tokenId);

        // Request randomness from Pyth Entropy
        requestId = entropy.requestRandomNumber();

        // Store request so it can be finalized
        requestForToken[tokenId] = requestId;

        emit PackOpened(msg.sender, tokenId, requestId);
    }

    // -----------------------------------------
    // USER: Finalize pack after randomness is ready
    // -----------------------------------------
    function finalizePack(
        uint256 tokenId,
        bytes calldata entropyProof
    ) external returns (uint256 cardTypeId) {

        _requireOwned(tokenId);
        require(assignedType[tokenId] == 0, "Already finalized");

        uint256 requestId = requestForToken[tokenId];
        require(requestId != 0, "No randomness request");

        // Verify random number from Pyth
        uint256 randomness =
            entropy.verifyRandomNumber(requestId, entropyProof);

        // Pick card type
        cardTypeId = (randomness % cardTypeCount) + 1;
        assignedType[tokenId] = cardTypeId;

        emit PackFinalized(tokenId, cardTypeId, randomness);
        return cardTypeId;
    }

    // -----------------------------------------
    // VIEW: tokenURI
    // -----------------------------------------
    function tokenURI(uint256 tokenId)
        public
        view
        override
        returns (string memory)
    {
        _requireOwned(tokenId);

        uint256 typeId = assignedType[tokenId];
        if (typeId == 0) {
            // not finalized yet → fallback to type 1
            typeId = 1;
        }

        return cardTypes[typeId].metadataURI;
    }
}