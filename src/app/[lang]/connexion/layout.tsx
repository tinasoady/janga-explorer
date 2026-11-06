import { Narrow } from "@/components/narrow";

export default function Layout({ children }: LayoutProps<"/[lang]/connexion">) {
  return <Narrow>{children}</Narrow>;
}
