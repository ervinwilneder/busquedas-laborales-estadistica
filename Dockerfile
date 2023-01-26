FROM node
WORKDIR /usr/src/app
COPY . .

RUN apt-get update

# chrome
RUN curl -LO  https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
RUN apt-get install -y ./google-chrome-stable_current_amd64.deb
RUN rm google-chrome-stable_current_amd64.deb

# nodejs
RUN cd /usr/src/app && npm install

# python
RUN apt-get install python -y
RUN apt-get install python3-pip -y
RUN pip3 install -r requirements.txt
RUN pip3 install --upgrade pytube

CMD ["make", "run"]