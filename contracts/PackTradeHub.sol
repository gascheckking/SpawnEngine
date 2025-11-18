// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * PackTradeHub — simple pack trading between collectors
 * - Any ERC721 collection can be listed (TokenPackSeries, SpawnEnginePack, etc)
 * - Payment can be ETH (payToken = address(0)) or ERC20
 * - Protocol fee -> feeRecipient (your platform)
 */
contract PackTradeHub is Ownable {
    struct Listing {
        address seller;
        address collection;
        uint256 tokenId;
        address payToken; // address(0) = native
        uint256 price;
        bool active;
    }

    uint256 public nextListingId = 1;
    mapping(uint256 => Listing) public listings;

    uint256 public feeBps = 250; // 2.5% fee
    address public feeRecipient;

    event Listed(
        uint256 indexed listingId,
        address indexed seller,
        address indexed collection,
        uint256 tokenId,
        address payToken,
        uint256 price
    );

    event Cancelled(uint256 indexed listingId);
    event Filled(
        uint256 indexed listingId,
        address indexed buyer,
        uint256 price,
        uint256 fee,
        address payToken
    );

    constructor(address _feeRecipient) {
        feeRecipient = _feeRecipient;
    }

    function setFee(uint256 _feeBps) external onlyOwner {
        require(_feeBps <= 1000, "fee too high"); // max 10%
        feeBps = _feeBps;
    }

    function setFeeRecipient(address _to) external onlyOwner {
        require(_to != address(0), "zero");
        feeRecipient = _to;
    }

    function listPack(
        address collection,
        uint256 tokenId,
        address payToken,
        uint256 price
    ) external returns (uint256 id) {
        require(price > 0, "price=0");
        require(collection != address(0), "no collection");

        IERC721 nft = IERC721(collection);
        require(nft.ownerOf(tokenId) == msg.sender, "not owner");
        require(
            nft.getApproved(tokenId) == address(this) || nft.isApprovedForAll(msg.sender, address(this)),
            "not approved"
        );

        id = nextListingId++;
        listings[id] = Listing({
            seller: msg.sender,
            collection: collection,
            tokenId: tokenId,
            payToken: payToken,
            price: price,
            active: true
        });

        emit Listed(id, msg.sender, collection, tokenId, payToken, price);
    }

    function cancel(uint256 listingId) external {
        Listing storage l = listings[listingId];
        require(l.active, "not active");
        require(l.seller == msg.sender || msg.sender == owner(), "not seller");
        l.active = false;
        emit Cancelled(listingId);
    }

    function buy(uint256 listingId) external payable {
        Listing storage l = listings[listingId];
        require(l.active, "not active");

        l.active = false;

        IERC721 nft = IERC721(l.collection);
        require(nft.ownerOf(l.tokenId) == l.seller, "seller not owner");

        uint256 price = l.price;
        uint256 fee = (price * feeBps) / 10_000;
        uint256 toSeller = price - fee;

        if (l.payToken == address(0)) {
            // native
            require(msg.value == price, "wrong ETH amount");
            if (fee > 0 && feeRecipient != address(0)) {
                (bool ok1, ) = payable(feeRecipient).call{value: fee}("");
                require(ok1, "fee fail");
            }
            (bool ok2, ) = payable(l.seller).call{value: toSeller}("");
            require(ok2, "pay seller fail");
        } else {
            // ERC20
            IERC20 token = IERC20(l.payToken);
            require(token.transferFrom(msg.sender, address(this), price), "transferFrom fail");
            if (fee > 0 && feeRecipient != address(0)) {
                require(token.transfer(feeRecipient, fee), "fee xfer fail");
            }
            require(token.transfer(l.seller, toSeller), "seller xfer fail");
        }

        nft.safeTransferFrom(l.seller, msg.sender, l.tokenId);

        emit Filled(listingId, msg.sender, price, fee, l.payToken);
    }
}