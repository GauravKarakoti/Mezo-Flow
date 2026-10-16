// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title ISavingsVault
/// @notice Minimal ERC-4626-compatible interface for Mezo's MUSD Savings Vault.
/// @dev Verify the actual interface against Mezo docs before mainnet deployment.
interface ISavingsVault {
    function asset() external view returns (address);

    function deposit(uint256 assets, address receiver) external returns (uint256 shares);

    function redeem(uint256 shares, address receiver, address owner) external returns (uint256 assets);

    function balanceOf(address account) external view returns (uint256);

    function convertToAssets(uint256 shares) external view returns (uint256);

    function previewRedeem(uint256 shares) external view returns (uint256);
}