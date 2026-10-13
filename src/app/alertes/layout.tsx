import { Narrow } from "@/components/narrow";

export default function Layout({ children }: LayoutProps<"/alertes">) {
  return <Narrow>{children}</Narrow>;
}
