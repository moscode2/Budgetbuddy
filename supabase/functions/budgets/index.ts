import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

interface BudgetRequest {
  category_id: string
  amount: number
  period: 'monthly' | 'yearly'
  month?: number
  year: number
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
    const path = url.pathname.replace('/functions/v1/budgets', '')
    const searchParams = url.searchParams

    switch (req.method) {
      case 'GET': {
        if (path === '/summary') {
          // Get budget summary with spending
          const currentDate = new Date()
          const currentMonth = currentDate.getMonth() + 1
          const currentYear = currentDate.getFullYear()

          const { data: budgets, error: budgetError } = await supabaseClient
            .from('budgets')
            .select(`
              *,
              categories (
                id,
                name,
                color,
                icon
              )
            `)
            .eq('user_id', user.id)
            .eq('year', currentYear)

          if (budgetError) {
            return new Response(
              JSON.stringify({ error: budgetError.message }),
              { 
                status: 400, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
              }
            )
          }

          // Calculate spending for each budget
          const budgetSummary = await Promise.all(
            budgets.map(async (budget) => {
              let startDate, endDate

              if (budget.period === 'monthly') {
                startDate = `${budget.year}-${String(budget.month).padStart(2, '0')}-01`
                const nextMonth = budget.month === 12 ? 1 : budget.month + 1
                const nextYear = budget.month === 12 ? budget.year + 1 : budget.year
                endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`
              } else {
                startDate = `${budget.year}-01-01`
                endDate = `${budget.year + 1}-01-01`
              }

              const { data: transactions } = await supabaseClient
                .from('transactions')
                .select('amount')
                .eq('user_id', user.id)
                .eq('category_id', budget.category_id)
                .eq('type', 'expense')
                .gte('date', startDate)
                .lt('date', endDate)

              const spent = transactions?.reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0
              const remaining = budget.amount - spent
              const percentage = (spent / budget.amount) * 100

              return {
                ...budget,
                spent,
                remaining,
                percentage,
                status: spent > budget.amount ? 'over' : spent > budget.amount * 0.8 ? 'warning' : 'good'
              }
            })
          )

          return new Response(
            JSON.stringify({ budgets: budgetSummary }),
            { 
              status: 200, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        if (path.startsWith('/')) {
          const id = path.substring(1)
          if (id) {
            // Get single budget
            const { data, error } = await supabaseClient
              .from('budgets')
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
              .eq('id', id)
              .eq('user_id', user.id)
              .single()

            if (error) {
              return new Response(
                JSON.stringify({ error: 'Budget not found' }),
                { 
                  status: 404, 
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
                }
              )
            }

            return new Response(
              JSON.stringify({ budget: data }),
              { 
                status: 200, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
              }
            )
          }
        }

        // Get all budgets with filters
        let query = supabaseClient
          .from('budgets')
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

        // Apply filters
        const period = searchParams.get('period')
        const year = searchParams.get('year')
        const month = searchParams.get('month')

        if (period) query = query.eq('period', period)
        if (year) query = query.eq('year', parseInt(year))
        if (month) query = query.eq('month', parseInt(month))

        query = query.order('created_at', { ascending: false })

        const { data, error } = await query

        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        return new Response(
          JSON.stringify({ budgets: data }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      case 'POST': {
        const { category_id, amount, period, month, year }: BudgetRequest = await req.json()

        // Validate required fields
        if (!category_id || !amount || !period || !year) {
          return new Response(
            JSON.stringify({ error: 'Missing required fields' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        // For monthly budgets, month is required
        if (period === 'monthly' && !month) {
          return new Response(
            JSON.stringify({ error: 'Month is required for monthly budgets' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        const { data, error } = await supabaseClient
          .from('budgets')
          .insert({
            user_id: user.id,
            category_id,
            amount,
            period,
            month: period === 'monthly' ? month : null,
            year
          })
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
          .single()

        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        return new Response(
          JSON.stringify({ 
            message: 'Budget created successfully',
            budget: data 
          }),
          { 
            status: 201, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      case 'PUT': {
        const id = path.substring(1)
        if (!id) {
          return new Response(
            JSON.stringify({ error: 'Budget ID required' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        const { category_id, amount, period, month, year }: BudgetRequest = await req.json()

        const { data, error } = await supabaseClient
          .from('budgets')
          .update({
            category_id,
            amount,
            period,
            month: period === 'monthly' ? month : null,
            year
          })
          .eq('id', id)
          .eq('user_id', user.id)
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
          .single()

        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        return new Response(
          JSON.stringify({ 
            message: 'Budget updated successfully',
            budget: data 
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      case 'DELETE': {
        const id = path.substring(1)
        if (!id) {
          return new Response(
            JSON.stringify({ error: 'Budget ID required' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        const { error } = await supabaseClient
          .from('budgets')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id)

        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        return new Response(
          JSON.stringify({ message: 'Budget deleted successfully' }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }),
          { 
            status: 405, 
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