const { createClient } = require('@supabase/supabase-js');

try {
  require('@next/env').loadEnvConfig(process.cwd());
} catch (e) {
  console.warn("⚠️ Warning: Failed to load environment variables via @next/env");
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false }
});

const targetEmail = "jhector.zamora@hotmail.com";
const defaultPassword = ['Tr0p1c4l', 'C0ntr4ct', 'S3cur1ty', '2026', '!'].join('-'); // Prompt the user to change this upon login

async function main() {
  console.log(`🚀 Starting provisioning for ${targetEmail}...`);
  
  // 1. Check if user exists in auth.users
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();
  if (authError) {
    console.error("❌ Error listing auth users:", authError);
    process.exit(1);
  }
  
  let authUser = authData.users.find(u => u.email === targetEmail);
  
  if (!authUser) {
    console.log(`👤 User not found in Supabase Auth. Creating new user...`);
    const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: targetEmail,
      password: defaultPassword,
      email_confirm: true,
      user_metadata: { full_name: "Hector Zamora" }
    });
    
    if (createError) {
      console.error("❌ Error creating auth user:", createError);
      process.exit(1);
    }
    
    authUser = createData.user;
    console.log(`✅ Auth user created successfully with ID: ${authUser.id}`);
  } else {
    console.log(`✅ Auth user already exists with ID: ${authUser.id}`);
  }
  
  // 2. Insert/Update the profile in profiles table
  console.log(`Checking if profile exists in profiles table...`);
  const { data: profiles, error: selectError } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('id', authUser.id);
    
  if (selectError) {
    console.error("❌ Error querying profiles table. Make sure the migration has been run on Supabase first!", selectError);
    process.exit(1);
  }
  
  if (!profiles || profiles.length === 0) {
    console.log(`Inserting profile with is_admin = true...`);
    const { error: insertError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authUser.id,
        email: targetEmail,
        full_name: "Hector Zamora",
        is_admin: true,
        tier: "pro"
      });
      
    if (insertError) {
      console.error("❌ Error inserting profile:", insertError);
      process.exit(1);
    }
    console.log(`🎉 Success! Profile created and admin access granted.`);
  } else {
    console.log(`Profile exists. Updating profile to set is_admin = true...`);
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        is_admin: true,
        tier: "pro"
      })
      .eq('id', authUser.id);
      
    if (updateError) {
      console.error("❌ Error updating profile:", updateError);
      process.exit(1);
    }
    console.log(`🎉 Success! Profile updated and admin access granted.`);
  }
  
  console.log(`\n========================================`);
  console.log(`Account details:`);
  console.log(`- Email: ${targetEmail}`);
  console.log(`- Temporary Password: ${defaultPassword}`);
  console.log(`========================================`);
}

main().catch(console.error);
