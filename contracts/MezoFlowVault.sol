// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ISavingsVault} from "./interfaces/ISavingsVault.sol";

/// @title MezoFlowVault
/// @notice Auto-compounding ERC-4626 vault for MUSD on Mezo.
/// @notice Deposits MUSD, routes it into Mezo's MUSD Savings Vault, and lets users
///         withdraw at any time by burning receipt tokens (mzFLOW-MUSD).
contract MezoFlowVault is ERC4626, Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // ---------------------------------------------------------------------
    // Constants
    // ---------------------------------------------------------------------
    uint256 public constant BASIS_POINTS = 10_000;
    uint256 public constant MAX_PERFORMANCE_FEE = 2_000; // 20%
    uint256 public constant MIN_HARVEST_INTERVAL = 1 hours;

    // ---------------------------------------------------------------------
    // Storage
    // ---------------------------------------------------------------------
    ISavingsVault public savingsVault;

    uint256 public performanceFee = 1_000; // 10%
    address public treasury;

    uint256 public lastHarvest;
    uint256 public harvestInterval = 1 days;
    uint256 public highWaterMark;

    bool public autoDeploy = true;

    // ---------------------------------------------------------------------
    // Events
    // ---------------------------------------------------------------------
    event Harvested(uint256 profit, uint256 fee, uint256 timestamp);
    event SavingsVaultUpdated(address indexed newVault);
    event PerformanceFeeUpdated(uint256 newFee);
    event TreasuryUpdated(address indexed newTreasury);
    event HarvestIntervalUpdated(uint256 newInterval);
    event AutoDeployUpdated(bool enabled);
    event EmergencyWithdraw(uint256 amount);

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------
    constructor(
        IERC20 _asset,
        ISavingsVault _savingsVault,
        address _treasury,
        string memory _name,
        string memory _symbol
    ) ERC4626(_asset) ERC20(_name, _symbol) Ownable(msg.sender) {
        require(address(_savingsVault) != address(0), "Invalid savings vault");
        require(_treasury != address(0), "Invalid treasury");
        require(_savingsVault.asset() == address(_asset), "Asset mismatch");

        savingsVault = _savingsVault;
        treasury = _treasury;
        lastHarvest = block.timestamp;
        highWaterMark = 0;
    }

    // ---------------------------------------------------------------------
    // ERC-4626 core
    // ---------------------------------------------------------------------
    function totalAssets() public view override returns (uint256) {
        uint256 idle = IERC20(asset()).balanceOf(address(this));
        uint256 shares = savingsVault.balanceOf(address(this));
        uint256 deployed = shares > 0 ? savingsVault.convertToAssets(shares) : 0;
        return idle + deployed;
    }

    function _deposit(
        address caller,
        address receiver,
        uint256 assets,
        uint256 shares
    ) internal override nonReentrant whenNotPaused {
        super._deposit(caller, receiver, assets, shares);

        highWaterMark += assets;

        if (autoDeploy && assets > 0) {
            _deployToSavingsVault(assets);
        }
    }

    function _withdraw(
        address caller,
        address receiver,
        address owner,
        uint256 assets,
        uint256 shares
    ) internal override nonReentrant {
        uint256 idle = IERC20(asset()).balanceOf(address(this));
        if (idle < assets) {
            _withdrawFromSavingsVault(assets - idle);
        }

        highWaterMark = highWaterMark > assets ? highWaterMark - assets : 0;

        super._withdraw(caller, receiver, owner, assets, shares);
    }

    // ---------------------------------------------------------------------
    // Internal savings vault helpers
    // ---------------------------------------------------------------------
    function _deployToSavingsVault(uint256 amount) internal {
        IERC20(asset()).forceApprove(address(savingsVault), amount);
        savingsVault.deposit(amount, address(this));
    }

    function _withdrawFromSavingsVault(uint256 amount) internal {
        uint256 shares = savingsVault.balanceOf(address(this));
        if (shares == 0) return;

        uint256 vaultValue = savingsVault.convertToAssets(shares);
        if (vaultValue == 0) return;

        uint256 sharesToRedeem = (amount * shares + vaultValue - 1) / vaultValue;
        if (sharesToRedeem > shares) sharesToRedeem = shares;

        savingsVault.redeem(sharesToRedeem, address(this), address(this));
    }

    // ---------------------------------------------------------------------
    // Harvest
    // ---------------------------------------------------------------------
    function harvest() external nonReentrant returns (uint256 profit, uint256 fee) {
        require(block.timestamp >= lastHarvest + harvestInterval, "Harvest too soon");

        uint256 currentAssets = totalAssets();

        if (currentAssets > highWaterMark) {
            profit = currentAssets - highWaterMark;
            fee = (profit * performanceFee) / BASIS_POINTS;

            if (fee > 0) {
                uint256 idle = IERC20(asset()).balanceOf(address(this));
                if (idle < fee) {
                    _withdrawFromSavingsVault(fee - idle);
                }
                SafeERC20.safeTransfer(IERC20(asset()), treasury, fee);
            }

            highWaterMark = currentAssets - fee;
        }

        lastHarvest = block.timestamp;
        emit Harvested(profit, fee, block.timestamp);
    }

    // ---------------------------------------------------------------------
    // View helpers
    // ---------------------------------------------------------------------
    function vaultValueInSavings() external view returns (uint256) {
        uint256 shares = savingsVault.balanceOf(address(this));
        return shares > 0 ? savingsVault.convertToAssets(shares) : 0;
    }

    function idleAssets() external view returns (uint256) {
        return IERC20(asset()).balanceOf(address(this));
    }

    function previewHarvest() external view returns (uint256 profit, uint256 fee) {
        uint256 currentAssets = totalAssets();
        if (currentAssets > highWaterMark) {
            profit = currentAssets - highWaterMark;
            fee = (profit * performanceFee) / BASIS_POINTS;
        }
    }

    // ---------------------------------------------------------------------
    // Admin
    // ---------------------------------------------------------------------
    function setSavingsVault(ISavingsVault _newVault) external onlyOwner {
        require(address(_newVault) != address(0), "Invalid vault");
        require(_newVault.asset() == asset(), "Asset mismatch");

        _withdrawAllFromSavingsVault();

        savingsVault = _newVault;
        emit SavingsVaultUpdated(address(_newVault));
    }

    function _withdrawAllFromSavingsVault() internal {
        uint256 shares = savingsVault.balanceOf(address(this));
        if (shares > 0) {
            savingsVault.redeem(shares, address(this), address(this));
        }
    }

    function setPerformanceFee(uint256 _newFee) external onlyOwner {
        require(_newFee <= MAX_PERFORMANCE_FEE, "Fee too high");
        performanceFee = _newFee;
        emit PerformanceFeeUpdated(_newFee);
    }

    function setTreasury(address _newTreasury) external onlyOwner {
        require(_newTreasury != address(0), "Invalid treasury");
        treasury = _newTreasury;
        emit TreasuryUpdated(_newTreasury);
    }

    function setHarvestInterval(uint256 _newInterval) external onlyOwner {
        require(_newInterval >= MIN_HARVEST_INTERVAL, "Interval too short");
        harvestInterval = _newInterval;
        emit HarvestIntervalUpdated(_newInterval);
    }

    function setAutoDeploy(bool _enabled) external onlyOwner {
        autoDeploy = _enabled;

        if (!_enabled) {
            _withdrawAllFromSavingsVault();
        } else {
            uint256 idle = IERC20(asset()).balanceOf(address(this));
            if (idle > 0) _deployToSavingsVault(idle);
        }
        emit AutoDeployUpdated(_enabled);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function emergencyWithdrawAll() external onlyOwner {
        _withdrawAllFromSavingsVault();
        emit EmergencyWithdraw(IERC20(asset()).balanceOf(address(this)));
    }

    function rescueTokens(IERC20 token, address to, uint256 amount) external onlyOwner {
        require(address(token) != asset(), "Cannot rescue asset");
        SafeERC20.safeTransfer(token, to, amount);
    }
}