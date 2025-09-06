import "~~/styles/globals.css";
import { ScaffoldEthAppWithProviders } from "~~/components/ScaffoldEthAppWithProviders";

export const metadata = {
  title: "Bondfi - DeFi Platform",
  description: "Access to DeFi services including savings circles, marketplace, remittances, and more",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className="light">
      <body>
        <ScaffoldEthAppWithProviders>
          {children}
        </ScaffoldEthAppWithProviders>
      </body>
    </html>
  );
}
