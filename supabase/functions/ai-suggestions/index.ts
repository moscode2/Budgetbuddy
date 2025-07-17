import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
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
    const path = url.pathname.replace('/functions/v1/ai-suggestions', '')

    if (req.method === 'POST' && path === '') {
      // Generate AI suggestions
      const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
      
      if (!openaiApiKey) {
        return new Response(
          JSON.stringify({ error: 'OpenAI API key not configured' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Get user's recent financial data
      const currentDate = new Date()
      const threeMonthsAgo = new Date(currentDate.getFullYear(), currentDate.getMonth() - 3, 1)
      
      const { data: recentTransactions } = await supabaseClient
        .from('transactions')
        .select(`
          *,
          categories (name, type, color)
        `)
        .eq('user_id', user.id)
        .gte('date', threeMonthsAgo.toISOString().split('T')[0])
        .order('date', { ascending: false })

      const { data: budgets } = await supabaseClient
        .from('budgets')
        .select(`
          *,
          categories (name, type, color)
        `)
        .eq('user_id', user.id)
        .eq('year', currentDate.getFullYear())

      // Calculate spending patterns
      const totalIncome = recentTransactions
        ?.filter(t => t.type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0

      const totalExpenses = recentTransactions
        ?.filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0

      // Category spending analysis
      const categorySpending = recentTransactions
        ?.filter(t => t.type === 'expense')
        .reduce((acc, transaction) => {
          const categoryName = transaction.categories.name
          if (!acc[categoryName]) {
            acc[categoryName] = 0
          }
          acc[categoryName] += parseFloat(transaction.amount)
          return acc
        }, {} as Record<string, number>) || {}

      const topSpendingCategories = Object.entries(categorySpending)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)

      // Budget vs actual spending
      const budgetAnalysis = budgets?.map(budget => {
        const spent = categorySpending[budget.categories.name] || 0
        return {
          category: budget.categories.name,
          budgeted: budget.amount,
          spent,
          overBudget: spent > budget.amount,
          percentage: (spent / budget.amount) * 100
        }
      }) || []

      // Create prompt for OpenAI
      const prompt = `
        As a personal finance advisor, analyze this user's spending data and provide 3-5 personalized financial suggestions:

        Financial Summary (Last 3 months):
        - Total Income: $${totalIncome.toFixed(2)}
        - Total Expenses: $${totalExpenses.toFixed(2)}
        - Net Savings: $${(totalIncome - totalExpenses).toFixed(2)}
        - Savings Rate: ${totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100).toFixed(1) : 0}%

        Top Spending Categories:
        ${topSpendingCategories.map(([category, amount]) => `- ${category}: $${amount.toFixed(2)}`).join('\n')}

        Budget Performance:
        ${budgetAnalysis.map(b => `- ${b.category}: $${b.spent.toFixed(2)} / $${b.budgeted.toFixed(2)} (${b.percentage.toFixed(1)}%) ${b.overBudget ? '⚠️ Over Budget' : '✅'}`).join('\n')}

        Please provide:
        1. Specific actionable advice based on their spending patterns
        2. Budget optimization suggestions
        3. Savings opportunities they might be missing
        4. Any concerning trends you notice

        Keep suggestions practical, encouraging, and specific to their data. Format as a JSON array of suggestion objects with 'title', 'description', and 'type' fields.
      `

      try {
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: 'You are a helpful personal finance advisor. Always respond with valid JSON containing an array of financial suggestions.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            max_tokens: 1000,
            temperature: 0.7
          })
        })

        if (!openaiResponse.ok) {
          throw new Error(`OpenAI API error: ${openaiResponse.status}`)
        }

        const aiData: OpenAIResponse = await openaiResponse.json()
        const suggestionsText = aiData.choices[0]?.message?.content

        let suggestions
        try {
          suggestions = JSON.parse(suggestionsText)
        } catch {
          // Fallback if AI doesn't return valid JSON
          suggestions = [
            {
              title: "Review Your Spending",
              description: "Based on your recent transactions, consider reviewing your spending patterns to identify areas for improvement.",
              type: "general"
            }
          ]
        }

        // Store suggestions in database
        const suggestionPromises = suggestions.map((suggestion: any) => 
          supabaseClient
            .from('ai_suggestions')
            .insert({
              user_id: user.id,
              suggestion_text: `${suggestion.title}: ${suggestion.description}`,
              suggestion_type: suggestion.type || 'general'
            })
        )

        await Promise.all(suggestionPromises)

        return new Response(
          JSON.stringify({
            suggestions,
            financialSummary: {
              totalIncome,
              totalExpenses,
              netSavings: totalIncome - totalExpenses,
              savingsRate: totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100) : 0
            },
            topSpendingCategories: topSpendingCategories.map(([category, amount]) => ({
              category,
              amount
            })),
            budgetAnalysis
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )

      } catch (aiError) {
        console.error('AI Error:', aiError)
        
        // Provide fallback suggestions based on data analysis
        const fallbackSuggestions = []
        
        if (totalExpenses > totalIncome) {
          fallbackSuggestions.push({
            title: "Reduce Expenses",
            description: "Your expenses exceed your income. Consider reviewing your spending and cutting unnecessary costs.",
            type: "warning"
          })
        }

        if (topSpendingCategories.length > 0) {
          const [topCategory, topAmount] = topSpendingCategories[0]
          fallbackSuggestions.push({
            title: `Monitor ${topCategory} Spending`,
            description: `${topCategory} is your highest expense category at $${topAmount.toFixed(2)}. Look for ways to optimize this spending.`,
            type: "category"
          })
        }

        const overBudgetCategories = budgetAnalysis.filter(b => b.overBudget)
        if (overBudgetCategories.length > 0) {
          fallbackSuggestions.push({
            title: "Budget Overspending Alert",
            description: `You're over budget in ${overBudgetCategories.length} categories. Consider adjusting your spending or budget limits.`,
            type: "budget"
          })
        }

        return new Response(
          JSON.stringify({
            suggestions: fallbackSuggestions,
            note: "AI suggestions temporarily unavailable, showing data-based recommendations",
            financialSummary: {
              totalIncome,
              totalExpenses,
              netSavings: totalIncome - totalExpenses,
              savingsRate: totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100) : 0
            }
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    if (req.method === 'GET' && path === '') {
      // Get stored suggestions
      const { data: suggestions, error } = await supabaseClient
        .from('ai_suggestions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

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
        JSON.stringify({ suggestions }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

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