// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @dev Test-only savings vault that simulates share-price growth.
///      Use `simulateYield` to inflate the vault's assets without minting shares.
contract MockSavingsVault is ERC4626 {
    using SafeERC20 for IERC20;

    constructor(IERC20 _asset) ERC4626(_asset) ERC20("Mock Savings MUSD", "svMUSD") {}

    /// @notice Directly transfer MUSD into the vault to simulate yield accrual.
    function simulateYield(uint256 amount) external {
        IERC20(asset()).safeTransferFrom(msg.sender, address(this), amount);
    }
}