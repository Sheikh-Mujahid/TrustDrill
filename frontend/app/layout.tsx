import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata = {
  title: "eRTMAC-NWIS Demo",
  description: "Nearby Wells Intelligence System — SIH 26121 synthetic prototype",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
