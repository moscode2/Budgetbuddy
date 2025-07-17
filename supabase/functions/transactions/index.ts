import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

interface TransactionRequest {
  title: string
  amount: number
  type: 'income' | 'expense'
  category_id: string
  date: string
  notes?: string
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
    const path = url.pathname.replace('/functions/v1/transactions', '')
    const searchParams = url.searchParams

    switch (req.method) {
      case 'GET': {
        if (path.startsWith('/')) {
          const id = path.substring(1)
          if (id) {
            // Get single transaction
            const { data, error } = await supabaseClient
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
              .eq('id', id)
              .eq('user_id', user.id)
              .single()

            if (error) {
              return new Response(
                JSON.stringify({ error: 'Transaction not found' }),
                { 
                  status: 404, 
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
                }
              )
            }

            return new Response(
              JSON.stringify({ transaction: data }),
              { 
                status: 200, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
              }
            )
          }
        }

        // Get all transactions with filters
        let query = supabaseClient
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

        // Apply filters
        const type = searchParams.get('type')
        const category = searchParams.get('category')
        const startDate = searchParams.get('start_date')
        const endDate = searchParams.get('end_date')
        const limit = searchParams.get('limit')
        const offset = searchParams.get('offset')

        if (type) query = query.eq('type', type)
        if (category) query = query.eq('category_id', category)
        if (startDate) query = query.gte('date', startDate)
        if (endDate) query = query.lte('date', endDate)

        query = query.order('date', { ascending: false })

        if (limit) query = query.limit(parseInt(limit))
        if (offset) query = query.range(parseInt(offset), parseInt(offset) + parseInt(limit || '10') - 1)

        const { data, error, count } = await query

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
            transactions: data,
            count,
            pagination: {
              limit: parseInt(limit || '10'),
              offset: parseInt(offset || '0')
            }
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      case 'POST': {
        const { title, amount, type, category_id, date, notes }: TransactionRequest = await req.json()

        // Validate required fields
        if (!title || !amount || !type || !category_id || !date) {
          return new Response(
            JSON.stringify({ error: 'Missing required fields' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        const { data, error } = await supabaseClient
          .from('transactions')
          .insert({
            user_id: user.id,
            title,
            amount,
            type,
            category_id,
            date,
            notes
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
            message: 'Transaction created successfully',
            transaction: data 
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
            JSON.stringify({ error: 'Transaction ID required' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        const { title, amount, type, category_id, date, notes }: TransactionRequest = await req.json()

        const { data, error } = await supabaseClient
          .from('transactions')
          .update({
            title,
            amount,
            type,
            category_id,
            date,
            notes
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
            message: 'Transaction updated successfully',
            transaction: data 
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
            JSON.stringify({ error: 'Transaction ID required' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        const { error } = await supabaseClient
          .from('transactions')
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
          JSON.stringify({ message: 'Transaction deleted successfully' }),
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