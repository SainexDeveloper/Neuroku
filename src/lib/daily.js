import { supabase } from './supabase'
import { generateSudoku } from './sudoku'

export async function ensureDailyExists() {
  const today = new Date().toISOString().slice(0, 10)

  const { data } = await supabase
    .from('daily_puzzles')
    .select('*')
    .eq('date', today)
    .single()

  if (data) return data

  const { puzzle, solution } = generateSudoku('medium')

  const { data: created } = await supabase
    .from('daily_puzzles')
    .insert({
      date: today,
      puzzle,
      solution,
      difficulty: 'medium'
    })
    .select()
    .single()

  return created
}