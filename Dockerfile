FROM node:14.5.0-alpine3.10

RUN mkdir /home/vibranium && cd /home/vibranium
WORKDIR /home/vibranium

RUN apk update && \
    apk add git xmlstartlet && \ 
    npm i -g vibranium-cli

ENTRYPOINT [ "/bin/sh" ]