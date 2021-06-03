# Jenkins Update Center Proxy

A mirror for Jenkins Update Center.

Caches all `.hpi` files locally for faster download next time.
Very practical if you want to build your CI environment on your CI environment.

This is currently a very simple configuration that is supposed to work in environments where Jenkins doesn't have internet access.

## Usage

The easiest to get started is to use the [docker image](https://hub.docker.com/r/onigoetz/jenkins-update-center-proxy)

```bash
docker run --rm -it -p 3000:3000 \
  -v "$PWD/cache:/cache" \
  -e LOCAL_UPDATE_CENTER=http://192.168.1.10:3000 \
  onigoetz/jenkins-update-center-proxy
```

## Options

| Variable               | Default value                 | Description                                                         |
| ---------------------- | ----------------------------- | ------------------------------------------------------------------- |
| `LOCAL_UPDATE_CENTER`  | `http://localhost:3000`       | The URL to this update center, needed to rewrite redirects and URLs |
| `REMOTE_UPDATE_CENTER` | `https://updates.jenkins.io/` | The update center to take the files from                            |
| `CACHE_DIR`            | `cache`                       | The cache dir, no need to change this within the Docker image       |
| `PORT`                 | `3000`                        | The port to listen on                                               |
| `HTTP_PROXY`           | `null`                        | If you're in a corporate environment that needs a proxy             |

## Testing

Currently we only have one integration test that starts the application, installs a few Jenkins plugins and checks that they are correctly cached.

```bash
yarn install
yarn test
```
