"use client";

interface PriceCardProps {
  name: string;
  price: string;
  symbol: string;
}

export function PriceCards() {
  const tokens: PriceCardProps[] = [
    { name: "cUSD Price", price: "$1.00", symbol: "cUSD" },
    { name: "cGHS Price", price: "₵12.45", symbol: "cGHS" },
    { name: "cNaira Price", price: "₦1,250", symbol: "cNaira" },
    { name: "cZAR Price", price: "R18.75", symbol: "cZAR" }
  ];

  return (
    <section className="relative z-20 w-full bg-black px-6 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {tokens.map((token, index) => (
            <PriceCard 
              key={token.name}
              name={token.name}
              price={token.price}
              symbol={token.symbol}
              delay={index * 0.1}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

interface PriceCardWithDelayProps extends PriceCardProps {
  delay: number;
}

function PriceCard({ name, price, symbol, delay }: PriceCardWithDelayProps) {
  // Determine color based on symbol
  const getPriceColor = (symbol: string) => {
    switch (symbol) {
      case 'cUSD':
        return 'text-green-400'; // Green for stable USD
      case 'cGHS':
        return 'text-yellow-400'; // Yellow for Ghanaian Cedi
      case 'cNaira':
        return 'text-blue-400'; // Blue for Nigerian Naira
      case 'cZAR':
        return 'text-orange-400'; // Orange for South African Rand
      default:
        return 'text-green-400';
    }
  };

  return (
    <div 
      className="bg-gray-900/80 backdrop-blur-sm rounded-2xl p-6 pb-8 border border-gray-700/50 shadow-lg animate-slide-up w-full h-[150px] hover:bg-gray-800/80 transition-all duration-300"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="flex items-center justify-between mb-6">
        <span className="text-white text-base font-medium font-['Clash Display', 'sans-serif']">{name}</span>
        <div className="w-5 h-5 flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7 17L17 7M17 7H7M17 7V17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
      <div className={`text-4xl font-bold font-['Clash Display', 'sans-serif'] ${getPriceColor(symbol)}`}>{price}</div>
    </div>
  );
}
