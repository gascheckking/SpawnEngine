// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./ReserveGuard.sol";

/// @notice Buy -> Open -> Payout + Burn/Gamble loops.
/// Architecture: 4 core contracts to start; unlimited series via Factory.
contract TokenPackSeries is ERC721Enumerable, Ownable {
    IERC20 public immutable payoutToken;
    ReserveGuard public immutable guard;

    address public immutable creator;
    address public immutable platform;

    uint256 public immutable packPrice;    // in payoutToken decimals
    uint256 public nextId = 1;
    uint256 public escrow;                 // 15% accumulation for payouts

    // revenue splits (fixed v1)
    uint256 public constant CREATOR_BPS = 5000;  // 50%
    uint256 public constant PLATFORM_BPS = 3500; // 35%
    uint256 public constant TREASURY_BPS = 1500; // 15%

    // multipliers scaled 1e18
    uint256 public multCommon = 1e17;      // 0.1x
    uint256 public multRare   = 11e17;     // 1.1x
    uint256 public multLeg    = 40e18;     // 40x
    uint256 public multMyth   = 200e18;    // 200x

    // probabilities in basis points (sum <= 10000)
    uint16 public probCommon = 9400;  // 94.00%
    uint16 public probRare   = 580;   // 5.80%
    uint16 public probLeg    = 19;    // 0.19%
    uint16 public probMyth   = 1;     // 0.01%

    // token state
    mapping(uint256 => bool) public opened;
    // rarity: 0=unset, 1=Common, 2=Rare, 3=Legendary, 4=Mythic
    mapping(uint256 => uint8) public rarityOf;

    event PackBought(address indexed buyer, uint256 tokenId);
    event PackOpened(address indexed opener, uint256 tokenId, uint256 multiplier, uint256 payout, uint8 rarity);
    event BurnAttempt(address indexed user, uint8 rarity, uint256 countBurned, bool success, uint256 packsMinted);

    constructor(
        address _payoutToken,
        uint256 _packPrice,
        address _creatorRecipient,
        address _platformRecipient,
        address _reserveGuard,
        address _owner
    )
        ERC721("Spawniz Token Pack", "SPACK")
        Ownable(_owner)
    {
        payoutToken = IERC20(_payoutToken);
        packPrice = _packPrice;
        creator = _creatorRecipient;
        platform = _platformRecipient;
        guard = ReserveGuard(_reserveGuard);
    }

    /// @notice Optional bootstrap: pre-fund escrow (creator/top-up).
    function deposit(uint256 amt) external {
        require(payoutToken.transferFrom(msg.sender, address(this), amt), "transferFrom fail");
        escrow += amt;
    }

    function buy(uint256 qty) external {
        uint256 cost = packPrice * qty;
        uint256 toCreator = (cost * CREATOR_BPS) / 10_000;
        uint256 toPlatform = (cost * PLATFORM_BPS) / 10_000;
        uint256 toEscrow = cost - toCreator - toPlatform;

        require(payoutToken.transferFrom(msg.sender, creator, toCreator), "pay creator");
        require(payoutToken.transferFrom(msg.sender, platform, toPlatform), "pay platform");
        require(payoutToken.transferFrom(msg.sender, address(this), toEscrow), "pay escrow");
        escrow += toEscrow;

        for (uint256 i = 0; i < qty; i++) {
            _safeMint(msg.sender, nextId);
            emit PackBought(msg.sender, nextId);
            nextId++;
        }
    }

    /// @notice MVP randomness. Replace with Chainlink VRF in v1.1.
    function _rand(bytes32 salt) internal view returns (uint256) {
        return uint256(keccak256(abi.encodePacked(blockhash(block.number - 1), address(this), salt, msg.sender)));
    }

    function canOpen() public view returns (bool) {
        return guard.canOpen(escrow, packPrice);
    }

    function open(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender, "not owner");
        require(!opened[tokenId], "already");
        require(canOpen(), "RESERVE_LOW");

        opened[tokenId] = true;

        uint256 r = _rand(bytes32(tokenId)) % 10_000;
        uint256 mult;
        uint8 rarity;

        if (r < probMyth) {
            mult = multMyth; rarity = 4;
        } else if (r < probMyth + probLeg) {
            mult = multLeg; rarity = 3;
        } else if (r < probMyth + probLeg + probRare) {
            mult = multRare; rarity = 2;
        } else {
            mult = multCommon; rarity = 1;
        }

        rarityOf[tokenId] = rarity;

        uint256 payout = (mult * packPrice) / 1e18;
        if (payout > escrow) payout = escrow;
        escrow -= payout;
        require(payoutToken.transfer(msg.sender, payout), "payout fail");

        emit PackOpened(msg.sender, tokenId, mult, payout, rarity);
    }

    // =========================
    // Burn/Gamble (config v1)
    // =========================
    // Commons: burn 5 opened commons -> 20% chance to mint 2 packs
    function burnCommonsForTwo(uint256[] calldata tokenIds) external {
        require(tokenIds.length >= 5, "need 5 commons");
        uint256 burned;
        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 id = tokenIds[i];
            require(ownerOf(id) == msg.sender, "not owner");
            require(opened[id] && rarityOf[id] == 1, "not opened common");
            _burn(id);
            burned++;
        }
        bool success = (_rand(keccak256(abi.encodePacked(tokenIds))) % 100) < 20; // 20%
        uint256 minted = 0;
        if (success) {
            _safeMint(msg.sender, nextId); minted++; nextId++;
            _safeMint(msg.sender, nextId); minted++; nextId++;
        }
        emit BurnAttempt(msg.sender, 1, burned, success, minted);
    }

    // Rare: burn 1 opened rare -> 30% chance to mint 2 packs
    function burnRareForTwo(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender, "not owner");
        require(opened[tokenId] && rarityOf[tokenId] == 2, "not opened rare");
        _burn(tokenId);
        bool success = (_rand(bytes32(tokenId)) % 100) < 30; // 30%
        uint256 minted = 0;
        if (success) {
            _safeMint(msg.sender, nextId); minted++; nextId++;
            _safeMint(msg.sender, nextId); minted++; nextId++;
        }
        emit BurnAttempt(msg.sender, 2, 1, success, minted);
    }

    // Legendary: burn 1 opened legendary -> 40% chance to mint 5 packs
    function burnLegendaryForFive(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender, "not owner");
        require(opened[tokenId] && rarityOf[tokenId] == 3, "not opened legendary");
        _burn(tokenId);
        bool success = (_rand(bytes32(tokenId)) % 100) < 40; // 40%
        uint256 minted = 0;
        if (success) {
            for (uint256 i = 0; i < 5; i++) { _safeMint(msg.sender, nextId); minted++; nextId++; }
        }
        emit BurnAttempt(msg.sender, 3, 1, success, minted);
    }

    // Mythic: burn 1 opened mythic -> 45% chance to mint 10 packs
    function burnMythicForTen(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender, "not owner");
        require(opened[tokenId] && rarityOf[tokenId] == 4, "not opened mythic");
        _burn(tokenId);
        bool success = (_rand(bytes32(tokenId)) % 100) < 45; // 45%
        uint256 minted = 0;
        if (success) {
            for (uint256 i = 0; i < 10; i++) { _safeMint(msg.sender, nextId); minted++; nextId++; }
        }
        emit BurnAttempt(msg.sender, 4, 1, success, minted);
    }
}

