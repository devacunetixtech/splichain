const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SplitChain", function () {
  async function deployFixture() {
    const [owner, alice, bob, carol, outsider] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("SplitChain");
    const splitChain = await factory.deploy();
    await splitChain.waitForDeployment();
    const recipients = [alice.address, bob.address, carol.address];
    const shares = [5000, 3000, 2000];
    return { splitChain, owner, alice, bob, carol, outsider, recipients, shares };
  }

  it("creates a valid 50/30/20 split", async function () {
    const { splitChain, owner, recipients, shares } = await deployFixture();
    await expect(splitChain.createSplit("Launch team", recipients, shares)).to.emit(splitChain, "SplitCreated").withArgs(0, owner.address, "Launch team");
    const split = await splitChain.getSplit(0);
    expect(split.owner).to.equal(owner.address);
    expect(split.sharesBps).to.deep.equal(shares.map(BigInt));
  });

  it("requires percentages to total exactly 100%", async function () {
    const { splitChain, recipients } = await deployFixture();
    await expect(splitChain.createSplit("Bad split", recipients, [5000, 3000, 1900])).to.be.revertedWithCustomError(splitChain, "InvalidTotalPercentage").withArgs(9900);
  });

  it("rejects zero and duplicate recipient addresses", async function () {
    const { splitChain, alice, bob } = await deployFixture();
    await expect(splitChain.createSplit("Zero", [alice.address, ethers.ZeroAddress], [5000, 5000])).to.be.revertedWithCustomError(splitChain, "ZeroAddress");
    await expect(splitChain.createSplit("Duplicate", [alice.address, bob.address, alice.address], [4000, 3000, 3000])).to.be.revertedWithCustomError(splitChain, "DuplicateRecipient");
  });

  it("blocks unauthorized distribution", async function () {
    const { splitChain, outsider, recipients, shares } = await deployFixture();
    await splitChain.createSplit("Core team", recipients, shares);
    await splitChain.deposit(0, { value: ethers.parseEther("1") });
    await expect(splitChain.connect(outsider).distribute(0)).to.be.revertedWithCustomError(splitChain, "Unauthorized");
  });

  it("distributes the complete balance and preserves exact accounting", async function () {
    const { splitChain, owner, alice, bob, carol, recipients, shares } = await deployFixture();
    await splitChain.createSplit("Launch team", recipients, shares);
    const amount = ethers.parseEther("100") + 1n;
    await splitChain.deposit(0, { value: amount });
    const before = await Promise.all([alice, bob, carol].map((signer) => ethers.provider.getBalance(signer.address)));
    await expect(splitChain.distribute(0)).to.emit(splitChain, "Distributed").withArgs(0, owner.address, amount, 1);
    const after = await Promise.all([alice, bob, carol].map((signer) => ethers.provider.getBalance(signer.address)));
    expect(after[0] - before[0]).to.equal((amount * 5000n) / 10_000n);
    expect(after[1] - before[1]).to.equal((amount * 3000n) / 10_000n);
    expect(after[2] - before[2]).to.equal(amount - (amount * 5000n) / 10_000n - (amount * 3000n) / 10_000n);
    expect((await splitChain.getSplit(0)).balance).to.equal(0);
  });

  it("rolls back if a recipient rejects payment", async function () {
    const { splitChain, alice } = await deployFixture();
    const receiverFactory = await ethers.getContractFactory("RevertingRecipient");
    const receiver = await receiverFactory.deploy();
    await splitChain.createSplit("Safe rollback", [alice.address, await receiver.getAddress()], [5000, 5000]);
    await splitChain.deposit(0, { value: ethers.parseEther("2") });
    await expect(splitChain.distribute(0)).to.be.revertedWithCustomError(splitChain, "TransferFailed");
    expect((await splitChain.getSplit(0)).balance).to.equal(ethers.parseEther("2"));
  });

  it("rejects direct BOT transfers", async function () {
    const { splitChain, owner } = await deployFixture();
    await expect(owner.sendTransaction({ to: await splitChain.getAddress(), value: 1n })).to.be.revertedWithCustomError(splitChain, "DirectPaymentsDisabled");
  });
});
