"use client"
import Head from 'next/head'
import { useRouter } from 'next/navigation'

export default function Page() {
  const router = useRouter()
    router.push('/dashboard')

  return (
  <div>
   <Head>
     <title>BlackChain Token</title>
   </Head>
  </div>
  )
}
