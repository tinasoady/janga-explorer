import { Narrow } from "@/components/narrow";

export default function Layout({ children }: LayoutProps<"/[lang]/espace-pro">) {
  return <Narrow>{children}</Narrow>;
}
