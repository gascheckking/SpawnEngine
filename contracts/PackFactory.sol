// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./TokenPackSeries.sol";

contract PackFactory {
    event SeriesDeployed(address series, address creator, address payoutToken, uint256 packPrice, address reserveGuard);

    address public immutable platformFeeRecipient; // receives 35% of pack price
    address public owner;

    constructor(address _platformFeeRecipient) {
        owner = msg.sender;
        platformFeeRecipient = _platformFeeRecipient;
    }

    modifier onlyOwner() { require(msg.sender == owner, "not owner"); _; }

    /// @notice Deploy a TokenPackSeries (ERC20 payout).
    function deployTokenSeries(
        address payoutToken,
        uint256 packPrice,
        address creatorRecipient,
        address reserveGuard
    ) external returns (address) {
        TokenPackSeries s = new TokenPackSeries(
            payoutToken,
            packPrice,
            creatorRecipient,
            platformFeeRecipient,
            reserveGuard,
            msg.sender
        );
        emit SeriesDeployed(address(s), creatorRecipient, payoutToken, packPrice, reserveGuard);
        return address(s);
    }
}

