import { Narrow } from "@/components/narrow";

export default function Layout({ children }: LayoutProps<"/[lang]/pro">) {
  return <Narrow>{children}</Narrow>;
}
