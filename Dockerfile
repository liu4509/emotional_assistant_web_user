
# 多阶段构建
# 基于 node 20 的镜像
FROM node:20.12.2-alpine AS build-stage
# 指定当前目录为容器内的 /app
WORKDIR /app
# 把 package.json 复制到容器里
COPY package*.json ./
# 设置淘宝的 npm registry
RUN npm config set registry https://registry.npmmirror.com/
# 下载依赖
RUN npm install
# 全部文件复制到容器里
COPY . .
# 构建
RUN npm run build

# 多阶段构建
FROM nginx:stable AS production-stage

COPY --from=build-stage /app/dist /usr/share/nginx/html
COPY --from=build-stage /app/nginx.conf /etc/nginx/conf.d/default.conf

# RUN apt install nginx-module-njs

# 容器暴露端口
EXPOSE 80
# 容器跑起来执行命令
CMD ["nginx", "-g", "daemon off;"]