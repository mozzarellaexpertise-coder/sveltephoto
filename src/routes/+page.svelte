<script>
    // Variables for holding the file, tracking the upload state, and the message
    let file;
    let message = "";
    let isLoading = false; // Tracks if the upload is currently running
    let uploadError = null; // Holds any error message

    // Handles the file input change
    function handleFileChange(event) {
        uploadError = null; // Clear previous errors
        message = "";       // Clear previous messages
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
        // IMPORTANT: The key MUST match what the server expects (formData.get("file"))
        formData.append("file", file); 

        try {
            // This URL hits the backend route handler we define below
            const res = await fetch("/api/photos", {
                method: "POST",
                body: formData
            });

            const data = await res.json();

            if (res.ok) {
                // Success!
                message = `Huzzah! Uploaded! URL: ${data.url}`;
                // Optional: Reset the file input and clear the file variable
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

<main>
    <h2>🏞️ Supabase File Uploader</h2>
    <p>Select a file and hit 'Upload' to send it to your Supabase bucket.</p>

    <input 
        type="file" 
        id="file-input"
        on:change={handleFileChange} 
        disabled={isLoading}
    />

    <button 
        on:click={upload} 
        disabled={isLoading || !file}
    >
        {#if isLoading}
            Saddle Up... Uploading...
        {:else}
            Upload Photo ({file ? file.name : 'No file selected'})
        {/if}
    </button>

    <hr>

    {#if uploadError}
        <p style="color: red; font-weight: bold;">🚨 {uploadError}</p>
    {:else if message}
        <p style="color: green; font-weight: bold;">✅ {message}</p>
        <p><strong>Path:</strong> <a href="{message.replace('Huzzah! Uploaded! URL: ', '')}" target="_blank">View File</a></p>
    {/if}
</main>