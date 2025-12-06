<script>
  let file;
  let uploadedUrl = '';

  async function upload() {
    if (!file) return;

    const res = await fetch('/api/photos/upload', {
      method: 'POST',
      body: await file.arrayBuffer(),
      headers: {
        'x-file-name': file.name
      }
    });

    const data = await res.json();
    uploadedUrl = data.url ?? 'Error: ' + data.error;
  }
</script>

<input type="file" bind:this={file} on:change="{e => file = e.target.files[0]}" />
<button on:click={upload}>Upload</button>

{#if uploadedUrl}
  <p>Uploaded: <a href={uploadedUrl} target="_blank">{uploadedUrl}</a></p>
{/if}