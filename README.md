# 🏦 BondFi - DeFi Platform for Savings Circles & Global Payments

<h4 align="center">
  <a href="https://docs.scaffoldeth.io">Scaffold-ETH 2 Docs</a> |
  <a href="https://scaffoldeth.io">Scaffold-ETH 2</a>
</h4>

🧪 **BondFi** is a decentralized finance (DeFi) platform built on Ethereum that empowers communities through savings circles, merchant networks, and cross-border payments using stablecoins. It's designed to make financial services accessible to everyone, especially in emerging markets.

⚙️ Built using **Scaffold-ETH 2** framework with NextJS, RainbowKit, Hardhat, Wagmi, Viem, and TypeScript.

## 🚀 Key Features

### 💰 **Savings Circles (Susu/ROSCA)**
- **Join or Create Circles**: Participate in rotating savings groups with transparent smart contracts
- **Automated Payouts**: Smart contract-managed distributions with no human intervention
- **Community Building**: Connect with friends, family, and community members
- **Transparent Tracking**: Real-time visibility into contributions and payouts

### 🏪 **Merchant Network**
- **Verified Merchants**: Shop at trusted local businesses using stablecoins
- **Credit Building**: Establish financial history through merchant transactions
- **Loyalty Programs**: Earn rewards and benefits for shopping with network merchants
- **Marketplace**: Browse products and services from verified vendors

### 🌍 **Cross-Border Payments**
- **Global Remittances**: Send money across borders instantly with minimal fees
- **Stablecoin Support**: Use cUSD, cGHS, cZAR, and other stablecoins
- **Low-Cost Transfers**: Significantly cheaper than traditional remittance services
- **Instant Settlement**: Blockchain-based transfers with immediate confirmation

### 🔐 **DeFi Services**
- **Token Swapping**: Exchange between different stablecoins and tokens
- **Staking & Yield**: Earn returns on your stablecoin holdings
- **Multi-Signature Wallets**: Secure group wallets for communities and DAOs
- **Credit Scoring**: Build verifiable financial history on-chain

## 🏗️ Architecture

This project is built on **Scaffold-ETH 2**, a comprehensive toolkit for Ethereum dApp development:

- **Smart Contracts**: Built with Solidity and Hardhat for savings circles, payments, and merchant management
- **Frontend**: Modern React app with Next.js App Router and Tailwind CSS
- **State Management**: React hooks and context for application state
- **Blockchain Integration**: Wagmi hooks for Ethereum interactions with TypeScript support
- **Design System**: Custom BondFi design system inspired by Frax with glass morphism effects

## 📋 Requirements

Before you begin, you need to install the following tools:

- [Node (>= v20.18.3)](https://nodejs.org/en/download/)
- Yarn ([v1](https://classic.yarnpkg.com/en/docs/install/) or [v2+](https://yarnpkg.com/getting-started/install))
- [Git](https://git-scm.com/downloads)

## 🚀 Quickstart

To get started with BondFi, follow the steps below:

1. **Install dependencies**:
```bash
cd scaffold-bondfi
yarn install
```

2. **Run a local network** in the first terminal:
```bash
yarn chain
```

This command starts a local Ethereum network using Hardhat. The network runs on your local machine and can be used for testing and development. You can customize the network configuration in `packages/hardhat/hardhat.config.ts`.

3. **Deploy the smart contracts** in a second terminal:
```bash
yarn deploy
```

This command deploys the BondFi smart contracts to the local network. The contracts include savings circle management, payment processing, and merchant verification systems.

4. **Start your NextJS app** in a third terminal:
```bash
yarn start
```

Visit your app on: `http://localhost:3000`. You can interact with your smart contracts using the `Debug Contracts` page and explore the BondFi platform features.

## 🧪 Testing

Run smart contract tests with:
```bash
yarn hardhat:test
```

## 🔧 Development

- **Smart Contracts**: Edit contracts in `packages/hardhat/contracts`
- **Frontend**: Modify the BondFi app in `packages/nextjs/app/bondfi`
- **Deployment**: Update deployment scripts in `packages/hardhat/deploy`
- **Configuration**: Tweak app settings in `packages/nextjs/scaffold.config.ts`

## 🌟 Use Cases

### **For Individuals**
- Join savings circles to build emergency funds
- Shop with merchants to build credit history
- Send money to family abroad affordably
- Access DeFi services without traditional banking

### **For Communities**
- Create and manage savings groups
- Establish merchant networks
- Build financial inclusion programs
- Coordinate community funds through multi-sig wallets

### **For Merchants**
- Accept stablecoin payments
- Access new customer bases
- Build loyalty programs
- Reduce payment processing costs

## 🔗 Supported Networks

- **Local Development**: Hardhat local network
- **Testnets**: Sepolia, Goerli
- **Mainnet**: Ethereum (planned)

## 📚 Documentation

- **Scaffold-ETH 2**: [docs.scaffoldeth.io](https://docs.scaffoldeth.io)
- **BondFi Platform**: Platform-specific documentation coming soon
- **Smart Contract API**: Contract interfaces and function documentation

## 🤝 Contributing

We welcome contributions to BondFi! This project aims to make DeFi accessible to everyone, especially in emerging markets.

Please see [CONTRIBUTING.MD](https://github.com/scaffold-eth/scaffold-eth-2/blob/main/CONTRIBUTING.md) for more information and guidelines for contributing to Scaffold-ETH 2.

## 📄 License

This project is licensed under the MIT License - see the [LICENCE](LICENCE) file for details.

## 🙏 Acknowledgments

- Built on [Scaffold-ETH 2](https://github.com/scaffold-eth/scaffold-eth-2)
- Inspired by traditional savings circles (Susu, ROSCA, etc.)
- Designed for financial inclusion in emerging markets
- Community-driven development approach
