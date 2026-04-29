import "./globals.css";
import Nav from "../components/Nav";
import Footer from "../components/Footer";

export const metadata = {
  title: "Project Panenka",
  description: "Tactical match intelligence and event-driven simulation engine.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="bg-veil" />
        <div className="bg-orb orb-one" />
        <div className="bg-orb orb-two" />
        <Nav />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
