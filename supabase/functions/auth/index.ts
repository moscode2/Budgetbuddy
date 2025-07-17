import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

interface RegisterRequest {
  email: string
  password: string
  name: string
}

interface LoginRequest {
  email: string
  password: string
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
    const path = url.pathname.replace('/functions/v1/auth', '')

    switch (`${req.method} ${path}`) {
      case 'POST /register': {
        const { email, password, name }: RegisterRequest = await req.json()

        // Register user with Supabase Auth
        const { data: authData, error: authError } = await supabaseClient.auth.signUp({
          email,
          password,
        })

        if (authError) {
          return new Response(
            JSON.stringify({ error: authError.message }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        // Create user profile
        if (authData.user) {
          const { error: profileError } = await supabaseClient
            .from('profiles')
            .insert({
              id: authData.user.id,
              name,
              email,
            })

          if (profileError) {
            return new Response(
              JSON.stringify({ error: 'Failed to create user profile' }),
              { 
                status: 400, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
              }
            )
          }
        }

        return new Response(
          JSON.stringify({
            message: 'User registered successfully',
            user: authData.user,
            session: authData.session
          }),
          { 
            status: 201, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      case 'POST /login': {
        const { email, password }: LoginRequest = await req.json()

        const { data, error } = await supabaseClient.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        // Get user profile
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single()

        return new Response(
          JSON.stringify({
            message: 'Login successful',
            user: data.user,
            session: data.session,
            profile
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      case 'POST /logout': {
        const { error } = await supabaseClient.auth.signOut()

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
          JSON.stringify({ message: 'Logout successful' }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      case 'GET /profile': {
        const { data: { user } } = await supabaseClient.auth.getUser()

        if (!user) {
          return new Response(
            JSON.stringify({ error: 'Unauthorized' }),
            { 
              status: 401, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        const { data: profile, error } = await supabaseClient
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (error) {
          return new Response(
            JSON.stringify({ error: 'Profile not found' }),
            { 
              status: 404, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        return new Response(
          JSON.stringify({ profile }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Route not found' }),
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