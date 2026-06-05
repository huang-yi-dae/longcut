import { create } from 'zustand'

interface PlayAllState {
  // 状态
  isPlayingAll: boolean
  playAllIndex: number
  // 操作
  setIsPlayingAll: (value: boolean) => void
  setPlayAllIndex: (value: number) => void
  resetPlayAll: () => void
  nextInPlayAll: () => void
}

const usePlayAllStore = create<PlayAllState>((set) => ({
  isPlayingAll: false,
  playAllIndex: 0,
  setIsPlayingAll: (value) => set({ isPlayingAll: value }),
  setPlayAllIndex: (value) => set({ playAllIndex: value }),
  resetPlayAll: () => set({ isPlayingAll: false, playAllIndex: 0 }),
  nextInPlayAll: () => set((state) => ({ playAllIndex: state.playAllIndex + 1 })),
}))

export default usePlayAllStore
