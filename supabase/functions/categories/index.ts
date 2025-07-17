import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

interface CategoryRequest {
  name: string
  type: 'income' | 'expense'
  color: string
  icon: string
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

    const url = new URL(req.url)
    const path = url.pathname.replace('/functions/v1/categories', '')
    const searchParams = url.searchParams

    switch (req.method) {
      case 'GET': {
        if (path.startsWith('/')) {
          const id = path.substring(1)
          if (id) {
            // Get single category
            const { data, error } = await supabaseClient
              .from('categories')
              .select('*')
              .eq('id', id)
              .single()

            if (error) {
              return new Response(
                JSON.stringify({ error: 'Category not found' }),
                { 
                  status: 404, 
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
                }
              )
            }

            return new Response(
              JSON.stringify({ category: data }),
              { 
                status: 200, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
              }
            )
          }
        }

        // Get all categories with filters
        let query = supabaseClient
          .from('categories')
          .select('*')

        // Apply filters
        const type = searchParams.get('type')
        const isDefault = searchParams.get('is_default')

        if (type) query = query.eq('type', type)
        if (isDefault) query = query.eq('is_default', isDefault === 'true')

        query = query.order('name', { ascending: true })

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

        // Group by type for easier frontend consumption
        const groupedCategories = {
          income: data.filter(cat => cat.type === 'income'),
          expense: data.filter(cat => cat.type === 'expense')
        }

        return new Response(
          JSON.stringify({ 
            categories: data,
            grouped: groupedCategories
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      case 'POST': {
        // Only allow creating custom categories (non-default)
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

        const { name, type, color, icon }: CategoryRequest = await req.json()

        // Validate required fields
        if (!name || !type || !color || !icon) {
          return new Response(
            JSON.stringify({ error: 'Missing required fields' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        const { data, error } = await supabaseClient
          .from('categories')
          .insert({
            name,
            type,
            color,
            icon,
            is_default: false
          })
          .select('*')
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
            message: 'Category created successfully',
            category: data 
          }),
          { 
            status: 201, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      case 'PUT': {
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

        const id = path.substring(1)
        if (!id) {
          return new Response(
            JSON.stringify({ error: 'Category ID required' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        // Check if category is default (cannot be modified)
        const { data: existingCategory } = await supabaseClient
          .from('categories')
          .select('is_default')
          .eq('id', id)
          .single()

        if (existingCategory?.is_default) {
          return new Response(
            JSON.stringify({ error: 'Cannot modify default categories' }),
            { 
              status: 403, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        const { name, type, color, icon }: CategoryRequest = await req.json()

        const { data, error } = await supabaseClient
          .from('categories')
          .update({
            name,
            type,
            color,
            icon
          })
          .eq('id', id)
          .select('*')
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
            message: 'Category updated successfully',
            category: data 
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      case 'DELETE': {
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

        const id = path.substring(1)
        if (!id) {
          return new Response(
            JSON.stringify({ error: 'Category ID required' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        // Check if category is default (cannot be deleted)
        const { data: existingCategory } = await supabaseClient
          .from('categories')
          .select('is_default')
          .eq('id', id)
          .single()

        if (existingCategory?.is_default) {
          return new Response(
            JSON.stringify({ error: 'Cannot delete default categories' }),
            { 
              status: 403, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        // Check if category is being used in transactions or budgets
        const { data: transactions } = await supabaseClient
          .from('transactions')
          .select('id')
          .eq('category_id', id)
          .limit(1)

        const { data: budgets } = await supabaseClient
          .from('budgets')
          .select('id')
          .eq('category_id', id)
          .limit(1)

        if (transactions?.length || budgets?.length) {
          return new Response(
            JSON.stringify({ 
              error: 'Cannot delete category that is being used in transactions or budgets' 
            }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        const { error } = await supabaseClient
          .from('categories')
          .delete()
          .eq('id', id)

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
          JSON.stringify({ message: 'Category deleted successfully' }),
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