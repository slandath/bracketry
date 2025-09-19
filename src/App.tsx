import { useEffect, useRef } from 'react'
import { createBracket } from './lib/lib.mjs'
import sampleData from './sample-data.json'

interface Player {
  id: string
  name?: string
  nationality?: string
  [key: string]: any
}

export default function App() {
  const bracketContainerRef = useRef<HTMLDivElement | null>(null)
  const bracketInstanceRef = useRef<any>(null)

  useEffect(() => {
    if (bracketContainerRef.current) {
      // Install bracket into this container
      bracketInstanceRef.current = createBracket(
        sampleData,                // initial_user_data
        bracketContainerRef.current, // wrapper element
        {
          // Example user options — add real ones later
          getNationalityHTML: (player: Player, _ctx: unknown) => `<span>${player.nationality ?? ''}</span>`
        }
      )
    }

    // Clean up on unmount
    return () => {
      bracketInstanceRef.current?.uninstall()
    }
  }, [])

  return (
    <div>
      <h1>March Madness Bracket</h1>
      {/* This div is where createBracket will render */}
      <div ref={bracketContainerRef} />
    </div>
  )
}