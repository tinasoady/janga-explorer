import { Narrow } from "@/components/narrow";

export default function Layout({ children }: LayoutProps<"/pro">) {
  return <Narrow>{children}</Narrow>;
}
