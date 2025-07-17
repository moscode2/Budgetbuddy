import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get authenticated user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const url = new URL(req.url)
    const path = url.pathname.replace('/functions/v1/analytics', '')
    const searchParams = url.searchParams

    switch (path) {
      case '/monthly': {
        const year = searchParams.get('year') || new Date().getFullYear().toString()
        const month = searchParams.get('month') || (new Date().getMonth() + 1).toString()

        // Get monthly transactions
        const startDate = `${year}-${month.padStart(2, '0')}-01`
        const nextMonth = parseInt(month) === 12 ? 1 : parseInt(month) + 1
        const nextYear = parseInt(month) === 12 ? parseInt(year) + 1 : parseInt(year)
        const endDate = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-01`

        const { data: transactions, error } = await supabaseClient
          .from('transactions')
          .select(`
            *,
            categories (
              id,
              name,
              color,
              icon,
              type
            )
          `)
          .eq('user_id', user.id)
          .gte('date', startDate)
          .lt('date', endDate)

        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        // Calculate totals
        const income = transactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + parseFloat(t.amount), 0)

        const expenses = transactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + parseFloat(t.amount), 0)

        const netSavings = income - expenses

        // Group by day for daily spending chart
        const dailyData = transactions.reduce((acc, transaction) => {
          const date = transaction.date
          const existing = acc.find(item => item.date === date)
          
          if (existing) {
            if (transaction.type === 'income') {
              existing.income += parseFloat(transaction.amount)
            } else {
              existing.expenses += parseFloat(transaction.amount)
            }
          } else {
            acc.push({
              date,
              income: transaction.type === 'income' ? parseFloat(transaction.amount) : 0,
              expenses: transaction.type === 'expense' ? parseFloat(transaction.amount) : 0
            })
          }
          return acc
        }, [])

        return new Response(
          JSON.stringify({
            period: `${year}-${month.padStart(2, '0')}`,
            summary: {
              income,
              expenses,
              netSavings
            },
            dailyData: dailyData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
            transactionCount: transactions.length
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      case '/categories': {
        const startDate = searchParams.get('start_date')
        const endDate = searchParams.get('end_date')
        const type = searchParams.get('type') || 'expense'

        let query = supabaseClient
          .from('transactions')
          .select(`
            amount,
            type,
            categories (
              id,
              name,
              color,
              icon
            )
          `)
          .eq('user_id', user.id)
          .eq('type', type)

        if (startDate) query = query.gte('date', startDate)
        if (endDate) query = query.lte('date', endDate)

        const { data: transactions, error } = await query

        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        // Group by category
        const categoryData = transactions.reduce((acc, transaction) => {
          const categoryName = transaction.categories.name
          const existing = acc.find(item => item.name === categoryName)
          
          if (existing) {
            existing.value += parseFloat(transaction.amount)
            existing.count += 1
          } else {
            acc.push({
              name: categoryName,
              value: parseFloat(transaction.amount),
              count: 1,
              color: transaction.categories.color,
              icon: transaction.categories.icon
            })
          }
          return acc
        }, [])

        // Sort by value descending
        categoryData.sort((a, b) => b.value - a.value)

        const totalAmount = categoryData.reduce((sum, cat) => sum + cat.value, 0)

        return new Response(
          JSON.stringify({
            type,
            categories: categoryData,
            totalAmount,
            period: {
              startDate: startDate || 'all-time',
              endDate: endDate || 'all-time'
            }
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      case '/net-savings': {
        const period = searchParams.get('period') || 'monthly' // monthly, yearly, all-time
        const year = searchParams.get('year') || new Date().getFullYear().toString()

        let query = supabaseClient
          .from('transactions')
          .select('amount, type, date')
          .eq('user_id', user.id)

        if (period === 'yearly') {
          query = query
            .gte('date', `${year}-01-01`)
            .lt('date', `${parseInt(year) + 1}-01-01`)
        } else if (period === 'monthly') {
          const month = searchParams.get('month') || (new Date().getMonth() + 1).toString()
          const startDate = `${year}-${month.padStart(2, '0')}-01`
          const nextMonth = parseInt(month) === 12 ? 1 : parseInt(month) + 1
          const nextYear = parseInt(month) === 12 ? parseInt(year) + 1 : parseInt(year)
          const endDate = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-01`
          
          query = query.gte('date', startDate).lt('date', endDate)
        }

        const { data: transactions, error } = await query

        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        const income = transactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + parseFloat(t.amount), 0)

        const expenses = transactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + parseFloat(t.amount), 0)

        const netSavings = income - expenses
        const savingsRate = income > 0 ? (netSavings / income) * 100 : 0

        // Calculate trend data for chart
        let trendData = []
        if (period === 'monthly') {
          // Group by day
          trendData = transactions.reduce((acc, transaction) => {
            const date = transaction.date
            const existing = acc.find(item => item.date === date)
            
            if (existing) {
              if (transaction.type === 'income') {
                existing.income += parseFloat(transaction.amount)
              } else {
                existing.expenses += parseFloat(transaction.amount)
              }
              existing.netSavings = existing.income - existing.expenses
            } else {
              const income = transaction.type === 'income' ? parseFloat(transaction.amount) : 0
              const expenses = transaction.type === 'expense' ? parseFloat(transaction.amount) : 0
              acc.push({
                date,
                income,
                expenses,
                netSavings: income - expenses
              })
            }
            return acc
          }, [])
        } else if (period === 'yearly') {
          // Group by month
          trendData = transactions.reduce((acc, transaction) => {
            const month = transaction.date.substring(0, 7) // YYYY-MM
            const existing = acc.find(item => item.month === month)
            
            if (existing) {
              if (transaction.type === 'income') {
                existing.income += parseFloat(transaction.amount)
              } else {
                existing.expenses += parseFloat(transaction.amount)
              }
              existing.netSavings = existing.income - existing.expenses
            } else {
              const income = transaction.type === 'income' ? parseFloat(transaction.amount) : 0
              const expenses = transaction.type === 'expense' ? parseFloat(transaction.amount) : 0
              acc.push({
                month,
                income,
                expenses,
                netSavings: income - expenses
              })
            }
            return acc
          }, [])
        }

        return new Response(
          JSON.stringify({
            period,
            summary: {
              income,
              expenses,
              netSavings,
              savingsRate
            },
            trendData: trendData.sort((a, b) => {
              const dateA = period === 'monthly' ? a.date : a.month
              const dateB = period === 'monthly' ? b.date : b.month
              return new Date(dateA).getTime() - new Date(dateB).getTime()
            })
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      case '/dashboard': {
        // Get comprehensive dashboard data
        const currentDate = new Date()
        const currentMonth = currentDate.getMonth() + 1
        const currentYear = currentDate.getFullYear()

        // Current month transactions
        const startDate = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`
        const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1
        const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear
        const endDate = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-01`

        const { data: monthlyTransactions } = await supabaseClient
          .from('transactions')
          .select(`
            *,
            categories (name, color, icon)
          `)
          .eq('user_id', user.id)
          .gte('date', startDate)
          .lt('date', endDate)

        // All-time totals
        const { data: allTransactions } = await supabaseClient
          .from('transactions')
          .select('amount, type')
          .eq('user_id', user.id)

        // Recent transactions
        const { data: recentTransactions } = await supabaseClient
          .from('transactions')
          .select(`
            *,
            categories (name, color, icon)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10)

        // Budget summary
        const { data: budgets } = await supabaseClient
          .from('budgets')
          .select(`
            *,
            categories (name, color, icon)
          `)
          .eq('user_id', user.id)
          .eq('year', currentYear)

        // Calculate metrics
        const monthlyIncome = monthlyTransactions
          ?.filter(t => t.type === 'income')
          .reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0

        const monthlyExpenses = monthlyTransactions
          ?.filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0

        const totalIncome = allTransactions
          ?.filter(t => t.type === 'income')
          .reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0

        const totalExpenses = allTransactions
          ?.filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0

        return new Response(
          JSON.stringify({
            currentMonth: {
              income: monthlyIncome,
              expenses: monthlyExpenses,
              netSavings: monthlyIncome - monthlyExpenses
            },
            allTime: {
              income: totalIncome,
              expenses: totalExpenses,
              netSavings: totalIncome - totalExpenses
            },
            recentTransactions: recentTransactions || [],
            budgetCount: budgets?.length || 0,
            transactionCount: allTransactions?.length || 0
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Analytics endpoint not found' }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})