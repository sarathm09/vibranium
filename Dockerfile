FROM node:14.5.0-alpine3.10

MAINTAINER sarathm09

# create home directory
RUN mkdir /home/vibranium && cd /home/vibranium
WORKDIR /home/vibranium

# install vibranium
RUN npm i -g vibranium-cli

ENTRYPOINT [ "/bin/sh" ]
