import { redirect } from 'next/navigation'

export default function Home() {
  // Langsung redirect ke login tanpa useEffect
  redirect('/login')
}
