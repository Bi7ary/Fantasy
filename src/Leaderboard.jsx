
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import { Link } from 'react-router-dom'

export default function Leaderboard() {
  const [leaders, setLeaders] = useState([])

  useEffect(() => {
    loadLeaderboard()
  }, [])

  async function loadLeaderboard() {
    const { data: users } = await supabase
      .from('fantasy_users')
      .select('*')

    const { data: picks } = await supabase
      .from('picks')
      .select('*')

    const { data: players } = await supabase
      .from('players')
      .select('*')

    const result = users.map((user) => {
      const userPicks = picks.filter(
        (pick) => pick.user_id === user.id
      )

      const pickedPlayers = userPicks.map((pick) => {
        const player = players.find(
          (p) => p.id === pick.player_id
        )

        return {
          name: player?.name || '',
          points: player?.points || 0,
        }
      })

      const totalPoints = pickedPlayers.reduce(
        (sum, p) => sum + p.points,
        0
      )

      return {
        id: user.id,
        name: user.name,
        totalPoints,
        pickedPlayers,
      }
    })

    result.sort((a, b) => b.totalPoints - a.totalPoints)

    setLeaders(result)
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: "url('/BACKGROUND2.jpg')",
      }}
    >
      <div className="min-h-screen bg-black/70 text-white p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-center">
            🏆 الترتيب
          </h1>

          <div className="flex justify-center mb-6">
            <Link
              to="/"
              className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-xl"
            >
              ⬅️ الرجوع للرئيسية
            </Link>
          </div>

          <div className="space-y-4">
            {leaders.map((user, index) => (
              <div
                key={user.id}
                className="bg-zinc-900/80 rounded-2xl p-5"
              >
                <div className="flex justify-between mb-3">
                  <h2 className="text-xl font-bold">
                    #{index + 1} - {user.name}
                  </h2>

                  <span className="text-green-400 font-bold">
                    {user.totalPoints} نقطة
                  </span>
                </div>

                <div className="space-y-2">
                  {user.pickedPlayers.map((player) => (
                    <div
                      key={player.name}
                      className="flex justify-between text-zinc-300"
                    >
                      <span>{player.name}</span>
                      <span>{player.points}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  )
}

