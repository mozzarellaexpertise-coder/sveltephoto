<script>
    // Variables for holding the file, tracking the upload state, and the message
    let file;
    let message = "";
    let isLoading = false; // Tracks if the upload is currently running
    let uploadError = null; // Holds any error message

    // This function runs when the file input changes
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
        formData.append("file", file); // Use 'file' as the key is common practice

        try {
            const res = await fetch("/api/photos", {
                method: "POST",
                body: formData
            });

            const data = await res.json();

            if (res.ok) {
                // Success!
                message = `Huzzah! Uploaded! URL: ${data.url}`;
                // Optional: Clear the file input here if you want
                file = null;
            } else {
                // Server returned an error status (e.g., 400, 500)
                uploadError = `Dangit. Upload failed with error: ${data.error || 'Unknown Server Error'}`;
            }
        } catch (err) {
            // Network error (e.g., server is down)
            uploadError = `Oh no! Couldn't connect to the server: ${err.message}`;
        } finally {
            isLoading = false; // Always stop the loading state
        }
    }
</script>

<h3>File Uploader</h3>

<input type="file" on:change={handleFileChange} />

<button 
    on:click={upload} 
    disabled={isLoading || !file}
>
    {#if isLoading}
        Saddle Up... Uploading...
    {:else}
        Upload Photo
    {/if}
</button>

<hr>

{#if uploadError}
    <p style="color: red;">🚨 {uploadError}</p>
{:else if message}
    <p style="color: green;">✅ {message}</p>
{/if}