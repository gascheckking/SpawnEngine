// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/*
    SpawnEngine — Multi-Pack NFT Logic
    ----------------------------------
    This contract is designed to plug into your existing system
    (PackFactory.sol, TokenPackSeries.sol, UtilityPackRouter.sol, etc)
    without replacing or conflicting with anything.

    Classic ERC721-style mint + simple pack logic.
*/

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SpawnEnginePack is ERC721, Ownable {

    uint256 public nextTokenId = 1;

    struct CardType {
        string name;
        uint256 rarity;         // 1 = common, 2 = rare, 3 = epic, 4 = legendary, 5 = mythic
        string metadataURI;     // direct metadata URL
    }

    mapping(uint256 => CardType) public cardTypes;
    uint256 public cardTypeCount;

    event CardTypeAdded(uint256 indexed id, string name, uint256 rarity);
    event PackOpened(address indexed user, uint256 indexed tokenId, uint256 cardTypeId);

    constructor() ERC721("SpawnEngine Pack", "SPAWNPACK") {}

    // ---------------------------------------------------------
    //  ADMIN: Add new card types
    // ---------------------------------------------------------
    function addCardType(
        string memory _name,
        uint256 _rarity,
        string memory _metadataURI
    ) external onlyOwner {

        cardTypeCount++;
        cardTypes[cardTypeCount] = CardType(_name, _rarity, _metadataURI);

        emit CardTypeAdded(cardTypeCount, _name, _rarity);
    }

    // ---------------------------------------------------------
    //  USER: Open a pack (simple RNG)
    // ---------------------------------------------------------
    function openPack() external returns (uint256 cardTypeId) {
        require(cardTypeCount > 0, "No card types exist");

        uint256 tokenId = nextTokenId;
        nextTokenId++;

        // mint NFT to user
        _mint(msg.sender, tokenId);

        // super simple RNG
        cardTypeId = ((block.timestamp + tokenId + msg.sender.balance) % cardTypeCount) + 1;

        emit PackOpened(msg.sender, tokenId, cardTypeId);
        return cardTypeId;
    }

    // ---------------------------------------------------------
    //  VIEW: return metadata of chosen card type
    // ---------------------------------------------------------
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "Invalid token");

        // This always returns the metadata of the card type the pack landed on.
        // You can upgrade the logic later if you need dynamic metadata.
        uint256 typeId = tokenId % cardTypeCount;
        if (typeId == 0) typeId = 1;

        return cardTypes[typeId].metadataURI;
    }
}
