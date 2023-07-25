FROM node
WORKDIR /app
COPY package.json .
COPY yarn.lock .
COPY dist/ dist/
RUN yarn add -D vite
EXPOSE 4173
CMD ["yarn", "preview","--host"]
