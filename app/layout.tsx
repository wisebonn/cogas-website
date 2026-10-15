import type { Metadata } from "next";
import "./cogas.css";

export const metadata: Metadata = {
  title: "COGAs Consultancy — Agribusiness Consulting",
  description:
    "Family-run agri-consultancy. Feasibility studies, agricultural research, actuarial risk, supply chain and digital solutions — under one roof.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}