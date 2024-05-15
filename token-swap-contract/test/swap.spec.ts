import { expect } from "chai";
import { deployments } from "hardhat";
import { Ship } from "../utils";
import { MockERC20, TokenSwap, TokenSwap__factory } from "../types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { ZeroAddress, parseEther } from "ethers";

let ship: Ship;
let tokenSwap: TokenSwap;
let token1: MockERC20;
let token2: MockERC20;

let alice: SignerWithAddress;
let bob: SignerWithAddress;

const setup = deployments.createFixture(async (hre) => {
  ship = await Ship.init(hre);
  const { accounts, users } = ship;
  await deployments.fixture(["swap"]);

  return {
    ship,
    accounts,
    users,
  };
});

describe("TokenSwap", () => {
  before(async () => {
    const { accounts } = await setup();

    tokenSwap = (await ship.connect(TokenSwap__factory)) as TokenSwap;
    token1 = (await ship.connect("Token1")) as MockERC20;
    token2 = (await ship.connect("Token2")) as MockERC20;

    alice = accounts.alice;
    bob = accounts.bob;

    await token1.connect(alice).mint(parseEther("100"));
    await token2.connect(bob).mint(parseEther("100"));
    await token1.connect(alice).approve(tokenSwap.target, parseEther("100"));
    await token2.connect(bob).approve(tokenSwap.target, parseEther("100"));
  });

  describe("functionality", () => {
    let orderId: string;
    const getOrderId = (value: string) => {
      orderId = value;
      return true;
    };

    it("Create Order", async () => {
      const tx = tokenSwap
        .connect(alice)
        .createOrder(token1.target, parseEther("1"), token2.target, parseEther("1"));
      await expect(tx)
        .to.be.emit(tokenSwap, "OrderCreated")
        .withArgs(getOrderId, alice.address, token1.target, token2.target, parseEther("1"), parseEther("1"));

      const orderData = await tokenSwap.orders(orderId);

      expect(orderData.seller).to.eq(alice.address);
      expect(orderData.tokenA).to.eq(token1.target);
      expect(orderData.tokenB).to.eq(token2.target);
      expect(orderData.amountA).to.eq(parseEther("1"));
      expect(orderData.amountB).to.eq(parseEther("1"));
    });

    it("Fill Order", async () => {
      const tx = tokenSwap.connect(bob).fillOrder(orderId, parseEther("0.5"));
      await expect(tx)
        .to.be.emit(tokenSwap, "OrderFilled")
        .withArgs(orderId, bob.address, parseEther("0.5"), parseEther("0.5"));

      const orderData = await tokenSwap.orders(orderId);

      expect(orderData.amountA).to.eq(parseEther("0.5"));
      expect(orderData.amountB).to.eq(parseEther("0.5"));
    });

    it("Cancel Order", async () => {
      await expect(tokenSwap.connect(bob).cancelOrder(orderId)).to.revertedWith(
        "Only seller can cancel the order",
      );
      await expect(tokenSwap.connect(alice).cancelOrder(orderId))
        .to.emit(tokenSwap, "OrderCancelled")
        .withArgs(orderId);

      const orderData = await tokenSwap.orders(orderId);

      expect(orderData.amountA).to.eq(0);
      expect(orderData.amountB).to.eq(0);
    });
  });

  it("Check swap rate", async () => {
    let orderId: string = "";
    const getOrderId = (value: string) => {
      orderId = value;
      return true;
    };

    await expect(
      tokenSwap.connect(alice).createOrder(token1.target, parseEther("2"), token2.target, parseEther("1")),
    )
      .to.be.emit(tokenSwap, "OrderCreated")
      .withArgs(getOrderId, alice.address, token1.target, token2.target, parseEther("2"), parseEther("1"));

    await expect(tokenSwap.connect(bob).fillOrder(orderId, parseEther("0.5"))).to.changeTokenBalances(
      token1,
      [bob.address, tokenSwap.target],
      [parseEther("1"), -1n * parseEther("1")],
    );
    await expect(tokenSwap.connect(bob).fillOrder(orderId, parseEther("0.5"))).to.changeTokenBalances(
      token2,
      [bob.address, alice.address],
      [-1n * parseEther("0.5"), parseEther("0.5")],
    );
  });

  it("ETH -> token", async () => {
    let orderId: string = "";
    const getOrderId = (value: string) => {
      orderId = value;
      return true;
    };

    await expect(
      tokenSwap.connect(alice).createOrder(ZeroAddress, parseEther("2"), token2.target, parseEther("1")),
    ).to.revertedWith("Invalid amount");

    await expect(
      tokenSwap.connect(alice).createOrder(ZeroAddress, parseEther("2"), token2.target, parseEther("1"), {
        value: parseEther("2"),
      }),
    )
      .to.be.emit(tokenSwap, "OrderCreated")
      .withArgs(getOrderId, alice.address, ZeroAddress, token2.target, parseEther("2"), parseEther("1"));

    await expect(tokenSwap.connect(bob).fillOrder(orderId, parseEther("0.5"))).to.changeEtherBalances(
      [bob.address, tokenSwap.target],
      [parseEther("1"), -1n * parseEther("1")],
    );
    await expect(tokenSwap.connect(bob).fillOrder(orderId, parseEther("0.5"))).to.changeTokenBalances(
      token2,
      [bob.address, alice.address],
      [-1n * parseEther("0.5"), parseEther("0.5")],
    );
  });

  it("token -> ETH", async () => {
    let orderId: string = "";
    const getOrderId = (value: string) => {
      orderId = value;
      return true;
    };

    await expect(
      tokenSwap.connect(alice).createOrder(token1.target, parseEther("2"), ZeroAddress, parseEther("1")),
    )
      .to.be.emit(tokenSwap, "OrderCreated")
      .withArgs(getOrderId, alice.address, token1.target, ZeroAddress, parseEther("2"), parseEther("1"));
    await expect(tokenSwap.connect(bob).fillOrder(orderId, parseEther("0.5"))).to.revertedWith(
      "Invalid amount",
    );

    await expect(
      tokenSwap.connect(bob).fillOrder(orderId, parseEther("0.5"), {
        value: parseEther("0.5"),
      }),
    ).to.changeTokenBalances(
      token1,
      [bob.address, tokenSwap.target],
      [parseEther("1"), -1n * parseEther("1")],
    );
    await expect(
      tokenSwap.connect(bob).fillOrder(orderId, parseEther("0.5"), {
        value: parseEther("0.5"),
      }),
    ).to.changeEtherBalances([bob.address, alice.address], [-1n * parseEther("0.5"), parseEther("0.5")]);
  });
});
