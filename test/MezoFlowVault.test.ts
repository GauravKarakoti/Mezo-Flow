import { expect } from "chai";
import { network } from "hardhat";

const { ethers, networkHelpers } = await network.connect();
const { loadFixture, time } = networkHelpers;

describe("MezoFlowVault", function () {
  async function deployFixture() {
    const [owner, alice, bob, treasury] = await ethers.getSigners();

    const MockMUSD = await ethers.getContractFactory("MockMUSD");
    const musd = (await MockMUSD.deploy()) as any;
    await musd.waitForDeployment();

    const MockSavingsVault = await ethers.getContractFactory("MockSavingsVault");
    const savings = (await MockSavingsVault.deploy(await musd.getAddress())) as any;
    await savings.waitForDeployment();

    const Vault = await ethers.getContractFactory("MezoFlowVault");
    const vault = (await Vault.deploy(
      await musd.getAddress(),
      await savings.getAddress(),
      treasury.address,
      "Mezo Flow MUSD",
      "mzFLOW-MUSD"
    )) as any;
    await vault.waitForDeployment();

    // Seed Alice and Bob with MUSD
    await musd.mint(alice.address, ethers.parseEther("10000"));
    await musd.mint(bob.address, ethers.parseEther("10000"));

    return { vault, musd, savings, owner, alice, bob, treasury };
  }

  describe("Deployment", function () {
    it("sets name and symbol correctly", async function () {
      const { vault } = await loadFixture(deployFixture);
      expect(await vault.name()).to.equal("Mezo Flow MUSD");
      expect(await vault.symbol()).to.equal("mzFLOW-MUSD");
    });

    it("sets asset to MUSD", async function () {
      const { vault, musd } = await loadFixture(deployFixture);
      expect(await vault.asset()).to.equal(await musd.getAddress());
    });

    it("starts with zero total assets", async function () {
      const { vault } = await loadFixture(deployFixture);
      expect(await vault.totalAssets()).to.equal(0);
    });
  });

  describe("Deposits", function () {
    it("mints shares and deploys into savings vault", async function () {
      const { vault, musd, savings, alice } = await loadFixture(deployFixture);
      const amount = ethers.parseEther("100");

      await musd.connect(alice).approve(await vault.getAddress(), amount);
      await vault.connect(alice).deposit(amount, alice.address);

      // Vault has no idle MUSD (all deployed)
      expect(await musd.balanceOf(await vault.getAddress())).to.equal(0);
      // Savings vault holds the MUSD
      expect(await musd.balanceOf(await savings.getAddress())).to.equal(amount);
      // Alice owns the shares
      expect(await vault.balanceOf(alice.address)).to.equal(amount);
      // totalAssets reflects the deployed capital
      expect(await vault.totalAssets()).to.equal(amount);
    });

    it("mints exact shares via mint()", async function () {
      const { vault, musd, alice } = await loadFixture(deployFixture);
      const shares = ethers.parseEther("50");

      await musd.connect(alice).approve(await vault.getAddress(), ethers.parseEther("50"));
      await vault.connect(alice).mint(shares, alice.address);

      expect(await vault.balanceOf(alice.address)).to.equal(shares);
    });

    it("emits Deposit event", async function () {
      const { vault, musd, alice } = await loadFixture(deployFixture);
      const amount = ethers.parseEther("100");

      await musd.connect(alice).approve(await vault.getAddress(), amount);
      await expect(vault.connect(alice).deposit(amount, alice.address))
        .to.emit(vault, "Deposit")
        .withArgs(alice.address, alice.address, amount, amount);
    });
  });

  describe("Withdrawals", function () {
    it("returns MUSD and burns shares", async function () {
      const { vault, musd, alice } = await loadFixture(deployFixture);
      const amount = ethers.parseEther("100");

      await musd.connect(alice).approve(await vault.getAddress(), amount);
      await vault.connect(alice).deposit(amount, alice.address);

      const before = await musd.balanceOf(alice.address);
      await vault.connect(alice).withdraw(amount, alice.address, alice.address);
      const after = await musd.balanceOf(alice.address);

      expect(after - before).to.equal(amount);
      expect(await vault.balanceOf(alice.address)).to.equal(0);
    });

    it("redeems shares for MUSD", async function () {
      const { vault, musd, alice } = await loadFixture(deployFixture);
      const amount = ethers.parseEther("100");

      await musd.connect(alice).approve(await vault.getAddress(), amount);
      await vault.connect(alice).deposit(amount, alice.address);

      await vault.connect(alice).redeem(amount, alice.address, alice.address);
      expect(await vault.balanceOf(alice.address)).to.equal(0);
    });

    it("allows partial withdrawal", async function () {
      const { vault, musd, alice } = await loadFixture(deployFixture);
      const amount = ethers.parseEther("100");
      const half = amount / 2n;

      await musd.connect(alice).approve(await vault.getAddress(), amount);
      await vault.connect(alice).deposit(amount, alice.address);

      await vault.connect(alice).withdraw(half, alice.address, alice.address);
      expect(await vault.balanceOf(alice.address)).to.equal(half);
      expect(await vault.totalAssets()).to.equal(half);
    });

    it("reverts if user has insufficient shares", async function () {
      const { vault, alice } = await loadFixture(deployFixture);
      await expect(
        vault.connect(alice).withdraw(ethers.parseEther("1"), alice.address, alice.address)
      ).to.be.revert(ethers);
    });
  });

  describe("Yield accrual", function () {
    it("reflects savings vault yield in totalAssets", async function () {
      const { vault, musd, savings, alice } = await loadFixture(deployFixture);
      const amount = ethers.parseEther("100");

      await musd.connect(alice).approve(await vault.getAddress(), amount);
      await vault.connect(alice).deposit(amount, alice.address);

      // Simulate 10% yield by sending MUSD directly into the savings vault
      const yieldAmount = ethers.parseEther("10");
      await musd.mint(alice.address, yieldAmount);
      await musd.connect(alice).approve(await savings.getAddress(), yieldAmount);
      await savings.connect(alice).simulateYield(yieldAmount);

      expect(await vault.totalAssets()).to.be.closeTo(
        ethers.parseEther("110"),
        ethers.parseEther("0.01")
      );
    });

    it("gives the yield to the depositor on withdrawal", async function () {
      const { vault, musd, savings, alice } = await loadFixture(deployFixture);
      const amount = ethers.parseEther("100");

      await musd.connect(alice).approve(await vault.getAddress(), amount);
      await vault.connect(alice).deposit(amount, alice.address);

      const yieldAmount = ethers.parseEther("10");
      await musd.mint(alice.address, yieldAmount);
      await musd.connect(alice).approve(await savings.getAddress(), yieldAmount);
      await savings.connect(alice).simulateYield(yieldAmount);

      const before = await musd.balanceOf(alice.address);
      await vault.connect(alice).redeem(await vault.balanceOf(alice.address), alice.address, alice.address);
      const after = await musd.balanceOf(alice.address);

      expect(after - before).to.be.closeTo(
        ethers.parseEther("110"),
        ethers.parseEther("0.01")
      );
    });
  });

  describe("Harvest", function () {
    it("reverts if called too soon", async function () {
      const { vault } = await loadFixture(deployFixture);
      await expect(vault.harvest()).to.be.revertedWith("Harvest too soon");
    });

    it("takes performance fee to treasury after interval", async function () {
      const { vault, musd, savings, alice, treasury } = await loadFixture(deployFixture);
      const amount = ethers.parseEther("100");

      await musd.connect(alice).approve(await vault.getAddress(), amount);
      await vault.connect(alice).deposit(amount, alice.address);

      const yieldAmount = ethers.parseEther("10");
      await musd.mint(alice.address, yieldAmount);
      await musd.connect(alice).approve(await savings.getAddress(), yieldAmount);
      await savings.connect(alice).simulateYield(yieldAmount);

      await time.increase(86400 + 1);

      const before = await musd.balanceOf(treasury.address);
      await vault.harvest();
      const after = await musd.balanceOf(treasury.address);

      // 10% of 10 MUSD profit = 1 MUSD
      expect(after - before).to.be.closeTo(
        ethers.parseEther("1"),
        ethers.parseEther("0.01")
      );
    });
  });

  describe("Admin", function () {
    it("only owner can set performance fee", async function () {
      const { vault, alice } = await loadFixture(deployFixture);
      await expect(vault.connect(alice).setPerformanceFee(500)).to.be.revert(ethers);
    });

    it("caps performance fee at 20%", async function () {
      const { vault } = await loadFixture(deployFixture);
      await expect(vault.setPerformanceFee(2001)).to.be.revertedWith("Fee too high");
    });

    it("can pause and unpause", async function () {
      const { vault, musd, alice } = await loadFixture(deployFixture);
      await vault.pause();

      await musd.connect(alice).approve(await vault.getAddress(), ethers.parseEther("1"));
      await expect(
        vault.connect(alice).deposit(ethers.parseEther("1"), alice.address)
      ).to.be.revert(ethers);

      await vault.unpause();
      await vault.connect(alice).deposit(ethers.parseEther("1"), alice.address);
    });

    it("can toggle autoDeploy", async function () {
      const { vault, musd, alice } = await loadFixture(deployFixture);
      await vault.setAutoDeploy(false);

      await musd.connect(alice).approve(await vault.getAddress(), ethers.parseEther("100"));
      await vault.connect(alice).deposit(ethers.parseEther("100"), alice.address);

      expect(await vault.idleAssets()).to.equal(ethers.parseEther("100"));
    });
  });
});