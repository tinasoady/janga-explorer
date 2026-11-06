import { Narrow } from "@/components/narrow";

export default function Layout({ children }: LayoutProps<"/espace-pro">) {
  return <Narrow>{children}</Narrow>;
}
