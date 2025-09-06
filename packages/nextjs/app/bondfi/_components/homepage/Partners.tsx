"use client";

export function Partners() {
  const partners = [
    {
      name: "Ethereum Foundation",
      logo: "https://res.cloudinary.com/ecosheane/image/upload/v1756553000/ethereum-logo_tpbwfr.png",
    },
    {
      name: "Celo",
      logo: "https://res.cloudinary.com/ecosheane/image/upload/v1756553000/celo-logo_xnvzfn.png",
    },
    {
      name: "Polygon",
      logo: "https://res.cloudinary.com/ecosheane/image/upload/v1756553000/polygon-logo_qkfyxm.png",
    },
    {
      name: "Chainlink",
      logo: "https://res.cloudinary.com/ecosheane/image/upload/v1756553000/chainlink-logo_ygkfpx.png",
    },
    {
      name: "USDC",
      logo: "https://res.cloudinary.com/ecosheane/image/upload/v1756553000/usdc-logo_oqfyqr.png",
    },
    {
      name: "Aave",
      logo: "https://res.cloudinary.com/ecosheane/image/upload/v1756553000/aave-logo_vvd0iy.png",
    }
  ];

  return (
    <section id="partners" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-left mb-12">
          <h2 className="text-3xl font-bold mb-4">Our Technology Partners</h2>
          <p className="text-xl text-gray-600 max-w-3xl">
            We collaborate with industry leaders to provide secure and innovative financial solutions.
          </p>
        </div>

        <div className="relative overflow-hidden">
          <div className="flex animate-scroll">
            {/* First set of logos */}
            {partners.map((partner, index) => (
              <div key={`first-${index}`} className="flex items-center justify-center p-4 grayscale hover:grayscale-0 transition-all min-w-[200px]">
                <img 
                  src={partner.logo} 
                  alt={partner.name} 
                  className="h-12 object-contain"
                />
              </div>
            ))}
            {/* Duplicate set for seamless loop */}
            {partners.map((partner, index) => (
              <div key={`second-${index}`} className="flex items-center justify-center p-4 grayscale hover:grayscale-0 transition-all min-w-[200px]">
                <img 
                  src={partner.logo} 
                  alt={partner.name} 
                  className="h-12 object-contain"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
