import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

interface EmailData {
  to: string
  subject: string
  html: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const url = new URL(req.url)
    const path = url.pathname.replace('/functions/v1/notifications', '')

    switch (path) {
      case '/budget-alerts': {
        // Check for budget overspending and send alerts
        const currentDate = new Date()
        const currentMonth = currentDate.getMonth() + 1
        const currentYear = currentDate.getFullYear()

        // Get all users with budgets
        const { data: budgets } = await supabaseClient
          .from('budgets')
          .select(`
            *,
            profiles (name, email),
            categories (name, color)
          `)
          .eq('year', currentYear)
          .eq('month', currentMonth)

        if (!budgets) {
          return new Response(
            JSON.stringify({ message: 'No budgets found' }),
            { 
              status: 200, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        const alerts = []

        // Check each budget for overspending
        for (const budget of budgets) {
          const startDate = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`
          const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1
          const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear
          const endDate = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-01`

          const { data: transactions } = await supabaseClient
            .from('transactions')
            .select('amount')
            .eq('user_id', budget.user_id)
            .eq('category_id', budget.category_id)
            .eq('type', 'expense')
            .gte('date', startDate)
            .lt('date', endDate)

          const spent = transactions?.reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0
          const percentage = (spent / budget.amount) * 100

          if (percentage >= 80) { // Alert at 80% and 100%
            alerts.push({
              userId: budget.user_id,
              userEmail: budget.profiles.email,
              userName: budget.profiles.name,
              category: budget.categories.name,
              budgeted: budget.amount,
              spent,
              percentage,
              isOverBudget: percentage > 100
            })
          }
        }

        // Send email alerts (would integrate with email service)
        const emailPromises = alerts.map(async (alert) => {
          const subject = alert.isOverBudget 
            ? `⚠️ Budget Exceeded: ${alert.category}`
            : `📊 Budget Alert: ${alert.category} (${alert.percentage.toFixed(0)}% used)`

          const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: ${alert.isOverBudget ? '#EF4444' : '#F59E0B'};">
                ${alert.isOverBudget ? '⚠️ Budget Exceeded' : '📊 Budget Alert'}
              </h2>
              <p>Hi ${alert.userName},</p>
              <p>Your <strong>${alert.category}</strong> spending has reached <strong>${alert.percentage.toFixed(1)}%</strong> of your monthly budget.</p>
              
              <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin: 0 0 10px 0;">Budget Summary</h3>
                <p style="margin: 5px 0;"><strong>Category:</strong> ${alert.category}</p>
                <p style="margin: 5px 0;"><strong>Budget:</strong> $${alert.budgeted.toFixed(2)}</p>
                <p style="margin: 5px 0;"><strong>Spent:</strong> $${alert.spent.toFixed(2)}</p>
                <p style="margin: 5px 0;"><strong>Remaining:</strong> $${(alert.budgeted - alert.spent).toFixed(2)}</p>
              </div>

              ${alert.isOverBudget 
                ? '<p style="color: #EF4444;"><strong>You have exceeded your budget for this category.</strong> Consider reviewing your spending or adjusting your budget.</p>'
                : '<p style="color: #F59E0B;"><strong>You\'re approaching your budget limit.</strong> Keep an eye on your spending for the rest of the month.</p>'
              }

              <p>Best regards,<br>Budget Buddy Team</p>
            </div>
          `

          // Here you would integrate with an email service like SendGrid, Resend, etc.
          console.log(`Would send email to ${alert.userEmail}: ${subject}`)
          
          return {
            to: alert.userEmail,
            subject,
            html,
            sent: true // Would be actual result from email service
          }
        })

        const emailResults = await Promise.all(emailPromises)

        return new Response(
          JSON.stringify({
            message: `Processed ${alerts.length} budget alerts`,
            alerts: alerts.length,
            emailsSent: emailResults.filter(r => r.sent).length
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      case '/monthly-report': {
        // Generate and send monthly financial reports
        const { userId } = await req.json()

        if (!userId) {
          return new Response(
            JSON.stringify({ error: 'User ID required' }),
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
          .eq('id', userId)
          .single()

        if (!profile) {
          return new Response(
            JSON.stringify({ error: 'User not found' }),
            { 
              status: 404, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        // Get last month's data
        const lastMonth = new Date()
        lastMonth.setMonth(lastMonth.getMonth() - 1)
        const year = lastMonth.getFullYear()
        const month = lastMonth.getMonth() + 1

        const startDate = `${year}-${month.toString().padStart(2, '0')}-01`
        const nextMonth = month === 12 ? 1 : month + 1
        const nextYear = month === 12 ? year + 1 : year
        const endDate = `${nextYear}-${nextMonth.toString().padStart(2, '0')}-01`

        // Get transactions
        const { data: transactions } = await supabaseClient
          .from('transactions')
          .select(`
            *,
            categories (name, color, icon)
          `)
          .eq('user_id', userId)
          .gte('date', startDate)
          .lt('date', endDate)

        const income = transactions
          ?.filter(t => t.type === 'income')
          .reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0

        const expenses = transactions
          ?.filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0

        const netSavings = income - expenses

        // Category breakdown
        const categorySpending = transactions
          ?.filter(t => t.type === 'expense')
          .reduce((acc, transaction) => {
            const categoryName = transaction.categories.name
            if (!acc[categoryName]) {
              acc[categoryName] = 0
            }
            acc[categoryName] += parseFloat(transaction.amount)
            return acc
          }, {} as Record<string, number>) || {}

        const topCategories = Object.entries(categorySpending)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)

        // Generate report email
        const monthName = lastMonth.toLocaleString('default', { month: 'long', year: 'numeric' })
        const subject = `📊 Your ${monthName} Financial Report`

        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #10B981;">📊 Monthly Financial Report</h1>
            <h2 style="color: #374151;">${monthName}</h2>
            
            <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0 0 15px 0; color: #374151;">Financial Summary</h3>
              <div style="display: flex; justify-content: space-between; margin: 10px 0;">
                <span><strong>Total Income:</strong></span>
                <span style="color: #10B981;">$${income.toFixed(2)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin: 10px 0;">
                <span><strong>Total Expenses:</strong></span>
                <span style="color: #EF4444;">$${expenses.toFixed(2)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin: 10px 0; border-top: 1px solid #D1D5DB; padding-top: 10px;">
                <span><strong>Net Savings:</strong></span>
                <span style="color: ${netSavings >= 0 ? '#10B981' : '#EF4444'};">$${netSavings.toFixed(2)}</span>
              </div>
            </div>

            ${topCategories.length > 0 ? `
              <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin: 0 0 15px 0; color: #374151;">Top Spending Categories</h3>
                ${topCategories.map(([category, amount]) => `
                  <div style="display: flex; justify-content: space-between; margin: 8px 0;">
                    <span>${category}</span>
                    <span>$${amount.toFixed(2)}</span>
                  </div>
                `).join('')}
              </div>
            ` : ''}

            <div style="background: #EFF6FF; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #1D4ED8;">💡 Quick Insights</h3>
              ${netSavings > 0 
                ? `<p style="color: #10B981;">Great job! You saved $${netSavings.toFixed(2)} this month.</p>`
                : `<p style="color: #EF4444;">You spent $${Math.abs(netSavings).toFixed(2)} more than you earned this month.</p>`
              }
              ${topCategories.length > 0 
                ? `<p>Your biggest expense category was <strong>${topCategories[0][0]}</strong> at $${topCategories[0][1].toFixed(2)}.</p>`
                : ''
              }
            </div>

            <p>Keep up the great work managing your finances!</p>
            <p>Best regards,<br>Budget Buddy Team</p>
          </div>
        `

        // Here you would send the actual email
        console.log(`Would send monthly report to ${profile.email}`)

        return new Response(
          JSON.stringify({
            message: 'Monthly report generated',
            recipient: profile.email,
            reportData: {
              period: monthName,
              income,
              expenses,
              netSavings,
              topCategories: topCategories.map(([category, amount]) => ({ category, amount }))
            }
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      case '/activity-reminder': {
        // Send reminders to users who haven't logged transactions recently
        const threeDaysAgo = new Date()
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

        // Get users who haven't added transactions in 3 days
        const { data: inactiveUsers } = await supabaseClient
          .from('profiles')
          .select(`
            id,
            name,
            email,
            transactions!inner(created_at)
          `)
          .lt('transactions.created_at', threeDaysAgo.toISOString())

        const reminders = inactiveUsers?.map(user => ({
          userId: user.id,
          email: user.email,
          name: user.name,
          lastActivity: user.transactions[0]?.created_at
        })) || []

        // Send reminder emails
        const reminderPromises = reminders.map(async (reminder) => {
          const subject = "💰 Don't forget to track your expenses!"
          
          const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #10B981;">💰 Budget Buddy Reminder</h2>
              <p>Hi ${reminder.name},</p>
              <p>We noticed you haven't logged any transactions recently. Consistent tracking is key to achieving your financial goals!</p>
              
              <div style="background: #EFF6FF; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin: 0 0 10px 0; color: #1D4ED8;">Quick Tips:</h3>
                <ul style="margin: 0; padding-left: 20px;">
                  <li>Log expenses as they happen</li>
                  <li>Set up budget categories for better tracking</li>
                  <li>Review your spending weekly</li>
                </ul>
              </div>

              <p>Take a few minutes today to update your transactions and stay on track with your budget!</p>
              <p>Best regards,<br>Budget Buddy Team</p>
            </div>
          `

          console.log(`Would send reminder to ${reminder.email}`)
          
          return {
            to: reminder.email,
            subject,
            html,
            sent: true
          }
        })

        const reminderResults = await Promise.all(reminderPromises)

        return new Response(
          JSON.stringify({
            message: `Sent ${reminders.length} activity reminders`,
            reminders: reminders.length,
            emailsSent: reminderResults.filter(r => r.sent).length
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Notification endpoint not found' }),
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