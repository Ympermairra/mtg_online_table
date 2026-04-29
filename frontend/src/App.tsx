import Lobby from './pages/Lobby'
import Game from './pages/Game'
import { useLobbyStore } from './store/lobbyStore'
import { useGameStore } from './store/gameStore'

export default function App() {
  const { currentRoomId, setCurrentRoom } = useLobbyStore()
  const setMyId = useGameStore((s) => s.setMyId)

  const handleJoined = (roomId: string, players: string[]) => {
    // Наш ID — последний вошедший (последний в списке)
    setMyId(players[players.length - 1])
    setCurrentRoom(roomId)
  }

  const handleLeave = () => setCurrentRoom(null)

  return currentRoomId
    ? <Game onLeave={handleLeave} />
    : <Lobby onJoined={handleJoined} />
}
