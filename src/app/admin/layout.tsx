import { Narrow } from "@/components/narrow";

export default function Layout({ children }: LayoutProps<"/admin">) {
  return <Narrow size="lg">{children}</Narrow>;
}
