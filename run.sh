docker build -t dragdropdemo .
docker run -d -p 4173:4173 dragdropdemo
xdg-open http://localhost:4173
