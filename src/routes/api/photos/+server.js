// C:\svelte-upload-test\src\routes\api\photos\+server.js

// 🚨 1. IMPORT SECRETS & CLIENT 🚨
// We use $env/static/private to securely get environment variables
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { createClient } from "@supabase/supabase-js";
import { redirect } from '@sveltejs/kit';

// Define the name of your bucket
const BUCKET_NAME = "myphotos"; 

// 2. INITIALIZE SUPABASE CLIENT
// This uses your secret keys imported from the .env file via SvelteKit's $env module.
const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY 
);

// 3. HELPER FOR JSON RESPONSES
// Ensures all successful or error responses are sent back as valid JSON, 
// which prevents the "Unexpected token '<'" (HTML) error on the frontend.
const jsonResponse = (body, status = 200) => {
    return new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" }
    });
};

// --- HANDLERS ---

// 4. GET HANDLER: Handles requests when someone types the URL in the browser.
// This prevents the "GET Method Not Allowed" error.
export function GET() {
    // If someone tries to browse this URL, we'll just redirect them back home.
    throw redirect(302, '/'); 
    
    // ALTERNATIVE: Send a Method Not Allowed error (405) instead of redirecting:
    // return jsonResponse(
    //     { error: "This API endpoint is for file uploads only. Use the POST method." },
    //     405 
    // );
}

// 5. POST HANDLER: Handles the actual file upload request from the frontend.
export async function POST({ request }) {
    try {
        const formData = await request.formData();
        const file = formData.get("file");

        // Input Validation: Ensures a valid File object was actually sent.
        if (!file || !(file instanceof File)) {
            return jsonResponse({ error: "No file found. Make sure the input name is 'file'." }, 400);
        }

        // Create a unique file path using a timestamp and a cleaned filename.
        // This is important to prevent accidental overwrites.
        const uniqueFileName = `${Date.now()}-${file.name.replace(/[^a-z0-9.]/gi, '_')}`;
        const filePath = `photos/${uniqueFileName}`;
        
        // Upload the file to Supabase Storage
        const { data, error: uploadError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(filePath, file, { 
                upsert: false, // Prevents overwriting files with the same name
                contentType: file.type // Set the MIME type
            });

        // Handle Supabase Upload Error
        if (uploadError) {
            console.error("Supabase Upload Error:", uploadError);
            throw uploadError;
        }

        // Get the Public URL for the uploaded file
        const { publicUrl, error: urlError } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(data.path);

        if (urlError) throw urlError;

        // Success Response: Send the public URL back to the client
        return jsonResponse({ url: publicUrl, path: data.path }, 200);

    } catch (err) {
        // Catch-all for any other unexpected errors (network, database connection, etc.)
        console.error("Server processing error:", err.message);
        return jsonResponse({ 
            error: `Darn! Upload failed due to a server mess-up: ${err.message}` 
        }, 500);
    }
}