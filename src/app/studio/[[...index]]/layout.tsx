export const metadata = {
  title: 'RootGrain Content Studio',
  description: 'Manage website content',
}

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
