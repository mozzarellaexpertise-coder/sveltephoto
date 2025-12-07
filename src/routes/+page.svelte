<script>
    // Variables for holding the file, tracking the upload state, and the message
    let file;
    let message = "";
    let isLoading = false; // Tracks if the upload is currently running
    let uploadError = null; // Holds any error message
    let publicUrl = "";

    // Handles the file input change
    function handleFileChange(event) {
        uploadError = null; // Clear previous errors
        message = ""; // Clear previous messages
        publicUrl = "";    // Clear previous URL
        
        // Get the first file from the selected list
        file = event.target.files[0];
    }

    async function upload() {
        if (!file) {
            uploadError = "Hold on! You gotta select a file first, partner.";
            message = "";
            return;
        }

        isLoading = true; // Start the loading state
        uploadError = null; // Clear old errors

        const formData = new FormData();
        // The key must be "file" to match the server-side formData.get("file")
        formData.append("file", file); 

        try {
            // Send the file to the SvelteKit API route
            const res = await fetch("/api/photos", {
                method: "POST",
                body: formData // Sends the file as multipart/form-data
            });

            const data = await res.json();

            if (res.ok) {
                // Success!
                message = `Huzzah! Uploaded successfully!`;
                publicUrl = data.url;
                
                // Reset the form after successful upload
                document.getElementById('file-input').value = ''; 
                file = null;
            } else {
                // Server returned an error status (e.g., 400, 500)
                uploadError = `Dangit. Upload failed: ${data.error || 'Unknown Server Error'}`;
            }
        } catch (err) {
            // Network error (e.g., server is down)
            uploadError = `Oh no! Couldn't connect to the server: ${err.message}`;
        } finally {
            isLoading = false; // Always stop the loading state
        }
    }
</script>

<main style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ccc; border-radius: 8px;">
    <h2>🏞️ Supabase File Uploader</h2>
    <p>Select a file and hit 'Upload' to send it to your Supabase bucket using the secure SvelteKit endpoint.</p>

    <div style="display: flex; flex-direction: column; gap: 15px;">
        <input 
            type="file" 
            id="file-input"
            on:change={handleFileChange} 
            disabled={isLoading}
        />

        <button 
            on:click={upload} 
            disabled={isLoading || !file}
            style="padding: 10px; background-color: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer;"
        >
            {#if isLoading}
                Saddle Up... Uploading...
            {:else}
                Upload Photo ({file ? file.name : 'No file selected'})
            {/if}
        </button>
    </div>

    <hr style="margin: 20px 0;">

    {#if uploadError}
        <p style="color: red; font-weight: bold;">🚨 {uploadError}</p>
    {:else if message}
        <p style="color: green; font-weight: bold;">✅ {message}</p>
        <p><strong>Path:</strong> <a href="{publicUrl}" target="_blank">{publicUrl}</a></p>
    {/if}
</main>