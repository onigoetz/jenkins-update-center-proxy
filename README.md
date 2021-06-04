# Jenkins Update Center Proxy

A mirror for Jenkins Update Center.

Caches all `.hpi` files locally for faster download next time.
Very practical if you want to build your CI environment on your CI environment.

This is currently a very simple configuration that is supposed to work in environments where Jenkins doesn't have internet access.

## Usage

### Starting the Proxy

The easiest to get started is to use the [docker image](https://hub.docker.com/r/onigoetz/jenkins-update-center-proxy)

```bash
docker run --rm -it -p 3000:3000 \
  -v "$PWD/cache:/cache" \
  -e LOCAL_UPDATE_CENTER=http://192.168.1.10:3000 \
  onigoetz/jenkins-update-center-proxy
```

Be extra careful, about setting `LOCAL_UPDATE_CENTER`, is this should be the public URL of where this Proxy will be exposed.
This is needed for redirects.

### Using the Proxy

In my case, I use it to build Jenkins Docker images with all plugins preinstalled, this is how it works :

```
# Define the update center
ENV JENKINS_UC="http://192.168.1.10:3000"
ENV JENKINS_UC_EXPERIMENTAL="http://192.168.1.10:3000/experimental"
ENV JENKINS_PLUGIN_INFO="http://192.168.1.10:3000/current/plugin-versions.json"

# Install plugins ( either with install-plugins.sh or jenkins-plugin-cli )
COPY plugins.txt /usr/share/jenkins/ref/plugins.txt
RUN /usr/local/bin/install-plugins.sh < /usr/share/jenkins/ref/plugins.txt
```

Notice that the URL is the same as the `LOCAL_UPDATE_CENTER` above.

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
