"use client"

import Head from 'next/head'
import { useRouter } from 'next/navigation'

export default function Page() {
  const router = useRouter()
  router.replace('/index.html')

  return (
  <div>
   <Head>
     <title>BlackRock Token</title>
   </Head>
  </div>
  )
}
