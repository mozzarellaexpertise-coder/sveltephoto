// C:\svelte-upload-test\src\routes\api\photos\+server.js

import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { createClient } from '@supabase/supabase-js';
import { redirect } from '@sveltejs/kit';

const BUCKET_NAME = "myphotos"; // Make sure your bucket is named exactly this!

// Initialize Supabase client using the secure Service Role Key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Helper for JSON responses
const jsonResponse = (body, status = 200) => {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' }
    });
};

// GET: Just redirect home (Good practice for API endpoints)
export function GET() {
    throw redirect(302, '/');
}

// POST: Handle the file upload
export async function POST({ request }) {
    try {
        // 1. Get the file from the form data
        const formData = await request.formData();
        const file = formData.get("file");

        if (!file || !(file instanceof File)) {
            return jsonResponse({ error: "No file found. Make sure the input name is 'file'." }, 400);
        }

        // 2. Create a unique file path
        // Removes all non-alphanumeric characters except periods and replaces with '_'
        const safeFileName = file.name.replace(/[^a-z0-9.]/gi, '_'); 
        const uniqueFileName = `${Date.now()}-${safeFileName}`;
        const filePath = `photos/${uniqueFileName}`; // Uploads to the 'photos' folder

        // 3. Upload the file to Supabase Storage
        const { data, error: uploadError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(filePath, file, {
                upsert: false, // Don't overwrite existing files
                contentType: file.type // Set the correct MIME type
            });

        if (uploadError) {
            console.error("Supabase Upload Error:", uploadError);
            // Return only the error message, not the full error object
            return jsonResponse({ error: uploadError.message || 'File upload failed.' }, 500); 
        }

        // 4. Get the public URL for the newly uploaded file
        const { publicUrl } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(data.path);

        // 5. Success! Return the URL
        return jsonResponse({ url: publicUrl, path: data.path }, 200);

    } catch (err) {
        console.error("Server error:", err.message);
        return jsonResponse({ error: `Upload failed: ${err.message}` }, 500);
    }
}