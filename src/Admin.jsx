
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'

export default function Admin() {
  const [password, setPassword] = useState('')
  const [loggedIn, setLoggedIn] = useState(false)
  const [players, setPlayers] = useState([])
  const [editedPoints, setEditedPoints] = useState({})

  const ADMIN_PASSWORD = '12345678FG'

  useEffect(() => {
    if (loggedIn) {
      loadPlayers()
    }
  }, [loggedIn])

  async function loadPlayers() {
    const { data } = await supabase
      .from('players')
      .select('*')
      .order('id')

    setPlayers(data || [])

    const pointsMap = {}

    data?.forEach((player) => {
      pointsMap[player.id] = player.points
    })

    setEditedPoints(pointsMap)
  }

  async function updatePlayerPoints(playerId) {
    const points = Number(editedPoints[playerId])

    const { error } = await supabase
      .from('players')
      .update({ points })
      .eq('id', playerId)

    if (!error) {
      loadPlayers()
    }
  }

  async function resetSeason() {
    const confirmReset = confirm(
      'متأكد؟ سيتم تصفير النقاط ومسح جميع الاختيارات'
    )

    if (!confirmReset) return

    await supabase
      .from('players')
      .update({ points: 0 })
      .gt('id', 0)

    await supabase
      .from('picks')
      .delete()
      .gt('id', 0)

    loadPlayers()

    alert('تم تصفير الموسم بنجاح')
  }

  if (!loggedIn) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="bg-zinc-900 p-6 rounded-2xl w-96">
          <h1 className="text-2xl font-bold mb-4">
            صفحة الأدمن
          </h1>

          <input
            type="password"
            placeholder="كلمة السر"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 rounded-xl bg-zinc-800 mb-3"
          />

          <button
            onClick={() => {
              if (password === ADMIN_PASSWORD) {
                setLoggedIn(true)
              } else {
                alert('كلمة السر غلط')
              }
            }}
            className="w-full bg-green-600 p-3 rounded-xl"
          >
            دخول
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="max-w-5xl mx-auto">

        <h1 className="text-4xl font-bold mb-8">
          ⚙️ لوحة التحكم
        </h1>

        <button
          onClick={resetSeason}
          className="bg-red-600 hover:bg-red-700 px-5 py-3 rounded-xl mb-8"
        >
          🗑️ تصفير الموسم
        </button>

        <div className="grid gap-4">
          {players.map((player) => (
            <div
              key={player.id}
              className="bg-zinc-900 p-4 rounded-xl flex justify-between items-center"
            >
              <div>
                <div className="font-bold text-lg">
                  {player.name}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={editedPoints[player.id] ?? 0}
                  onChange={(e) =>
                    setEditedPoints({
                      ...editedPoints,
                      [player.id]: e.target.value,
                    })
                  }
                  className="bg-zinc-800 p-2 rounded w-24 text-center"
                />

                <button
                  onClick={() =>
                    updatePlayerPoints(player.id)
                  }
                  className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
                >
                  حفظ
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}

