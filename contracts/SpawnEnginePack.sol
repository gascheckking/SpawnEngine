// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SpawnEnginePack
 * @notice ERC1155-based random pack engine for card-style collections.
 *
 * Each contract = one series (e.g. Tiny Legends 2, Foil Realms, etc).
 * Owner defines card types with (maxSupply, weight).
 * Users pay to open packs and receive randomly selected cards.
 *
 * NOTE: Uses simple on-chain pseudo-randomness.
 *       Good for fun / testing. Not suitable for high-stakes gambling.
 */
contract SpawnEnginePack is ERC1155, Ownable {
    // ---------------------- Types ----------------------

    struct CardInfo {
        uint256 maxSupply; // total maximum supply for this card type
        uint256 minted;    // how many tokens have been minted
        uint256 weight;    // rarity weight used for random selection
    }

    // ---------------------- Storage ----------------------

    /// @dev cardId => info
    mapping(uint256 => CardInfo> public cards;

    /// @dev next id to assign when adding a new card type
    uint256 public nextCardId;

    /// @dev price per pack in wei (1 pack = 1 card draw)
    uint256 public packPrice;

    /// @dev base metadata URI, e.g. "ipfs://CID/{id}.json"
    string private baseMetadataURI;

    // ---------------------- Events ----------------------

    event CardTypeAdded(uint256 indexed cardId, uint256 maxSupply, uint256 weight);
    event PackOpened(address indexed user, uint256 indexed cardId);
    event PackPriceUpdated(uint256 oldPrice, uint256 newPrice);

    // ---------------------- Constructor ----------------------

    constructor(string memory _baseURI, uint256 _packPrice)
        ERC1155(_baseURI)
        Ownable(msg.sender)
    {
        baseMetadataURI = _baseURI;
        packPrice = _packPrice;
    }

    // ---------------------- Owner functions ----------------------

    /**
     * @notice Define a new card type that can be pulled from packs.
     * @param maxSupply Maximum supply for this card id.
     * @param weight    Rarity weight used in random selection (higher = more common).
     */
    function addCardType(uint256 maxSupply, uint256 weight) external onlyOwner {
        require(maxSupply > 0, "maxSupply is zero");
        require(weight > 0, "weight is zero");

        uint256 cardId = nextCardId;

        cards[cardId] = CardInfo({
            maxSupply: maxSupply,
            minted: 0,
            weight: weight
        });

        nextCardId += 1;

        emit CardTypeAdded(cardId, maxSupply, weight);
    }

    /**
     * @notice Update price per pack.
     * @param newPrice New pack price in wei.
     */
    function setPackPrice(uint256 newPrice) external onlyOwner {
        emit PackPriceUpdated(packPrice, newPrice);
        packPrice = newPrice;
    }

    /**
     * @notice Update base URI used for metadata.
     */
    function setBaseURI(string memory newBaseURI) external onlyOwner {
        baseMetadataURI = newBaseURI;
        _setURI(newBaseURI);
    }

    /**
     * @notice Withdraw all ETH balance to a given address.
     */
    function withdraw(address payable to) external onlyOwner {
        require(to != address(0), "zero address");
        uint256 bal = address(this).balance;
        require(bal > 0, "no funds");
        to.transfer(bal);
    }

    // ---------------------- Packs ----------------------

    /**
     * @notice Open `amount` packs. Each pack mints exactly 1 random card.
     */
    function openPack(uint256 amount) external payable {
        require(amount > 0, "amount is zero");
        require(msg.value == packPrice * amount, "incorrect ETH sent");

        for (uint256 i = 0; i < amount; i++) {
            uint256 cardId = _randomAvailableCard(i);
            _mintCard(msg.sender, cardId, 1);
            emit PackOpened(msg.sender, cardId);
        }
    }

    /**
     * @dev Internal mint helper with supply checks.
     */
    function _mintCard(address to, uint256 cardId, uint256 amount) internal {
        CardInfo storage info = cards[cardId];

        require(info.maxSupply > 0, "card does not exist");
        require(info.minted + amount <= info.maxSupply, "max supply reached");

        info.minted += amount;
        _mint(to, cardId, amount, "");
    }

    /**
     * @dev Very simple pseudo-random selection.
     *      For serious randomness, integrate an oracle such as Chainlink VRF.
     */
    function _randomAvailableCard(uint256 nonce) internal view returns (uint256) {
        require(nextCardId > 0, "no cards defined");

        // 1) Sum total weight of all non-exhausted card types
        uint256 totalWeight = 0;
        for (uint256 id = 0; id < nextCardId; id++) {
            CardInfo storage info = cards[id];
            if (info.minted < info.maxSupply && info.weight > 0) {
                totalWeight += info.weight;
            }
        }
        require(totalWeight > 0, "all cards minted");

        // 2) Draw pseudo-random number in [0, totalWeight)
        uint256 rand = uint256(
            keccak256(
                abi.encodePacked(
                    block.prevrandao,
                    block.timestamp,
                    msg.sender,
                    nonce
                )
            )
        ) % totalWeight;

        // 3) Walk through weighted list
        uint256 running = 0;
        for (uint256 id2 = 0; id2 < nextCardId; id2++) {
            CardInfo storage info2 = cards[id2];
            if (info2.minted >= info2.maxSupply || info2.weight == 0) continue;

            running += info2.weight;
            if (rand < running) {
                return id2;
            }
        }

        // Fallback: should not be hit in practice
        return 0;
    }

    // ---------------------- Metadata ----------------------

    /**
     * @dev Standard ERC1155 uri override.
     *      Many marketplaces expect {id} replacement in the URI.
     */
    function uri(uint256) public view override returns (string memory) {
        return baseMetadataURI;
    }
}