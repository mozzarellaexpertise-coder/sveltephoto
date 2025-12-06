// C:\svelte-upload-test\src\routes\api\photos\+server.js

import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';
import { createClient } from '@supabase/supabase-js';
import { redirect } from '@sveltejs/kit';

const BUCKET_NAME = "myphotos";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Helper for JSON responses
const jsonResponse = (body, status = 200) => {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' }
    });
};

// GET: redirect home (prevents GET errors)
export function GET() {
    throw redirect(302, '/');
}

// POST: handle file upload
export async function POST({ request }) {
    try {
        const formData = await request.formData();
        const file = formData.get("file");

        if (!file || !(file instanceof File)) {
            return jsonResponse({ error: "No file found. Make sure the input name is 'file'." }, 400);
        }

        const uniqueFileName = `${Date.now()}-${file.name.replace(/[^a-z0-9.]/gi, '_')}`;
        const filePath = `photos/${uniqueFileName}`;

        const { data, error: uploadError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(filePath, file, {
                upsert: false,
                contentType: file.type
            });

        if (uploadError) {
            console.error("Supabase Upload Error:", uploadError);
            return jsonResponse({ error: uploadError.message }, 500);
        }

        const { publicUrl, error: urlError } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(data.path);

        if (urlError) {
            return jsonResponse({ error: urlError.message }, 500);
        }

        return jsonResponse({ url: publicUrl, path: data.path }, 200);

    } catch (err) {
        console.error("Server error:", err.message);
        return jsonResponse({ error: `Upload failed: ${err.message}` }, 500);
    }
}