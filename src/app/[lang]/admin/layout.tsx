import { Narrow } from "@/components/narrow";

export default function Layout({ children }: LayoutProps<"/[lang]/admin">) {
  return <Narrow size="lg">{children}</Narrow>;
}
