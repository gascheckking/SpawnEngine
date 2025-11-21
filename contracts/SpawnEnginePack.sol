// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/*
    SpawnEngine — Multi-Pack NFT Logic
    ----------------------------------
    Clean and stable version for OpenZeppelin v5.

    This contract is designed to integrate smoothly with:
    - PackFactory.sol
    - TokenPackSeries.sol
    - UtilityPackRouter.sol
    - ReserveGuard.sol
    - Lootbox1155.sol

    Core features:
    - Add card types
    - Mint NFT when opening a pack
    - Pick card type via simple deterministic RNG
    - tokenURI uses OZ v5-compliant _requireOwned()
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

    constructor() ERC721("SpawnEngine Pack", "SPAWNPACK") Ownable(msg.sender) {}

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

        _mint(msg.sender, tokenId);

        // Simple deterministic RNG
        cardTypeId = (
            uint256(
                keccak256(
                    abi.encodePacked(
                        block.timestamp,
                        msg.sender,
                        tokenId,
                        block.prevrandao
                    )
                )
            ) % cardTypeCount
        ) + 1;

        emit PackOpened(msg.sender, tokenId, cardTypeId);
        return cardTypeId;
    }

    // ---------------------------------------------------------
    //  VIEW: Metadata by tokenId
    // ---------------------------------------------------------
    function tokenURI(uint256 tokenId)
        public
        view
        override
        returns (string memory)
    {
        _requireOwned(tokenId);  // OpenZeppelin v5-compliant

        // Example: bucket token IDs to card types
        uint256 typeId = tokenId % cardTypeCount;
        if (typeId == 0) typeId = 1;

        return cardTypes[typeId].metadataURI;
    }
}