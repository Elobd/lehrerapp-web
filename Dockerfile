FROM node:22-alpine
# yt-dlp + ffmpeg: Videos für das Unterrichtsmaterial auf der NAS speichern
RUN apk add --no-cache python3 py3-pip ffmpeg ca-certificates \
 && pip install --no-cache-dir --break-system-packages -U yt-dlp
WORKDIR /app
COPY server/ ./server/
COPY web/ ./web/
RUN rm -f web/original.html
ENV PORT=8080 DATA_DIR=/data WEB_DIR=/app/web NODE_NO_WARNINGS=1
VOLUME /data
EXPOSE 8080
CMD ["node", "server/server.js"]
