import { Narrow } from "@/components/narrow";

export default function Layout({ children }: LayoutProps<"/[lang]/profil">) {
  return <Narrow>{children}</Narrow>;
}
