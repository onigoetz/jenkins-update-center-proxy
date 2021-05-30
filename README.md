# Jenkins Update Center Mirror

A mirror for Jenkins Update Center.

Caches all `.hpi` files that have a specific version, doesn't cache the ones with a `/latest/` version.

This is currently a very simple configuration that is supposed to work in environments where Jenkins doesn't have internet access.

## Options

| Variable               | Default value                 | Description                                                         |
| ---------------------- | ----------------------------- | ------------------------------------------------------------------- |
| `LOCAL_UPDATE_CENTER`  | `http://localhost:3000`       | The URL to this update center, needed to rewrite redirects and URLs |
| `REMOTE_UPDATE_CENTER` | `https://updates.jenkins.io/` | The update center to take the files from                            |
| `CACHE_DIR`            | `cache`                       | The cache dir, no need to change this within the Docker image       |
