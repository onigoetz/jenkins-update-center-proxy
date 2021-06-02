FROM jenkins/jenkins:2.277.4-lts-jdk11

# Specify custom update center
ENV JENKINS_UC="http://192.168.1.10:3000"

# Install plugins
COPY plugins.txt /usr/share/jenkins/ref/plugins.txt
RUN /usr/local/bin/install-plugins.sh < /usr/share/jenkins/ref/plugins.txt
