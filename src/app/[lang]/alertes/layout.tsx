import { Narrow } from "@/components/narrow";

export default function Layout({ children }: LayoutProps<"/[lang]/alertes">) {
  return <Narrow>{children}</Narrow>;
}
