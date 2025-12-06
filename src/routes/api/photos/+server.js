// C:\svelte-upload-test\src\routes\api\photos\+server.js

// 1️⃣ IMPORT ENV AND SUPABASE CLIENT
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '$env/static/private';
import { createClient } from "@supabase/supabase-js";
import { redirect } from '@sveltejs/kit';

// 2️⃣ BUCKET NAME
const BUCKET_NAME = "myphotos";

// 3️⃣ INITIALIZE SUPABASE CLIENT
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 4️⃣ JSON RESPONSE HELPER
const jsonResponse = (body, status = 200) =>
    new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" }
    });

// 5️⃣ GET HANDLER: redirect browser requests
export function GET() {
    throw redirect(302, '/'); 
    // Or return Method Not Allowed:
    // return jsonResponse({ error: "Use POST to upload files" }, 405);
}

// 6️⃣ POST HANDLER: handle file uploads
export async function POST({ request }) {
    try {
        const formData = await request.formData();
        const file = formData.get("file");

        // Validate file
        if (!file || !(file instanceof File)) {
            return jsonResponse({ error: "No file found. Input name must be 'file'." }, 400);
        }

        // Make a unique filename
        const uniqueFileName = `${Date.now()}-${file.name.replace(/[^a-z0-9.]/gi, '_')}`;
        const filePath = `photos/${uniqueFileName}`;

        // Upload to Supabase
        const { data, error: uploadError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(filePath, file, { upsert: false, contentType: file.type });

        if (uploadError) throw uploadError;

        // Get public URL
        const { publicUrl, error: urlError } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(data.path);

        if (urlError) throw urlError;

        return jsonResponse({ url: publicUrl, path: data.path }, 200);

    } catch (err) {
        console.error("Upload failed:", err.message);
        return jsonResponse({
            error: `Upload failed: ${err.message}`
        }, 500);
    }
}