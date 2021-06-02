# Jenkins Update Center Proxy

A mirror for Jenkins Update Center.

Caches all `.hpi` files that have a specific version, doesn't cache the ones with a `/latest/` version.

This is currently a very simple configuration that is supposed to work in environments where Jenkins doesn't have internet access.

## Usage

The easiest to get started is to use the docker image (for now by doing `git clone` and `docker build --tag=jenkins-proxy`)

```bash
docker run --rm -it -p 3000:3000 \
  -v "$PWD/cache:/cache" \
  -e LOCAL_UPDATE_CENTER=http://192.168.1.10:3000 \
  jenkins-proxy
```

## Options

| Variable               | Default value                 | Description                                                         |
| ---------------------- | ----------------------------- | ------------------------------------------------------------------- |
| `LOCAL_UPDATE_CENTER`  | `http://localhost:3000`       | The URL to this update center, needed to rewrite redirects and URLs |
| `REMOTE_UPDATE_CENTER` | `https://updates.jenkins.io/` | The update center to take the files from                            |
| `CACHE_DIR`            | `cache`                       | The cache dir, no need to change this within the Docker image       |
| `PORT`                 | `3000`                        | The port to listen on                                               |

## Testing

```bash
yarn install
LOCAL_UPDATE_CENTER=http://192.168.1.10:3000 node index.js &

cd integration
docker build --no-cache -t jenkins:jcasc . > build.txt 2>&1
```