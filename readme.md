# TokenSwap Project Documentation

TokenSwap is a decentralized exchange platform built on Ethereum blockchain using Solidity smart contracts, NestJS for backend, and Next.js for frontend. This documentation provides an overview of the project architecture, functionalities, and usage instructions.

## Smart Contract

The smart contract facilitates token swapping between users. It allows users to create, cancel, and fill orders for exchanging tokens.

### Features

- Create an order to swap tokens.
- Cancel an existing order.
- Fill an existing order by swapping tokens.

### Technologies Used

- Solidity ^0.8.24
- OpenZeppelin Contracts for ERC20 and SafeERC20 implementations.

### Contract Functions

- `createOrder`: Creates a new order for swapping tokens.
- `cancelOrder`: Cancels an existing order.
- `fillOrder`: Fills an existing order by swapping tokens.

## Backend (NestJS)

The backend of the TokenSwap project is built with NestJS, providing RESTful APIs to interact with the smart contract and store order information in the database.

### API Endpoints

1. `/api?query`: Fetches existing orders based on token(s) and user(s) address.
2. `/api/id/{id}`: Fetches an order by its ID.

### Database

The backend stores order information in a supabase.

## Frontend (Next.js)

The frontend of the TokenSwap project is built with Next.js, providing a user-friendly interface to create and view orders.

### Pages

1. **Create Order Page**: Allows users to create a new order for swapping tokens.
2. **View Orders Page**: Allows users to view existing orders and interact with them.

### Technologies Used

- Web3Modal: For connecting to ethereum wallets.
- WAGMI: For ethereum wallet management.
- Viem: For web3 integration.
- Next.js: For building the user interface.

## Deployment

- **Smart Contract**: Deployed on the Sepolia testnet.
- **Backend**: Hosted using NGROK.
- **Frontend**: Deployed to Vercel.

## Usage

1. Connect your Ethereum wallet using Web3Modal.
2. Create an order by specifying the tokens and amounts to swap.
3. View existing orders and interact with them as needed.

## Getting Started

To get started with the TokenSwap project:

1. [Clone the repository](https://github.com/treasure0217/Token-Swap-Test)
2. Install dependencies for backend and frontend.
3. Configure environment variables.
4. Deploy the smart contract and backend.
5. Deploy the frontend.

## Contributors

- [Vasyl Dzinevskyi](https://github.com/treasure0217)

## Acknowledgements
This project is a home task submission for <strong>`zapit.io`</strong>. Special thanks to <strong>`Romit`</strong> for providing the challenge.
