// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20, SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";

contract TokenSwap {
  using SafeERC20 for IERC20;
  using Address for address payable;

  struct Order {
    address seller;
    address tokenA;
    uint256 amountA;
    address tokenB;
    uint256 amountB;
  }

  mapping(bytes32 => Order) public orders;

  event OrderCreated(
    bytes32 indexed id,
    address indexed seller,
    address tokenA,
    address tokenB,
    uint256 amountA,
    uint256 amountB
  );
  event OrderCancelled(bytes32 indexed orderId);
  event OrderFilled(
    bytes32 indexed id,
    address indexed buyer,
    uint256 buyAmount,
    uint256 sellAmount
  );

  constructor() {}

  function createOrder(
    address _tokenA,
    uint256 _amountA,
    address _tokenB,
    uint256 _amountB
  ) external payable {
    require(_amountA > 0 && _amountB > 0, "Amount must be greater than zero");

    bytes32 id = keccak256(abi.encodePacked(_tokenA, _tokenB, _amountA, _amountB, block.timestamp));
    orders[id] = Order({
      seller: msg.sender,
      tokenA: _tokenA,
      amountA: _amountA,
      tokenB: _tokenB,
      amountB: _amountB
    });

    if (_tokenA == address(0)) {
      require(msg.value == _amountA, "Invalid amount");
    } else {
      IERC20(_tokenA).safeTransferFrom(msg.sender, address(this), _amountA);
    }

    emit OrderCreated(id, msg.sender, _tokenA, _tokenB, _amountA, _amountB);
  }

  function cancelOrder(bytes32 id) external {
    Order memory order = orders[id];
    require(order.seller == msg.sender, "Only seller can cancel the order");
    require(order.amountA > 0, "Order already filled");

    uint256 amount = order.amountA;
    order.amountA = 0;
    order.amountB = 0;
    orders[id] = order;

    if (order.tokenA == address(0)) {
      payable(order.seller).sendValue(amount);
    } else {
      IERC20(order.tokenA).safeTransfer(order.seller, amount);
    }

    emit OrderCancelled(id);
  }

  function fillOrder(bytes32 id, uint256 _amountB) external payable {
    Order memory order = orders[id];
    require(order.amountA > 0, "Order already filled");
    require(_amountB > 0 && _amountB <= order.amountB, "Invalid amount");

    uint256 amountA = (order.amountA * _amountB) / order.amountB;
    order.amountA -= amountA;
    order.amountB -= _amountB;
    orders[id] = order;

    if (order.tokenB == address(0)) {
      require(msg.value == _amountB, "Invalid amount");
      payable(order.seller).sendValue(_amountB);
    } else {
      IERC20(order.tokenB).safeTransferFrom(msg.sender, order.seller, _amountB);
    }

    if (order.tokenA == address(0)) {
      payable(msg.sender).sendValue(amountA);
    } else {
      IERC20(order.tokenA).safeTransfer(msg.sender, amountA);
    }

    emit OrderFilled(id, msg.sender, _amountB, amountA);
  }
}
