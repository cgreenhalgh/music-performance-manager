FROM node:8.11.2-stretch

RUN mkdir /srv/mpm 
COPY package.json /srv/mpm
WORKDIR /srv/mpm

RUN npm install 
#--no-bin-links
COPY bower.json .bowerrc /srv/mpm/
RUN npm install -g bower && \
    bower --allow-root install

COPY public /srv/mpm/public
COPY config.json /srv/mpm/
COPY lib /srv/mpm/lib

# template files
VOLUME /srv/mpm/templates/
# log files
VOLUME /srv/mpm/logs/

EXPOSE 3003

CMD ["node","lib/server.js","config.json"]