import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

async function testConnection() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: Missing credentials in .env.local')
    process.exit(1)
  }

  console.log(`Checking connection to: ${supabaseUrl}...`)
  
  const supabase = createClient(supabaseUrl, supabaseKey)

  const { data, error } = await supabase.from('profiles').select('*').limit(1)

  if (error) {
    const isSetupError = error.code === '42P01' // relation does not exist
    if (isSetupError) {
      console.log('✅ Connection Successful!')
      console.log('⚠️  Note: The "profiles" table was not found. This is normal if you haven\'t run the setup.sql script yet.')
    } else {
      console.error('❌ Connection Failed:', error.message)
    }
  } else {
    console.log('✅ Connection Successful! Verified and table found.')
  }
}

testConnection()
