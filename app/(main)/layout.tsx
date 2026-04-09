import { AppChrome } from "@/components/layout/AppChrome"

export default function MainShellLayout({ children }: { children: React.ReactNode }) {
  return <AppChrome>{children}</AppChrome>
}
