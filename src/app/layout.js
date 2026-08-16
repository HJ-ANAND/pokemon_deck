import { Oswald, Poppins } from "next/font/google";
import "aos/dist/aos.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["500", "700"],
});

export const metadata = {
  title: "Pokémon Explorer | Elemental Index",
  description: "A Next.js recreation of the Pokémon Explorer interface.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} ${oswald.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
