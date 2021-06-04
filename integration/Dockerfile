FROM jenkins/jenkins:lts

# Specify custom update center
ARG LOCAL_IP=127.0.0.1
ENV JENKINS_UC="http://$LOCAL_IP:3000"
ENV JENKINS_UC_EXPERIMENTAL="http://$LOCAL_IP:3000/experimental"
ENV JENKINS_PLUGIN_INFO="http://$LOCAL_IP:3000/current/plugin-versions.json"

# Install plugins
COPY plugins.txt /usr/share/jenkins/ref/plugins.txt

# Deprecated plugins.txt
#RUN /usr/local/bin/install-plugins.sh < /usr/share/jenkins/ref/plugins.txt

# https://github.com/jenkinsci/plugin-installation-manager-tool
RUN jenkins-plugin-cli --verbose -f /usr/share/jenkins/ref/plugins.txt
