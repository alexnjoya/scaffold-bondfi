// Token interface
export interface Token {
  id: number
  symbol: string;
  name: string;
  balance: number;
  address?: string;
  pool: string[];
  poolId?: number[];
  img?: string; // Optional image URL for the token
}

// Updated Token array with new addresses
const tokens: Token[] = [
  { 
    id: 1,
    symbol: 'ETH', 
    name: 'Ethereum', 
    balance: 0.5,
    address: '0x4B2D72c1CB89c0B2B320C43BB67fF79f562f5FF4', // Native ETH has no contract
    pool: ["AFR","USDT"],
    poolId: [1, 2],
    img: "https://assets.pancakeswap.finance/web/native/1.png"
  },
  { 
    id: 2,
    symbol: 'USDT', 
    name: 'Tether USD', 
    balance: 2,
    address: '0xC7d68ce9A8047D4bF64E6f7B79d388a11944A06E', // ✅ USDT
    pool: ["ETH", "AFX"],
    poolId: [2, 6],
    img: 'https://coin-images.coingecko.com/coins/images/39963/large/usdt.png?1724952731'
  },
  { 
    id: 3,
    symbol: 'WETH', 
    name: 'Wrapped Ethereum', 
    balance: 1250,
    address: '0x48D2210bd4E72c741F74E6c0E8f356b2C36ebB7A', // ✅ WETH 
    pool: [],
    poolId: [],
    img: 'https://coin-images.coingecko.com/coins/images/39810/large/weth.png?1724139790'
  },
  { 
    id: 4,
    symbol: 'AFR', 
    name: 'AfriRemit', 
    balance: 1250,
    address: '0x8F11F588B1Cc0Bc88687F7d07d5A529d34e5CD84', // ✅ AFR
    pool: ["ETH"],
    poolId: [1],
    img: 'https://app.mantle.xyz/icons/NetworkMantle.svg'
  },
  { 
    id: 5,
    symbol: 'AFX', 
    name: 'AfriStable', 
    balance: 1250,
    address: '0xCcD4D22E24Ab5f9FD441a6E27bC583d241554a3c', // ✅ AFX
    pool: ["cZAR", "USDT"],
    poolId: [5, 6],
    img: 'https://www.xe.com/svgs/flags/ngn.static.svg'
  },
  { 
    id: 6,
    symbol: 'cNGN', 
    name: 'Crypto Naira', 
    balance: 1250,
    address: '0x7dd1aD415F58D91BbF76BcC2640cc6FdD44Aa94b', // ✅ cNGN
    pool: ["cZAR"],
    poolId: [3],
    img: 'https://www.xe.com/svgs/flags/ngn.static.svg'
  },
  { 
    id: 7,
    symbol: 'cZAR', 
    name: 'Crypto South African Rand', 
    balance: 1250,
    address: '0x48686EA995462d611F4DA0d65f90B21a30F259A5', // ✅ cZAR
    pool: ["cNGN", "AFX"],
    poolId: [3, 5],
    img: 'https://www.xe.com/svgs/flags/zar.static.svg'
  },
  { 
    id: 8,
    symbol: 'cGHS', 
    name: 'Crypto Ghanaian Cedi', 
    balance: 1250,
    address: '0xaC56E37f70407f279e27cFcf2E31EdCa888EaEe4', // ✅ cGHS
    pool: ["cKES"],
    poolId: [4],
    img: 'https://www.xe.com/svgs/flags/ghs.static.svg'
  },
  { 
    id: 9,
    symbol: 'cKES', 
    name: 'Crypto Kenyan Shilling', 
    balance: 1250,
    address: '0xC0c182d9895882C61C1fC1DF20F858e5E29a4f71', // ✅ cKES
    pool: ["cGHS"],
    poolId: [4],
    img: 'https://www.xe.com/svgs/flags/kes.static.svg'
  },
];


export default tokens;
