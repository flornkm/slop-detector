import { create } from "zustand"

type State = {
  reading: number
  powered: boolean
  setReading: (n: number) => void
  setPowered: (v: boolean) => void
  togglePower: () => void
}

export const useStore = create<State>((set, get) => ({
  reading: 0,
  powered: false,
  setReading: (reading) => set({ reading }),
  setPowered: (powered) => set({ powered }),
  togglePower: () => set({ powered: !get().powered })
}))
