import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mathemagica Comics | Interactive Math Adventures",
  description: "Explore 'Mathemagica: The Comic Chronicles' – a fun, interactive way to learn math concepts through engaging comic book stories and animations.",
};

export default function BookLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 