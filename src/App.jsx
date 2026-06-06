import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import { Link } from 'react-router-dom'

function App() {
  const [players, setPlayers] = useState([])
  const [users, setUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState('')
  const [guestName, setGuestName] = useState('')
  const [currentUserId, setCurrentUserId] = useState(null)
  const [selectedPlayers, setSelectedPlayers] = useState([])
  const [saved, setSaved] = useState(false)
  const [teamLocked, setTeamLocked] = useState(false)  
  const [leaderboard, setLeaderboard] = useState([])

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const { data: playersData } = await supabase
      .from('players')
      .select('*')
      .order('name')

    const { data: usersData } = await supabase
      .from('fantasy_users')
      .select('*')
      .order('name')

    setPlayers(playersData || [])
    setUsers(usersData || [])
    await loadLeaderboard()
  }

  async function loadExistingTeam(userId) {
    const { data } = await supabase
      .from('picks')
      .select('*')
      .eq('user_id', userId)

    if (data && data.length > 0) {
      setSelectedPlayers(data.map(p => p.player_id))
      setSaved(true)
      setTeamLocked(true)
    } else {
      setSelectedPlayers([])
      setSaved(false)
      setTeamLocked(false)
    }
  }

  async function loadLeaderboard() {
    const { data: usersData } = await supabase
      .from('fantasy_users')
      .select('*')

    const { data: picksData } = await supabase
      .from('picks')
      .select('*')

    const { data: playersData } = await supabase
      .from('players')
      .select('*')

    const results = usersData.map((user) => {
      const userPicks = picksData.filter(
        (pick) => pick.user_id === user.id
      )

      let total = 0

      userPicks.forEach((pick) => {
        const player = playersData.find(
          (p) => p.id === pick.player_id
        )

        if (player) {
          total += player.points
        }
      })

      return {
        name: user.name,
        points: total,
      }
    })

    results.sort((a, b) => b.points - a.points)
    setLeaderboard(results)
  }

  async function handleContinue() {
    if (!selectedUser) {
      alert('اختر اسمك')
      return
    }

    if (selectedUser === 'guest') {
      if (!guestName.trim()) {
        alert('اكتب اسمك')
        return
      }

      const { data: existingUser } = await supabase
        .from('fantasy_users')
        .select('*')
        .eq('name', guestName.trim())
        .maybeSingle()

      if (existingUser) {
        setCurrentUserId(existingUser.id)
        await loadExistingTeam(existingUser.id)
        return
      }

      const { data, error } = await supabase
        .from('fantasy_users')
        .insert([
          {
            name: guestName.trim(),
            is_guest: true,
          },
        ])
        .select()
        .single()

      if (error) {
        console.log(error)
        alert('حصل خطأ')
        return
      }

      // تصحيح: أخذ الـ id من الـ data الجديدة الراجع من الـ insert
      setCurrentUserId(data.id)
      await loadExistingTeam(data.id)
      return
    }

    const userId = Number(selectedUser)
    setCurrentUserId(userId)
    await loadExistingTeam(userId)
  }

  function togglePlayer(playerId) {
    if (teamLocked) return
    const exists = selectedPlayers.includes(playerId)

    if (exists) {
      setSelectedPlayers(
        selectedPlayers.filter((id) => id !== playerId)
      )
      return
    }

    if (selectedPlayers.length >= 3) {
      alert('مسموح باختيار 3 لاعيبة فقط')
      return
    }

    setSelectedPlayers([...selectedPlayers, playerId])
  }

  async function saveTeam() {
    if (selectedPlayers.length !== 3) {
      alert('لازم تختار 3 لاعيبة')
      return
    }

    const { data: existing } = await supabase
      .from('picks')
      .select('*')
      .eq('user_id', currentUserId)

    if (existing && existing.length > 0) {
      alert('تم حفظ تشكيلتك بالفعل')
      return
    }

    const rows = selectedPlayers.map((playerId) => ({
      user_id: currentUserId,
      player_id: playerId,
    }))

    const { error } = await supabase
      .from('picks')
      .insert(rows)

    if (error) {
      console.log(error)
      alert('حصل خطأ أثناء الحفظ')
      return
    }

    setSaved(true)
    setTeamLocked(true) // تحديث فوري ليقفل التشكيلة ويعرض شاشة النجاح
    alert('تم حفظ التشكيلة بنجاح')
  }

  return (
   <div
  className="min-h-screen text-white p-6 bg-cover bg-center bg-no-repeat"
  style={{
    backgroundImage: "url('/background.jpg')",
  }}
>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">
          ⚽ فنتازي حَجزة الجمعة
        </h1>
        
        <div className="flex justify-center gap-3 mb-8">
          <Link
            to="/leaderboard"
            className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded-xl"
          >
            🏆 الترتيب
          </Link>

          <Link
            to="/admin"
            className="bg-zinc-700 hover:bg-zinc-600 px-4 py-2 rounded-xl"
          >
            ⚙️ الأدمن
          </Link>
        </div>

        <div className="max-w-md mx-auto mb-8">
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="w-full p-3 rounded-xl bg-zinc-900 border border-zinc-700"
          >
            <option value="">اختر اسمك</option>

            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}

            <option value="guest">
              + من خارج الحجزة
            </option>
          </select>

          {selectedUser === 'guest' && (
            <input
              type="text"
              placeholder="اكتب اسمك"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className="w-full mt-3 p-3 rounded-xl bg-zinc-900 border border-zinc-700"
            />
          )}

          <button
            onClick={handleContinue}
            className="w-full mt-3 bg-green-600 hover:bg-green-700 rounded-xl p-3"
          >
            متابعة
          </button>

          {currentUserId && (
            <div className="mt-4 text-center text-green-400">
              تم اختيار المستخدم رقم {currentUserId}
            </div>
          )}
        </div>

        {currentUserId && (
          <>
            {!teamLocked ? (
              <>
                <div className="text-center mb-6 text-xl">
                  اختر 3 لاعيبة ({selectedPlayers.length}/3)
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {players.map((player) => {
                    const selected = selectedPlayers.includes(player.id)

                    return (
                      <button
                        key={player.id}
                        onClick={() => togglePlayer(player.id)}
                        className={`p-5 rounded-2xl border text-right transition ${
                          selected
                            ? 'bg-green-600 border-green-400'
                            : 'bg-zinc-900 border-zinc-800 hover:border-zinc-600'
                        }`}
                      >
                        <h2 className="text-xl font-bold">
                          {player.name}
                        </h2>

                        <p className="text-zinc-300 mt-2">
                          النقاط: {player.points}
                        </p>
                      </button>
                    )
                  })}
                </div>

                <div className="mt-6 text-center">
                  <button
                    onClick={saveTeam}
                    className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-xl"
                  >
                    حفظ التشكيلة
                  </button>

                  {saved && (
                    <div className="mt-3 text-green-400">
                      تم حفظ التشكيلة ✅
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center mt-10">
                <div className="text-3xl mb-4">
                  ✅ تم حفظ تشكيلتك بنجاح
                </div>

                <p className="text-zinc-400 mb-6">
                  تابع الترتيب بعد انتهاء الحجزة
                </p>

                <Link
                  to="/leaderboard"
                  className="bg-yellow-600 hover:bg-yellow-700 px-6 py-3 rounded-xl"
                >
                  🏆 صفحة الترتيب
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default App
